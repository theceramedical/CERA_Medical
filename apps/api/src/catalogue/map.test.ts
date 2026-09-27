import { describe, expect, it } from 'vitest';

import { mapVendureProduct, toListablePublicService } from './map.ts';

import type { VendureProduct } from './types.ts';

const product: VendureProduct = {
  id: '1',
  slug: 'cardiology',
  name: 'Cardiology',
  description: 'Expert care for a healthier heart.',
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  collections: [{ id: 'c1', slug: 'specialist', name: 'Specialist Care' }],
  customFields: {
    shortSummary: 'Expert care for a healthier heart.',
    displayPriceText: 'From £250',
    availabilityText: 'Usually within 2 weeks',
    enquiryEnabled: true,
    internalNotes: 'SECRET staff note',
  },
};

describe('mapVendureProduct', () => {
  it('validates against ServiceSchema and drops internalNotes', () => {
    const service = mapVendureProduct(product);
    expect(service.title).toBe('Cardiology');
    expect(service.displayPrice).toBe('From £250');
    expect(JSON.stringify(service)).not.toContain('SECRET');
    expect(JSON.stringify(service)).not.toContain('internalNotes');
  });

  it('treats enabled: false as inactive', () => {
    const service = mapVendureProduct({ ...product, enabled: false, slug: 'travel-vaccinations' });
    expect(service.status).toBe('inactive');
    expect(toListablePublicService(service)).toBeNull();
  });

  it('keeps enquiryEnabled: false in the listing projection so the card can hide the CTA', () => {
    const service = mapVendureProduct({
      ...product,
      slug: 'diagnostic-tests',
      customFields: { ...product.customFields, enquiryEnabled: false },
    });
    const listed = toListablePublicService(service);
    expect(listed?.enquiryEnabled).toBe(false);
  });
});
