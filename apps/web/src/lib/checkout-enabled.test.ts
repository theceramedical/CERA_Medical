import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkoutEnabled } from './checkout-enabled.ts';

describe('checkoutEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when the public checkout build flag is off', () => {
    vi.stubEnv('NEXT_PUBLIC_CHECKOUT_ENABLED', 'false');

    expect(checkoutEnabled()).toBe(false);
  });

  it('returns true only when the public checkout build flag is on', () => {
    vi.stubEnv('NEXT_PUBLIC_CHECKOUT_ENABLED', 'true');

    expect(checkoutEnabled()).toBe(true);
  });
});
