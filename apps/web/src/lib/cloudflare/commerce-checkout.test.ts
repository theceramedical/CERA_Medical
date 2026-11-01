import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as checkoutPost } from '../../app/api/checkout/[...action]/route.ts';

import { handleCloudflareCheckout, handleCloudflareCheckoutConfirmation } from './commerce.ts';

import type { D1Database, D1Result, D1Statement } from './runtime.ts';

const { getCloudflareDatabase } = vi.hoisted(() => ({ getCloudflareDatabase: vi.fn() }));

vi.mock('./runtime.ts', () => ({ getCloudflareDatabase }));

const cartId = '11111111-1111-4111-8111-111111111111';

function createDatabase(options?: {
  readonly existingOrder?: string;
  readonly confirmedOrder?: string;
  readonly items?: readonly object[];
}) {
  const batches: { queries: string[]; bindings: unknown[][] }[] = [];
  const items = options?.items ?? [
    { sku: 'CERA-WELL-01', title: 'Mosscent', price_minor: 60_000, quantity: 2 },
  ];
  const database: D1Database = {
    prepare(query: string): D1Statement {
      let bindings: unknown[] = [];
      const statement: D1Statement = {
        bind(...values) {
          bindings = values;
          return statement;
        },
        first<Row>() {
          if (
            query.includes('SELECT o.order_code FROM commerce_carts') &&
            !query.includes('o.checkout_cart_id = c.id')
          ) {
            return Promise.resolve(
              options?.existingOrder ? ({ order_code: options.existingOrder } as Row) : null,
            );
          }
          if (query.includes('AS email_count'))
            return Promise.resolve({ email_count: 1, ip_count: 1 } as Row);
          if (query.includes('o.checkout_cart_id = c.id'))
            return Promise.resolve(
              options?.confirmedOrder ? ({ order_code: options.confirmedOrder } as Row) : null,
            );
          return Promise.resolve(null as Row | null);
        },
        all<Row>() {
          return Promise.resolve({ results: [...items] as Row[] });
        },
        run() {
          return Promise.resolve({ meta: { changes: 1 } });
        },
      };
      Object.defineProperty(statement, '__query', { value: query });
      Object.defineProperty(statement, '__bindings', { get: () => bindings });
      return statement;
    },
    batch<T extends D1Statement[]>(statements: T) {
      batches.push({
        queries: statements.map(
          (statement) => (statement as D1Statement & { __query: string }).__query,
        ),
        bindings: statements.map(
          (statement) => (statement as D1Statement & { __bindings: unknown[] }).__bindings,
        ),
      });
      return Promise.resolve(
        statements.map(() => ({ meta: { changes: 1 } })) as { [K in keyof T]: D1Result },
      );
    },
  };
  return { database, batches };
}

function checkoutRequest(
  overrides: Record<string, unknown> = {},
  cookie = `__Host-cera_cart=${cartId}`,
  origin = 'https://www.ceramedical.org',
): Request {
  return new Request('https://www.ceramedical.org/api/checkout/complete', {
    method: 'POST',
    headers: {
      origin,
      cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: 'buyer@example.test',
      fullName: 'Buyer Example',
      paymentMethod: 'cod',
      deliveryAddress: {
        streetLine1: '12 Main Road',
        city: 'Haripur',
        province: 'Khyber Pakhtunkhwa',
        postalCode: '22620',
        phoneNumber: '03001234567',
      },
      ...overrides,
    }),
  });
}

