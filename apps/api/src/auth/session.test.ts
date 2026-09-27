import { describe, expect, it } from 'vitest';

import { issueClaims, revokeSubject, sealSession, sessionKeyFromSecret, unsealSession } from './session.ts';

const KEY = sessionKeyFromSecret('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');

describe('session seal', () => {
  it('round-trips a customer session', async () => {
    const claims = issueClaims({
      sub: 'sub-1',
      email: 'alex@example.com',
      emailVerified: true,
      roles: ['customer'],
      mfa: false,
    });
    const token = await sealSession(claims, KEY);
    const opened = await unsealSession(token, KEY, claims.iat + 10);
    expect(opened?.sub).toBe('sub-1');
    expect(opened?.roles).toEqual(['customer']);
  });

  it('rejects a tampered payload', async () => {
    const claims = issueClaims({
      sub: 'sub-1',
      email: 'alex@example.com',
      emailVerified: true,
      roles: ['customer'],
      mfa: false,
    });
    const token = await sealSession(claims, KEY);
    await expect(unsealSession(`${token}x`, KEY)).rejects.toBeDefined();
  });

  it('rejects an expired session and a revoked subject', async () => {
    const claims = issueClaims(
      {
        sub: 'sub-2',
        email: 'alex@example.com',
        emailVerified: true,
        roles: ['customer'],
        mfa: false,
      },
      1_000,
    );
    const token = await sealSession(claims, KEY);
    expect(await unsealSession(token, KEY, claims.absoluteExp + 1)).toBeNull();

    const live = issueClaims({
      sub: 'sub-2',
      email: 'alex@example.com',
      emailVerified: true,
      roles: ['customer'],
      mfa: false,
    });
    revokeSubject('sub-2');
    const revoked = await sealSession(live, KEY);
    expect(await unsealSession(revoked, KEY)).toBeNull();
  });
});
