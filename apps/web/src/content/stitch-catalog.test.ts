import { describe, expect, it } from 'vitest';

import { filterCatalog, type CatalogProduct } from './products-catalog.ts';
import { SERVICE_PORTFOLIO } from './service-portfolio.ts';

describe('product catalog filters', () => {
  const product: CatalogProduct = {
    sku: 'REAL-001',
    category: 'catalogue',
    categoryLabel: 'Catalogue product',
    title: 'Published product',
    description: 'Public catalogue description',
    specs: [],
    packLabel: '',
    listPriceMinor: null,
    price: 'Price on enquiry',
    inStock: null,
    fulfillment: 'physical',
  };

  it('filters supplied public catalogue rows by query', () => {
    const hit = filterCatalog([product], { q: 'real-001' });
    expect(hit).toHaveLength(1);
    expect(filterCatalog([product], { q: 'missing' })).toEqual([]);
  });

  it('does not infer stock availability from a missing status', () => {
    expect(filterCatalog([product], { inStock: true })).toEqual([]);
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
