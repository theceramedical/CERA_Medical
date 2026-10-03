import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { isInternalProbe, resolvePublicOrigin } from './public-origin.ts';

describe('resolvePublicOrigin', () => {
  it('uses forwarded proto and host behind Caddy', () => {
    const request = new NextRequest(new URL('http://web:3000/services'), {
      headers: {
        host: 'web:3000',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'www.ceramedical.org',
      },
    });

    expect(resolvePublicOrigin(request)).toBe('https://www.ceramedical.org');
  });

  it('falls back to the parsed URL without forwarded headers', () => {
    const request = new NextRequest(new URL('https://cera.example/contact'));

    expect(resolvePublicOrigin(request)).toBe('https://cera.example');
  });
});

describe('isInternalProbe', () => {
  it('treats loopback health checks as internal', () => {
    const request = new NextRequest(new URL('http://127.0.0.1:3000/'), {
      headers: { host: '127.0.0.1:3000' },
    });

    expect(isInternalProbe(request)).toBe(true);
  });

  it('does not treat edge-forwarded requests as internal', () => {
    const request = new NextRequest(new URL('http://web:3000/'), {
      headers: {
        host: 'web:3000',
        'x-forwarded-host': 'www.ceramedical.org',
        'x-forwarded-proto': 'https',
      },
    });

    expect(isInternalProbe(request)).toBe(false);
  });
});
