import { describe, expect, it } from 'vitest';

import { authErrorCopy } from './error-copy.ts';

describe('auth error copy', () => {
  it('explains when an authenticated identity lacks an assigned staff role', () => {
    expect(authErrorCopy('access').title).toBe('This identity is not assigned staff access');
    expect(authErrorCopy('access').plan).toContain('email and role allowlist');
  });

  it('describes the Cloudflare Access staff configuration path', () => {
    expect(authErrorCopy('configuration').title).toContain('Staff access');
    expect(authErrorCopy('configuration').plan).toContain('guest orders');
  });

  it('uses safe generic copy for unknown or repeated query values', () => {
    expect(authErrorCopy('unexpected').title).toBe('Sign-in could not be completed');
    expect(authErrorCopy(['access', 'unexpected']).title).toBe('Sign-in could not be completed');
  });
});
