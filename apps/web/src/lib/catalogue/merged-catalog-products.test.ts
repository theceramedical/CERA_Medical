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

  it('does not expose unapproved prototype catalogue entries when the API is empty', async () => {
    listPublicProducts.mockResolvedValue({ items: [], degraded: true });
    const products = await listMergedCatalogProducts();
    expect(products).toEqual([]);
  });

  it('shows public records without inferring price or stock', async () => {
    listPublicProducts.mockResolvedValue({ items: [publishedProduct], degraded: false });
    const products = await listMergedCatalogProducts();
    expect(products).toContainEqual(
      expect.objectContaining({
        sku: 'REAL-001',
        title: 'Published product',
        listPriceMinor: null,
        checkoutEnabled: false,
        inStock: null,
        specs: [],
      }),
    );
    expect(products.some((product) => product.sku === 'CR-MOL-1021')).toBe(false);
  });
});
