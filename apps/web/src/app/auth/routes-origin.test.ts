import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET as callback } from './callback/route.ts';
import { GET as signin } from './signin/route.ts';
import { GET as signout } from './signout/route.ts';

const PUBLIC_SITE = 'https://www.ceramedical.org';
const INTERNAL_ORIGIN = 'http://0.0.0.0:3000';

afterEach(() => vi.unstubAllEnvs());

describe('auth routes use the configured public origin', () => {
  it('sends callback failures to the public site, not the container address', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', PUBLIC_SITE);

    const response = await callback(new NextRequest(`${INTERNAL_ORIGIN}/auth/callback`));

    expect(response.headers.get('location')).toBe(`${PUBLIC_SITE}/auth/error?reason=expired`);
  });

  it('sends sign-in failures to the public site', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', PUBLIC_SITE);
    vi.stubEnv('OIDC_ISSUER', 'https://auth.ceramedical.org/application/o/cera-production/');
    vi.stubEnv('OIDC_CLIENT_ID', '');
    vi.stubEnv('OIDC_CLIENT_SECRET', '');

    const response = await signin(new Request(`${INTERNAL_ORIGIN}/auth/signin`));

    expect(response.headers.get('location')).toBe(`${PUBLIC_SITE}/auth/error?reason=unavailable`);
  });

  it('returns after sign-out to the public site', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', PUBLIC_SITE);
    vi.stubEnv('OIDC_ISSUER', 'https://auth.ceramedical.org/application/o/cera-production/');

    const response = signout();

    expect(response.headers.get('location')).toBe(
      'https://auth.ceramedical.org/application/o/cera-production/end-session/?post_logout_redirect_uri=https%3A%2F%2Fwww.ceramedical.org%2F',
    );
  });
});
