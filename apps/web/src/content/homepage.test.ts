import { describe, expect, it } from 'vitest';

import {
  HOMEPAGE_ARTICLES,
  HOMEPAGE_DELIVERABLES,
  HOMEPAGE_PRINCIPLES,
  HOMEPAGE_SERVICES,
} from './homepage.ts';

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

  it('lists research insight cards with unique article slugs', () => {
    expect(HOMEPAGE_ARTICLES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(HOMEPAGE_ARTICLES.map(({ slug }) => slug)).size).toBe(HOMEPAGE_ARTICLES.length);
    for (const article of HOMEPAGE_ARTICLES) {
      expect(article.coverSrc.startsWith('/images/')).toBe(true);
    }
  });

  it('uses a distinct icon for every service card', () => {
    expect(new Set(HOMEPAGE_SERVICES.map(({ icon }) => icon)).size).toBe(5);
  });

  it('ships homepage bands with principles and deliverables', () => {
    expect(HOMEPAGE_PRINCIPLES).toHaveLength(4);
    expect(HOMEPAGE_DELIVERABLES).toHaveLength(4);
  });
});
