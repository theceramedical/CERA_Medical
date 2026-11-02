import { describe, expect, it } from 'vitest';

import { getCloudflarePublicProduct, listCloudflarePublicProducts } from './catalogue.ts';

import type { D1Database, D1Statement } from './runtime.ts';

function database(
  rows: readonly { sku: string; price_minor: number; enabled: number }[],
): D1Database {
  const statement = {
    bind(..._values: unknown[]) {
      return this;
    },
    all<Row>() {
      return Promise.resolve({ results: [...rows] as Row[] });
    },
    first<Row>(_columnName?: string) {
      return Promise.resolve(null as Row | null);
    },
    run() {
      return Promise.resolve({});
    },
  } satisfies D1Statement;
  return {
    prepare: () => statement,
    batch: <T extends D1Statement[]>(_statements: T) => Promise.reject(new Error('unused')),
  };
}

describe('Cloudflare D1 catalogue projection', () => {
  it('uses the D1 price and enables checkout only for an enabled row with the global gate on', async () => {
    const db = database([{ sku: 'CERA-WELL-01', price_minor: 61_250, enabled: 1 }]);

    const product = await getCloudflarePublicProduct(db, 'CERA-WELL-01', true);

    expect(product).toMatchObject({
      sku: 'CERA-WELL-01',
      listPriceMinor: 61_250,
      displayPrice: 'PKR\u00a0612.5',
      checkoutEnabled: true,
      enquiryEnabled: true,
    });
  });

  it('keeps an enabled D1 product unavailable for checkout when the global gate is off', async () => {
    const db = database([{ sku: 'CERA-WELL-01', price_minor: 60_000, enabled: 1 }]);

    const product = await getCloudflarePublicProduct(db, 'CERA-WELL-01', false);

    expect(product?.checkoutEnabled).toBe(false);
  });

  it('does not enable a disabled D1 product even when the global gate is on', async () => {
    const db = database([{ sku: 'CERA-WELL-01', price_minor: 60_000, enabled: 0 }]);

    const product = await getCloudflarePublicProduct(db, 'CERA-WELL-01', true);

    expect(product).toMatchObject({ checkoutEnabled: false, enquiryEnabled: true });
  });

  it('retains known catalogue enquiry pages when a SKU has no D1 row without reusing static prices', async () => {
    const products = await listCloudflarePublicProducts(database([]), true);
    const product = products.find((candidate) => candidate.sku === 'CERA-WELL-01');

    expect(product).toMatchObject({
      listPriceMinor: null,
      displayPrice: null,
      checkoutEnabled: false,
      enquiryEnabled: true,
    });
  });

  it('returns null for a SKU outside the bounded approved catalogue', async () => {
    await expect(getCloudflarePublicProduct(database([]), 'MISSING-SKU', true)).resolves.toBeNull();
  });
});
