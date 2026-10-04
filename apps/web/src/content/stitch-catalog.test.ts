import { describe, expect, it } from 'vitest';

import { CATALOG_PRODUCTS, filterCatalog } from './products-catalog.ts';
import { SERVICE_PORTFOLIO } from './service-portfolio.ts';

describe('product catalog filters', () => {
  it('filters by category and query', () => {
    const molecular = filterCatalog(CATALOG_PRODUCTS, { category: 'molecular' });
    expect(molecular.every((item) => item.category === 'molecular')).toBe(true);
    const hit = filterCatalog(CATALOG_PRODUCTS, { q: 'CR-BIO-9014' });
    expect(hit).toHaveLength(1);
    expect(hit[0]?.sku).toBe('CR-BIO-9014');
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
