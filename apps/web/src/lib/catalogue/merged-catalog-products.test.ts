import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicProduct } from '@cera/contracts/projections';

const { listPublicProducts } = vi.hoisted(() => ({ listPublicProducts: vi.fn() }));
vi.mock('./client.ts', () => ({ listPublicProducts }));
vi.mock('server-only', () => ({}));

import { listMergedCatalogProducts } from './merged-catalog-products.ts';

const publishedProduct: PublicProduct = {
  sku: 'REAL-001',
  title: 'Published product',
  summary: 'Public summary',
  description: 'Public description',
  displayPrice: 'PKR 23,800',
  availabilityText: null,
  listPriceMinor: null,
  checkoutEnabled: false,
  enquiryEnabled: true,
  imageUrl: null,
};

describe('public product listing', () => {
  beforeEach(() => listPublicProducts.mockReset());

  it('does not produce invented products when the API returns none', async () => {
    listPublicProducts.mockResolvedValue({ items: [], degraded: true });
    expect(await listMergedCatalogProducts()).toEqual([]);
  });

  it('shows public records without inferring price or stock', async () => {
    listPublicProducts.mockResolvedValue({ items: [publishedProduct], degraded: false });
    expect(await listMergedCatalogProducts()).toEqual([
      expect.objectContaining({
        sku: 'REAL-001',
        title: 'Published product',
        price: 'Price on enquiry',
        listPriceMinor: null,
        inStock: null,
        specs: [],
      }),
    ]);
  });
});