describe('Cloudflare guest COD checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_CHECKOUT_ENABLED', 'true');
    vi.stubEnv('ENQUIRY_RATE_LIMIT_SALT', 'test-only-rate-limit-salt');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('creates a COD order and exact order lines without a customer account', async () => {
    const { database, batches } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCheckout(checkoutRequest());
    const body = (await response?.json()) as { orderCode: string };
    const batch = batches.find((candidate) =>
      candidate.queries.some((query) => query.includes('INSERT INTO commerce_orders')),
    );
    expect(batch).toBeDefined();
    const orderIndex = batch?.queries.findIndex((query) =>
      query.includes('INSERT INTO commerce_orders'),
    );
    const itemIndex = batch?.queries.findIndex((query) =>
      query.includes('INSERT INTO commerce_order_items'),
    );

    expect(response?.status).toBe(200);
    expect(body.orderCode).toMatch(/^CERA-/);
    expect(batch?.queries[orderIndex ?? -1]).toContain("'CASH_ON_DELIVERY', 'PENDING'");
    expect(batch?.bindings[orderIndex ?? -1]?.[3]).toBe('buyer@example.test');
    expect(batch?.bindings[orderIndex ?? -1]?.[8]).toBeNull();
    expect(batch?.bindings[orderIndex ?? -1]?.[9]).toBe(cartId);
    expect(batch?.bindings[itemIndex ?? -1]).toMatchObject([
      expect.any(String),
      expect.any(String),
      'CERA-WELL-01',
      'Mosscent',
      60_000,
      2,
      120_000,
    ]);
  });

  it('returns the existing order for an idempotent repeat without writing another batch', async () => {
    const { database, batches } = createDatabase({ existingOrder: 'CERA-EXISTING-01' });
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCheckout(checkoutRequest());

    await expect(response?.json()).resolves.toEqual({ orderCode: 'CERA-EXISTING-01' });
    expect(batches).toHaveLength(0);
  });

  it('rejects payment methods other than COD', async () => {
    const { database, batches } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCheckout(checkoutRequest({ paymentMethod: 'test' }));

    expect(response?.status).toBe(422);
    await expect(response?.json()).resolves.toEqual({ error: 'cash_on_delivery_only' });
    expect(batches).toHaveLength(0);
  });

  it('keeps checkout disabled when the global gate is off', async () => {
    const { database, batches } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);
    vi.stubEnv('NEXT_PUBLIC_CHECKOUT_ENABLED', 'false');

    const response = await handleCloudflareCheckout(checkoutRequest());

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toEqual({ error: 'checkout_unavailable' });
    expect(batches).toHaveLength(0);
  });

  it('rejects a cross-origin checkout submission', async () => {
    const { database, batches } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareCheckout(
      checkoutRequest({}, `__Host-cera_cart=${cartId}`, 'https://attacker.example'),
    );

    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toEqual({ error: 'forbidden' });
    expect(batches).toHaveLength(0);
  });

  it('returns 410 for the retired Safepay start route', async () => {
    const response = await checkoutPost(checkoutRequest(), {
      params: Promise.resolve({ action: ['safepay', 'start'] }),
    });

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({ error: 'checkout_method_unavailable' });
  });

  it('confirms an order only for the browser cart that owns it', async () => {
    const { database } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);
    const response = await handleCloudflareCheckoutConfirmation(
      new Request(`https://www.ceramedical.org/api/checkout/confirmation?order=CERA-OTHER-CART`, {
        headers: { cookie: `__Host-cera_cart=${cartId}` },
      }),
    );

    expect(response?.status).toBe(404);
    await expect(response?.json()).resolves.toEqual({ error: 'order_not_found' });
  });

  it('confirms a persisted order linked to this browser cart', async () => {
    const { database } = createDatabase({ confirmedOrder: 'CERA-MY-CART-01' });
    getCloudflareDatabase.mockResolvedValue(database);
    const response = await handleCloudflareCheckoutConfirmation(
      new Request('https://www.ceramedical.org/api/checkout/confirmation?order=CERA-MY-CART-01', {
        headers: { cookie: `__Host-cera_cart=${cartId}` },
      }),
    );

    expect(response?.status).toBe(200);
    await expect(response?.json()).resolves.toEqual({ orderCode: 'CERA-MY-CART-01' });
  });
});
