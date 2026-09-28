import { describe, expect, it } from 'vitest';

import { SEED_SERVICES } from './seed-data.js';

describe('catalogue seed data', () => {
  it('contains the six reference slugs plus the withdrawn seventh', () => {
    expect(SEED_SERVICES.map((service) => service.slug)).toEqual([
      'general-health',
      'cardiology',
      'orthopaedics',
      'womens-health',
      'diagnostic-tests',
      'wellness-preventive-care',
      'travel-vaccinations',
    ]);
  });

  it('marks diagnostic-tests as the browsable non-enquiry path', () => {
    const service = SEED_SERVICES.find((item) => item.slug === 'diagnostic-tests');
    expect(service?.enabled).toBe(true);
    expect(service?.enquiryEnabled).toBe(false);
  });

  it('marks travel-vaccinations as disabled, not merely enquiry-disabled', () => {
    const service = SEED_SERVICES.find((item) => item.slug === 'travel-vaccinations');
    expect(service?.enabled).toBe(false);
  });
});
