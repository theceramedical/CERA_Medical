import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET as callback } from './callback/route.ts';
import { GET as signin } from './signin/route.ts';
import { GET as signout } from './signout/route.ts';

afterEach(() => vi.unstubAllEnvs());

describe('retired customer auth and Access staff redirects', () => {
  it('rejects OIDC callbacks because authentication belongs to Cloudflare Access', () => {
    const response = callback();
    expect(response.status).toBe(410);
  });

  it('sends staff sign-in to the Access-protected staff host', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    const response = signin(
      new Request('https://www.ceramedical.org/auth/signin?next=/staff/orders'),
    );
    expect(response.headers.get('location')).toBe('https://staff.ceramedical.org/staff/orders');
  });

  it('ends staff sessions through Cloudflare Access', () => {
    const response = signout();
    expect(response.headers.get('location')).toBe(
      'https://staff.ceramedical.org/cdn-cgi/access/logout',
    );
  });
});
