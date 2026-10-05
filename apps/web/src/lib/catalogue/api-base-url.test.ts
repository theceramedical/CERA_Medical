import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveCatalogueApiBaseUrl } from './api-base-url.ts';

describe('resolveCatalogueApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers API_INTERNAL_URL on the server', () => {
    vi.stubEnv('API_INTERNAL_URL', 'http://api:3003');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.ceramedical.org');
    expect(resolveCatalogueApiBaseUrl()).toBe('http://api:3003');
  });

  it('falls back to NEXT_PUBLIC_API_URL', () => {
    vi.stubEnv('API_INTERNAL_URL', '');
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.ceramedical.org');
    expect(resolveCatalogueApiBaseUrl()).toBe('https://api.ceramedical.org');
  });
});
