import { describe, expect, it } from 'vitest';

import { buildCsp, STATIC_SECURITY_HEADERS } from './security-headers.ts';

/**
 * A CSP is a string, and a wrong one fails silently.
 *
 * There is no error for a misspelled directive or a source list the browser cannot parse - the
 * browser drops what it does not understand and enforces the rest, so a policy can lose its most
 * important directive and still look like a policy. These tests read it back.
 */

/** Parses a serialised policy into directive name to source list, the way a browser would. */
function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy.split('; ').map((part) => {
      const [name, ...sources] = part.split(' ');
      return [name ?? '', sources];
    }),
  );
}

const NONCE = 'a3f1c0de-0000-4000-8000-000000000001';

describe('buildCsp', () => {
  it('carries the nonce in script-src', () => {
    expect(directives(buildCsp(NONCE)).get('script-src')).toContain(`'nonce-${NONCE}'`);
  });

  it('pairs the nonce with strict-dynamic', () => {
    // A nonce alone would block the scripts Next's bootstrap loads dynamically, because they are
    // injected without one. `'strict-dynamic'` is what extends trust to them.
    expect(directives(buildCsp(NONCE)).get('script-src')).toContain("'strict-dynamic'");
  });

  it('keeps a host fallback for engines that ignore strict-dynamic', () => {
    // CSP2 browsers do not implement `'strict-dynamic'` and would be left with no script policy at
    // all. CSP3 browsers ignore these two in its presence, so listing them costs nothing.
    const scriptSrc = directives(buildCsp(NONCE)).get('script-src');

    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).toContain('https:');
  });

  it('never allows unsafe-inline or unsafe-eval for script', () => {
    // The one assertion in this file that is worth more than all the others: either of these
    // reduces the entire policy to decoration.
    const scriptSrc = directives(buildCsp(NONCE)).get('script-src')?.join(' ') ?? '';

    expect(scriptSrc).not.toContain('unsafe-inline');
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  it('forbids a base element, which would repoint every relative script URL', () => {
    expect(directives(buildCsp(NONCE)).get('base-uri')).toEqual(["'none'"]);
  });

  it('forbids objects, without which strict-dynamic can be bypassed', () => {
    expect(directives(buildCsp(NONCE)).get('object-src')).toEqual(["'none'"]);
  });

  it('forbids framing and off-origin form submission', () => {
    const parsed = directives(buildCsp(NONCE));

    expect(parsed.get('frame-ancestors')).toEqual(["'none'"]);
    expect(parsed.get('form-action')).toEqual(["'self'"]);
  });

  it('restricts fonts to this origin, matching the self-hosting requirement', () => {
    expect(directives(buildCsp(NONCE)).get('font-src')).toEqual(["'self'"]);
  });

  it('emits upgrade-insecure-requests as a bare directive', () => {
    // A valueless directive written as `name ` with a trailing space is rejected by some parsers,
    // which drops it. The serialiser has to special-case it.
    expect(buildCsp(NONCE)).toContain('; upgrade-insecure-requests');
    expect(buildCsp(NONCE)).not.toMatch(/upgrade-insecure-requests\s+\S/);
  });

  it('produces a different nonce directive for a different nonce', () => {
    expect(buildCsp('one')).not.toEqual(buildCsp('two'));
  });

  describe('configured origins', () => {
    it('adds the media origin to img-src only', () => {
      const parsed = directives(buildCsp(NONCE, { mediaOrigin: 'https://media.example' }));

      expect(parsed.get('img-src')).toContain('https://media.example');
      // Media is fetched as an image, never as a script or a fetch target. Widening either would
      // hand an image host more trust than it needs.
      expect(parsed.get('script-src')).not.toContain('https://media.example');
      expect(parsed.get('connect-src')).not.toContain('https://media.example');
    });

    it('adds the catalogue origin to img-src only', () => {
      const parsed = directives(buildCsp(NONCE, { catalogueOrigin: 'https://catalogue.example' }));

      expect(parsed.get('img-src')).toContain('https://catalogue.example');
      expect(parsed.get('script-src')).not.toContain('https://catalogue.example');
    });

    it('adds the api origin to connect-src only', () => {
      const parsed = directives(buildCsp(NONCE, { apiOrigin: 'https://api.example' }));

      expect(parsed.get('connect-src')).toContain('https://api.example');
      expect(parsed.get('img-src')).not.toContain('https://api.example');
    });

    it('adds the auth origin to connect-src for OIDC sign-in', () => {
      const parsed = directives(buildCsp(NONCE, { authOrigin: 'https://auth.ceramedical.org' }));

      expect(parsed.get('connect-src')).toContain('https://auth.ceramedical.org');
      expect(parsed.get('script-src')).not.toContain('https://auth.ceramedical.org');
    });

    it('omits both when unconfigured, rather than widening to a wildcard', () => {
      const parsed = directives(buildCsp(NONCE));

      expect(parsed.get('img-src')).toEqual(["'self'", 'data:', 'blob:']);
      expect(parsed.get('connect-src')).toEqual(["'self'"]);
    });

    it('adds extra origins to form-action only', () => {
      const parsed = directives(
        buildCsp(NONCE, {
          formActionOrigins: ['https://www.ceramedical.org', 'https://ceramedical.org'],
        }),
      );

      expect(parsed.get('form-action')).toEqual([
        "'self'",
        'https://www.ceramedical.org',
        'https://ceramedical.org',
      ]);
      expect(parsed.get('connect-src')).toEqual(["'self'"]);
    });
  });
});

describe('STATIC_SECURITY_HEADERS', () => {
  it('sets nosniff', () => {
    expect(STATIC_SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff');
  });

  it('denies framing for engines without frame-ancestors', () => {
    expect(STATIC_SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it('leaks no referrer across origins', () => {
    expect(STATIC_SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it.each(['camera', 'microphone', 'geolocation', 'payment'])(
    'denies the %s permission with an empty allow-list',
    (feature) => {
      // `feature=()` denies it everywhere. `feature=(self)` would still permit it on this origin,
      // which for a site with no use for any of them is a distinction that matters.
      expect(STATIC_SECURITY_HEADERS['Permissions-Policy']).toContain(`${feature}=()`);
    },
  );

  it('does not set HSTS, which belongs to the TLS terminator', () => {
    // This process sits behind Caddy and cannot tell whether the external hop was HTTPS. Asserting
    // the absence so that adding it here is a deliberate change rather than a drive-by one.
    expect(Object.keys(STATIC_SECURITY_HEADERS)).not.toContain('Strict-Transport-Security');
  });

  it('isolates the browsing context', () => {
    expect(STATIC_SECURITY_HEADERS['Cross-Origin-Opener-Policy']).toBe('same-origin');
    // `same-site` rather than `same-origin`, so Phase 05's live preview can embed our resources
    // from the CMS subdomain.
    expect(STATIC_SECURITY_HEADERS['Cross-Origin-Resource-Policy']).toBe('same-site');
  });
});
