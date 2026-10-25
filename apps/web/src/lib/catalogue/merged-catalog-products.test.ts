import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicProduct } from '@cera/contracts/projections';

const { listPublicProducts } = vi.hoisted(() => ({ listPublicProducts: vi.fn() }));
vi.mock('./client.ts', () => ({ listPublicProducts }));
vi.mock('server-only', () => ({}));

import { listMergedCatalogProducts } from './merged-catalog-products.ts';

const publishedProduct: PublicProduct = {
  sku: 'CR-CEL-3091',
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

  it('shows the catalogue when the API returns none', async () => {
    listPublicProducts.mockResolvedValue({ items: [], degraded: true });
    const products = await listMergedCatalogProducts();
    expect(products.map((product) => product.sku)).toEqual([
      'CR-CEL-3091',
      'CR-MOL-1021',
      'CR-MOL-2045',
      'CR-MOL-3012',
      'CR-PRE-5510',
      'CR-REG-1180',
    ]);
  });

  it('shows public records without inferring price or stock', async () => {
    listPublicProducts.mockResolvedValue({ items: [publishedProduct], degraded: false });
    const products = await listMergedCatalogProducts();
    expect(products).toContainEqual(
      expect.objectContaining({
        sku: 'CR-CEL-3091',
        title: 'Published product',
        price: 'Price on enquiry',
        listPriceMinor: null,
        inStock: null,
        specs: ['Availability must be confirmed before dispatch.'],
      }),
    );
    expect(products.some((product) => product.sku === 'CR-MOL-1021')).toBe(true);
  });
});
