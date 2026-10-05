import { afterEach, describe, expect, it, vi } from 'vitest';

import { configuredOidcSocialProviders, resolveOidcSocialProvider } from './oidc-social.ts';

afterEach(() => vi.unstubAllEnvs());

describe('oidc-social', () => {
  it('lists providers only when slugs are configured', () => {
    vi.stubEnv('OIDC_GOOGLE_SOURCE_SLUG', 'google');
    vi.stubEnv('OIDC_MICROSOFT_SOURCE_SLUG', '');

    expect(configuredOidcSocialProviders()).toEqual([
      { id: 'google', label: 'Google', sourceSlug: 'google' },
    ]);
  });

  it('resolves provider query params against the allow-list', () => {
    vi.stubEnv('OIDC_GOOGLE_SOURCE_SLUG', 'google');

    expect(resolveOidcSocialProvider('google')?.sourceSlug).toBe('google');
    expect(resolveOidcSocialProvider('microsoft')).toBeUndefined();
    expect(resolveOidcSocialProvider('evil')).toBeUndefined();
  });
});
