import { describe, expect, it } from 'vitest';

import { HOMEPAGE_ARTICLES, HOMEPAGE_SERVICES } from './homepage.ts';

describe('client-provided homepage content', () => {
  it('lists the five CERA research services with unique route slugs', () => {
    expect(HOMEPAGE_SERVICES.map(({ slug }) => slug)).toEqual([
      'preclinical-studies',
      'molecular-research',
      'metagenomic-data-analysis',
      'biomedical-omics-data-analysis',
      'evidence-synthesis-technical-reports',
    ]);
    expect(new Set(HOMEPAGE_SERVICES.map(({ slug }) => slug)).size).toBe(5);
  });

  it('does not publish invented articles before CERA supplies approved copy', () => {
    expect(HOMEPAGE_ARTICLES).toEqual([]);
  });

  it('uses a distinct icon for every service card', () => {
    expect(new Set(HOMEPAGE_SERVICES.map(({ icon }) => icon)).size).toBe(5);
  });
});
