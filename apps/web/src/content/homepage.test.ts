import { describe, expect, it } from 'vitest';

import { FIXTURE_SERVICE_SLUGS } from '../lib/catalogue-fixtures.ts';

describe('catalogue fixture slugs', () => {
  it('lists five public service slugs aligned with bootstrap', () => {
    expect(FIXTURE_SERVICE_SLUGS).toEqual([
      'preclinical-studies',
      'molecular-research',
      'metagenomic-data-analysis',
      'biomedical-omics-data-analysis',
      'evidence-synthesis-technical-reports',
    ]);
    expect(new Set(FIXTURE_SERVICE_SLUGS).size).toBe(5);
  });
});
