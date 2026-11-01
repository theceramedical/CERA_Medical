import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getDatabase, isWorker } = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  isWorker: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('../cloudflare/runtime.ts', () => ({
  getCloudflareDatabase: getDatabase,
  isCloudflareWorkerRuntime: isWorker,
}));
vi.mock('./api-base-url.ts', () => ({
  resolveCatalogueApiBaseUrl: () => 'https://legacy.example',
}));

import { getPublicProduct, listPublicProducts } from './client.ts';

import type { D1Database } from '../cloudflare/runtime.ts';

function database(
  rows: readonly { sku: string; price_minor: number; enabled: number }[],
): D1Database {
  const statement = {
    bind: () => statement,
    all: () => Promise.resolve({ results: [...rows] }),
    first: () => Promise.resolve(null),
    run: () => Promise.resolve({}),
  };
  return { prepare: () => statement, batch: () => Promise.resolve([]) } as unknown as D1Database;
}

describe('product catalogue client runtime selection', () => {
  beforeEach(() => {
    getDatabase.mockReset().mockResolvedValue(null);
    isWorker.mockReset().mockResolvedValue(false);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses D1 on Workers for list and detail without requesting the legacy API', async () => {
    getDatabase.mockResolvedValue(
      database([{ sku: 'CERA-WELL-01', price_minor: 60_000, enabled: 0 }]),
    );
    isWorker.mockResolvedValue(true);

    const list = await listPublicProducts();
    const detail = await getPublicProduct('CERA-WELL-01');

    expect(list.degraded).toBe(false);
    expect(list.items.find((item) => item.sku === 'CERA-WELL-01')?.checkoutEnabled).toBe(false);
    expect(detail?.checkoutEnabled).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed without a D1 binding in a Worker and does not call the API origin', async () => {
    isWorker.mockResolvedValue(true);

    const list = await listPublicProducts();
    const detail = await getPublicProduct('CERA-WELL-01');

    expect(list.degraded).toBe(true);
    expect(list.items.every((item) => item.checkoutEnabled === false)).toBe(true);
    expect(detail?.checkoutEnabled).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves the API fallback for local development', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              sku: 'LOCAL-001',
              title: 'Local product',
              summary: 'Summary',
              description: 'Description',
              displayPrice: null,
              availabilityText: null,
              listPriceMinor: null,
              checkoutEnabled: false,
              enquiryEnabled: true,
              imageUrl: null,
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    const result = await listPublicProducts();

    expect(result.items[0]?.sku).toBe('LOCAL-001');
    expect(fetch).toHaveBeenCalledWith(
      'https://legacy.example/v1/products',
      expect.objectContaining({ next: expect.any(Object) }),
    );
  });
});
