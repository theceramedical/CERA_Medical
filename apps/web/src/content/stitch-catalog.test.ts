import { physicalProductListPriceMinor } from '@cera/contracts';
import { describe, expect, it } from 'vitest';

import { SEED_PHYSICAL_PRODUCTS } from '../../../commerce/src/seed-data.ts';

import { CATALOG_PRODUCTS, filterCatalog, PHYSICAL_PRODUCT_SKUS } from './products-catalog.ts';
import { SERVICE_PORTFOLIO } from './service-portfolio.ts';

describe('product catalog filters', () => {
  it('filters by category and query', () => {
    const molecular = filterCatalog(CATALOG_PRODUCTS, { category: 'molecular' });
    expect(molecular.every((item) => item.category === 'molecular')).toBe(true);
    const hit = filterCatalog(CATALOG_PRODUCTS, { q: 'CR-MOL-3012' });
    expect(hit).toHaveLength(1);
    expect(hit[0]?.sku).toBe('CR-MOL-3012');
    expect(CATALOG_PRODUCTS.every((item) => item.fulfillment === 'physical')).toBe(true);
  });

  it('matches Vendure physical product SKUs for checkout', () => {
    expect([...PHYSICAL_PRODUCT_SKUS].sort()).toEqual(
      SEED_PHYSICAL_PRODUCTS.map((product) => product.sku).sort(),
    );
  });

  it('uses the same PKR list prices as commerce seed', () => {
    for (const product of CATALOG_PRODUCTS) {
      expect(product.listPriceMinor).toBe(physicalProductListPriceMinor(product.sku));
      const seeded = SEED_PHYSICAL_PRODUCTS.find((row) => row.sku === product.sku);
      expect(seeded?.listPriceMinor).toBe(product.listPriceMinor);
    }
  });
});

describe('service portfolio', () => {
  it('covers five service lines', () => {
    expect(SERVICE_PORTFOLIO.map((line) => line.slug)).toEqual([
      'preclinical-studies',
      'molecular-research',
      'metagenomic-data-analysis',
      'biomedical-omics-data-analysis',
      'evidence-synthesis-technical-reports',
    ]);
  });
});
