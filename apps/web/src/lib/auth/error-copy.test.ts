import { describe, expect, it } from 'vitest';

import { authErrorCopy } from './error-copy.ts';

describe('auth error copy', () => {
  it('explains when an authenticated account lacks a CERA role', () => {
    expect(authErrorCopy('access').title).toBe('Your account does not have CERA access yet');
    expect(authErrorCopy('access').plan).toContain('right CERA group');
  });

  it('distinguishes expired attempts, MFA, provider, and service errors', () => {
    expect(authErrorCopy('expired').title).toContain('expired');
    expect(authErrorCopy('mfa').title).toContain('multi-factor');
    expect(authErrorCopy('provider').lede).toContain('Authentik');
    expect(authErrorCopy('unavailable').title).toContain('temporarily unavailable');
  });

  it('uses safe generic copy for unknown or repeated query values', () => {
    expect(authErrorCopy('unexpected').title).toBe('Sign-in could not be completed');
    expect(authErrorCopy(['access', 'unexpected']).title).toBe('Sign-in could not be completed');
  });
});
