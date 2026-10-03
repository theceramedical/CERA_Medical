import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { REQUEST_ID_HEADER } from '@cera/observability/request-id';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

import { config, proxy } from './proxy.ts';

/**
 * The proxy is tested directly against `NextRequest`, not through a running server.
 *
 * Everything it does is observable in the objects it returns, and a live server would put a build
 * between the assertion and the code. The browser-level half - that the nonce actually reaches the
 * script tags, and that a real navigation is not blocked by the policy - is a Playwright concern,
 * because only a browser enforces a CSP.
 */

function requestFor(path: string, init: { cookies?: Record<string, string> } = {}): NextRequest {
  const request = new NextRequest(new URL(path, 'https://cera.example'));

  for (const [name, value] of Object.entries(init.cookies ?? {})) {
    request.cookies.set(name, value);
  }

  return request;
}

describe('request id', () => {
  it('echoes a safe inbound id so a client can correlate its own request', () => {
    const request = new NextRequest(new URL('/', 'https://cera.example'), {
      headers: { [REQUEST_ID_HEADER]: 'abcdef012345678' },
    });

    expect(proxy(request).headers.get(REQUEST_ID_HEADER)).toBe('abcdef012345678');
  });

  it('generates one when the inbound value is unusable', () => {
    // Short, or containing a newline, or absent entirely. Accepting any of them would put an
    // attacker-controlled string into every log line for the request.
    const request = new NextRequest(new URL('/', 'https://cera.example'), {
      headers: { [REQUEST_ID_HEADER]: 'x' },
    });

    const id = proxy(request).headers.get(REQUEST_ID_HEADER);

    expect(id).not.toBe('x');
    expect(id).toMatch(/^[\da-f-]{36}$/);
  });

  it('always sets one, even on the redirect path', () => {
    // The redirect is a response too, and a response without a request id is one nobody can trace.
    const response = proxy(requestFor('/account'));

    expect(response.status).toBe(307);
    expect(response.headers.get(REQUEST_ID_HEADER)).not.toBeNull();
  });
});

describe('security headers', () => {
  it('puts the policy on the response for the browser to enforce', () => {
    expect(proxy(requestFor('/')).headers.get('content-security-policy')).toContain('script-src');
  });

  it('mints a fresh nonce per request', () => {
    // A reused nonce is no better than `'unsafe-inline'`: an attacker who reads one page's HTML
    // learns the value that will be accepted on the next.
    const first = proxy(requestFor('/')).headers.get('content-security-policy');
    const second = proxy(requestFor('/')).headers.get('content-security-policy');

    expect(first).not.toBe(second);
  });

  it('applies every static header', () => {
    const headers = proxy(requestFor('/')).headers;

    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('permissions-policy')).toContain('camera=()');
    expect(headers.get('cross-origin-opener-policy')).toBe('same-origin');
  });

  it('protects the redirect response as well as the rendered one', () => {
    // Setting headers on the pass-through branch and forgetting the redirect is the ordinary way
    // this function ends up with an unprotected response.
    const headers = proxy(requestFor('/staff')).headers;

    expect(headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect(headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('session presence', () => {
  it.each(['/account', '/account/enquiries', '/staff', '/staff/queue/abc'])(
    'redirects %s to sign-in when no session cookie is present',
    (path) => {
      const response = proxy(requestFor(path));
      const location = new URL(response.headers.get('location') ?? '');

      expect(response.status).toBe(307);
      expect(location.pathname).toBe('/auth/sign-in');
    },
  );

  it('preserves the path and query as a return target', () => {
    const response = proxy(requestFor('/account/enquiries?page=2'));
    const location = new URL(response.headers.get('location') ?? '');

    expect(location.searchParams.get('next')).toBe('/account/enquiries?page=2');
  });

  it('keeps an absolute URL in the query as an inert query value', () => {
    // The return target is still a path - `/account?next=...` - so Phase 09 redirecting to it stays
    // on this origin, and the attacker's URL is just text in a parameter nothing dereferences.
    const response = proxy(requestFor('/account?next=https://attacker.example'));
    const next = new URL(response.headers.get('location') ?? '').searchParams.get('next');

    expect(next).toBe('/account?next=https://attacker.example');
  });

  it('collapses a protocol-relative path, which would otherwise leave the site', () => {
    /**
     * `//attacker.example` is the case a `startsWith('/')` check waves through.
     *
     * A request to `https://host//attacker.example` has a pathname of `//attacker.example`, and a
     * browser resolving that as a redirect target inherits the scheme and reads the rest as a
     * host - so it is an absolute URL wearing a path's clothing. Found by writing the test above
     * and noticing the assertion it was actually making.
     */
    const request = new NextRequest('https://cera.example//account/enquiries');
    const response = proxy(request);
    const next = new URL(response.headers.get('location') ?? '').searchParams.get('next');

    expect(request.nextUrl.pathname).toBe('//account/enquiries');
    expect(next).toBe('/account/enquiries');
  });

  it('lets a request through when the cookie is merely present', () => {
    /**
     * The value is deliberately nonsense, and that is the assertion.
     *
     * This is a presence check for redirect ergonomics, not authorisation: it does not open the
     * seal, verify a signature, check expiry, or read a role. A forged cookie gets past here and is
     * rejected by `apps/api`, which decides per request against the record being touched. ADR-004
     * records why the check is not here - Auth.js v5's GHSA-8fpg-xm3f-6cx3 was a middleware
     * fail-open, and the lesson was to move the decision, not to write the middleware more
     * carefully.
     */
    const response = proxy(
      requestFor('/account', { cookies: { [SESSION_COOKIE_NAME]: 'forged' } }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it.each(['/', '/services', '/articles/heart-health', '/contact'])(
    'leaves the public route %s alone',
    (path) => {
      expect(proxy(requestFor(path)).status).toBe(200);
    },
  );

  it('does not treat a route that merely starts with the same letters as protected', () => {
    // `/accounts-payable` is not under `/account`. Prefix matching without the boundary check is
    // how an unrelated future route starts redirecting to sign-in.
    expect(proxy(requestFor('/accounts-payable')).status).toBe(200);
  });
});

describe('canonical host', () => {
  it('does not redirect when forwarded origin matches NEXT_PUBLIC_SITE_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    const request = new NextRequest(new URL('http://web:3000/'), {
      headers: {
        host: 'web:3000',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'www.ceramedical.org',
      },
    });

    expect(proxy(request).status).toBe(200);
    vi.unstubAllEnvs();
  });

  it('redirects apex to the configured www origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    const request = new NextRequest(new URL('http://web:3000/about'), {
      headers: {
        host: 'web:3000',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'ceramedical.org',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://www.ceramedical.org/about');
    vi.unstubAllEnvs();
  });

  it('skips canonical redirect for in-container health checks', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    const request = new NextRequest(new URL('http://127.0.0.1:3000/'), {
      headers: { host: '127.0.0.1:3000' },
    });

    expect(proxy(request).status).toBe(200);
    vi.unstubAllEnvs();
  });
});

describe('matcher', () => {
  /** Reproduces Next's matching so the pattern is asserted rather than assumed. */
  const matches = (path: string): boolean =>
    config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path));

  it.each(['/', '/services', '/account/enquiries'])('runs for %s', (path) => {
    expect(matches(path)).toBe(true);
  });

  it.each(['/_next/static/chunks/main.js', '/_next/image', '/favicon.ico', '/robots.txt'])(
    'skips %s',
    (path) => {
      // These are files on disk with no document to protect and no session to consider. Matching
      // them would mint a nonce for every image and font on every page load.
      expect(matches(path)).toBe(false);
    },
  );
});
