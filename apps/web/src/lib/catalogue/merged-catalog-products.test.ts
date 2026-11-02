import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PublicProduct } from '@cera/contracts/projections';

const { listPublicProducts } = vi.hoisted(() => ({ listPublicProducts: vi.fn() }));
vi.mock('./client.ts', () => ({ listPublicProducts }));
vi.mock('server-only', () => ({}));

import {
  listMergedCatalogProducts,
  mergePortfolioDisplayProducts,
} from './merged-catalog-products.ts';

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

  it('keeps verified copy while replacing stale price and checkout flags with the runtime projection', async () => {
    listPublicProducts.mockResolvedValue({
      items: [
        {
          ...publishedProduct,
          sku: 'CERA-WELL-01',
          checkoutEnabled: false,
          listPriceMinor: null,
          displayPrice: null,
        },
      ],
      degraded: false,
    });

    const product = (await listMergedCatalogProducts()).find(
      (candidate) => candidate.sku === 'CERA-WELL-01',
    );

    expect(product).toMatchObject({
      description: expect.stringContaining('Plant-based'),
      price: 'Price on enquiry',
      listPriceMinor: null,
      checkoutEnabled: false,
      inStock: null,
    });
  });

  it('keeps missing portfolio products informational without using static price, stock, or checkout flags', () => {
    const products = mergePortfolioDisplayProducts([]);
    const wellnessProduct = products.find((product) => product.sku === 'CERA-WELL-01');

    expect(wellnessProduct).toMatchObject({
      price: 'Price on enquiry',
      listPriceMinor: null,
      checkoutEnabled: false,
      inStock: null,
    });
  });

  it('does not replace or duplicate a runtime product with portfolio copy', async () => {
    listPublicProducts.mockResolvedValue({ items: [publishedProduct], degraded: false });
    const runtimeProduct = (await listMergedCatalogProducts())[0];
    expect(runtimeProduct).toBeDefined();
    if (!runtimeProduct) throw new Error('Expected a runtime product');

    const products = mergePortfolioDisplayProducts([runtimeProduct]);

    expect(products.filter((product) => product.sku === runtimeProduct.sku)).toEqual([
      runtimeProduct,
    ]);
  });
});
