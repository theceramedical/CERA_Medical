import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { handleCloudflareCart } from './commerce.ts';

import type { D1Database, D1Result, D1Statement } from './runtime.ts';

const { getCloudflareDatabase } = vi.hoisted(() => ({ getCloudflareDatabase: vi.fn() }));

vi.mock('./runtime.ts', () => ({ getCloudflareDatabase }));

const cartId = '11111111-1111-4111-8111-111111111111';
const sku = 'CR-MOL-1021';

function createDatabase(initialQuantity: number | null) {
  let quantity = initialQuantity;
  const upsertQueries: string[] = [];

  const database: D1Database = {
    prepare(query: string): D1Statement {
      let bindings: unknown[] = [];
      const statement: D1Statement = {
        bind(...values) {
          bindings = values;
          return statement;
        },
        first<Row>() {
          if (query.includes('SELECT sku FROM commerce_products'))
            return Promise.resolve({ sku } as Row);
          if (query.includes('SELECT id, checked_out_order_id FROM commerce_carts')) {
            return Promise.resolve({ id: cartId, checked_out_order_id: null } as Row);
          }
          return Promise.resolve(null);
        },
        all<Row>() {
          const results =
            quantity === null
              ? []
              : [
                  {
                    sku,
                    title: 'Example product',
                    price_minor: 1000,
                    quantity,
                  },
                ];
          return Promise.resolve({ results: results as Row[] });
        },
        run(): Promise<D1Result> {
          if (query.includes('INSERT INTO commerce_cart_items')) {
            upsertQueries.push(query);
            const [, , requestedQuantity] = bindings as [string, string, number];
            if (quantity === null) {
              quantity = requestedQuantity;
              return Promise.resolve({ meta: { changes: 1 } });
            }
            if (quantity + requestedQuantity > 99) return Promise.resolve({ meta: { changes: 0 } });
            quantity += requestedQuantity;
            return Promise.resolve({ meta: { changes: 1 } });
          }
          return Promise.resolve({ meta: { changes: 1 } });
        },
      };
      return statement;
    },
    batch<T extends D1Statement[]>(statements: T) {
      return Promise.resolve(
        statements.map(() => ({ meta: { changes: 1 } })) as {
          [K in keyof T]: D1Result;
        },
      );
    },
  };

  return { database, getQuantity: () => quantity, upsertQueries };
}

function addRequest(quantity: number): Request {
  return new Request('https://www.ceramedical.org/v1/cart/lines', {
    method: 'POST',
    headers: {
      origin: 'https://www.ceramedical.org',
      cookie: `__Host-cera_cart=${cartId}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ slug: sku, quantity }),
  });
}

describe('Cloudflare cart quantity limit', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_CHECKOUT_ENABLED', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('saves a first add', async () => {
    const { database, getQuantity } = createDatabase(null);
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCart(addRequest(2));

    expect(response?.status).toBe(200);
    expect(getQuantity()).toBe(2);
    await expect(response?.json()).resolves.toMatchObject({
      lines: [{ slug: sku, quantity: 2 }],
    });
  });

  it('saves a valid cumulative add', async () => {
    const { database, getQuantity } = createDatabase(5);
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCart(addRequest(3));

    expect(response?.status).toBe(200);
    expect(getQuantity()).toBe(8);
    await expect(response?.json()).resolves.toMatchObject({
      lines: [{ slug: sku, quantity: 8 }],
    });
  });

  it('accepts an addition that brings the cumulative quantity to exactly 99', async () => {
    const { database, getQuantity } = createDatabase(98);
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCart(addRequest(1));

    expect(response?.status).toBe(200);
    expect(getQuantity()).toBe(99);
    await expect(response?.json()).resolves.toMatchObject({
      lines: [{ slug: sku, quantity: 99 }],
    });
  });

  it('rejects an over-limit cumulative add without changing the saved quantity', async () => {
    const { database, getQuantity, upsertQueries } = createDatabase(98);
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCart(addRequest(2));

    expect(response?.status).toBe(409);
    await expect(response?.json()).resolves.toEqual({ error: 'cart_quantity_limit_exceeded' });
    expect(getQuantity()).toBe(98);
    expect(upsertQueries[0]).toContain(
      'WHERE commerce_cart_items.quantity + excluded.quantity <= 99',
    );
  });
});
