import { describe, expect, it } from 'vitest';

import { apiPathRequiresVerifiedEmail } from './portal-access.ts';

describe('apiPathRequiresVerifiedEmail', () => {
  it('requires verification for enquiries and orders', () => {
    expect(apiPathRequiresVerifiedEmail('/v1/me/enquiries')).toBe(true);
    expect(apiPathRequiresVerifiedEmail('/v1/me/enquiries/CERA-123')).toBe(true);
    expect(apiPathRequiresVerifiedEmail('/v1/me/orders')).toBe(true);
    expect(apiPathRequiresVerifiedEmail('/v1/me/orders/ORD-1')).toBe(true);
  });

  it('requires verification for claim endpoints', () => {
    expect(apiPathRequiresVerifiedEmail('/v1/enquiries/claim/request')).toBe(true);
    expect(apiPathRequiresVerifiedEmail('/v1/enquiries/claim/consume')).toBe(true);
  });

  it('does not require verification for profile', () => {
    expect(apiPathRequiresVerifiedEmail('/v1/me/profile')).toBe(false);
  });
});
