import { describe, expect, it } from 'vitest';

import { RETIRED_SERVICE_SLUGS, SEED_COLLECTIONS, SEED_SERVICES } from './seed-data.js';

describe('CERA catalogue seed data', () => {
  it('contains the five client-provided research services', () => {
    expect(SEED_SERVICES.map((service) => service.slug)).toEqual([
      'preclinical-studies',
      'molecular-research',
      'metagenomic-data-analysis',
      'biomedical-omics-data-analysis',
      'evidence-synthesis-technical-reports',
    ]);
    expect(SEED_SERVICES.every((service) => service.enabled && service.enquiryEnabled)).toBe(true);
  });

  it('assigns every service to a seeded catalogue collection', () => {
    const collectionSlugs = new Set(SEED_COLLECTIONS.map(({ slug }) => slug));
    expect(SEED_SERVICES.every(({ collectionSlug }) => collectionSlugs.has(collectionSlug))).toBe(
      true,
    );
  });

  it('retires the former patient-care demonstration services', () => {
    expect(RETIRED_SERVICE_SLUGS).toContain('general-health');
    expect(RETIRED_SERVICE_SLUGS).toContain('cardiology');
    expect(RETIRED_SERVICE_SLUGS).toContain('travel-vaccinations');
  });
});
