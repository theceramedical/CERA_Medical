import { afterEach, describe, expect, it, vi } from 'vitest';

import { siteLogoSrc } from './site-logo.ts';

afterEach(() => vi.unstubAllEnvs());

describe('CMS website logo', () => {
  it('retains the bundled logo when the upload is absent, deleted or unpopulated', () => {
    for (const settings of [null, {}, { logo: null }, { logo: 12 }, { logo: { url: '' } }]) {
      expect(siteLogoSrc(settings)).toBe('/images/cera-logo-lockup.png');
    }
  });

  it('resolves local SSD uploads on the public CMS origin', () => {
    vi.stubEnv('CMS_URL', 'https://admin.ceramedical.org');
    vi.stubEnv('S3_PUBLIC_URL', '');
    expect(siteLogoSrc({ logo: { url: '/api/media/file/logo.png' } })).toBe(
      'https://admin.ceramedical.org/api/media/file/logo.png',
    );
  });

  it('uses the configured public media location when storage is configured', () => {
    vi.stubEnv('CMS_URL', 'https://admin.ceramedical.org');
    vi.stubEnv('S3_PUBLIC_URL', 'https://media.ceramedical.org');
    expect(siteLogoSrc({ logo: { url: '/api/media/file/logo.png' } })).toBe(
      'https://media.ceramedical.org/logo.png',
    );
  });

  it('rejects non-web URL schemes', () => {
    expect(siteLogoSrc({ logo: { url: 'data:text/html,invalid-logo' } })).toBe(
      '/images/cera-logo-lockup.png',
    );
  });
});
