import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createHandshakeSecrets,
  createPkce,
  configuredCallbackUrl,
  identityClaims,
  openHandshake,
  sealHandshake,
} from './oidc.ts';

const original = process.env.SESSION_SECRET;
beforeEach(() => {
  process.env.SESSION_SECRET = Buffer.alloc(32, 7).toString('base64');
});
afterEach(() => {
  if (original === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = original;
});

describe('OIDC boundary', () => {
  it('uses the registered public callback URI for token exchange', () => {
    const originalRedirectUri = process.env.OIDC_REDIRECT_URI;
    process.env.OIDC_REDIRECT_URI = 'https://www.ceramedical.org/auth/callback';
    try {
      expect(
        configuredCallbackUrl(
          new URL('http://0.0.0.0:3000/auth/callback?code=code&state=state'),
        ).toString(),
      ).toBe('https://www.ceramedical.org/auth/callback?code=code&state=state');
    } finally {
      if (originalRedirectUri === undefined) delete process.env.OIDC_REDIRECT_URI;
      else process.env.OIDC_REDIRECT_URI = originalRedirectUri;
    }
  });

  it('seals state and rejects tampering and expiry', async () => {
    const state = {
      ...createHandshakeSecrets(),
      verifier: createPkce().verifier,
      next: '/account',
      createdAt: Date.now(),
    };
    const token = await sealHandshake(state);
    expect((await openHandshake(token)).state).toBe(state.state);
    const segments = token.split('.');
    const tag = Buffer.from(segments[4]!, 'base64url');
    tag[0] = tag[0]! ^ 1;
    segments[4] = tag.toString('base64url');
    await expect(openHandshake(segments.join('.'))).rejects.toThrow();
    await expect(
      openHandshake(await sealHandshake({ ...state, createdAt: Date.now() - 601_000 })),
    ).rejects.toThrow();
  });
  it('maps only known groups and requires identity fields', () => {
    const c = identityClaims({
      sub: 'sub-1',
      email: 'person@example.test',
      email_verified: true,
      groups: ['cera-enquiry-handlers', 'unknown'],
      cera_mfa: true,
    });
    expect(c.roles).toEqual(['enquiry_handler']);
    expect(c.mfa).toBe(true);
    expect(() => identityClaims({ sub: 'x', groups: ['cera-administrators'] })).toThrow();
  });
});
