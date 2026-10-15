import { describe, expect, it } from 'vitest';

import {
  buildEmailVerificationSignInHref,
  emailInboxLink,
  suggestedOidcProviderForEmail,
} from './email-verification-help.ts';

describe('emailInboxLink', () => {
  it('maps Gmail addresses to Gmail webmail', () => {
    expect(emailInboxLink('user@gmail.com')).toEqual({
      href: 'https://mail.google.com/',
      label: 'Open Gmail',
    });
  });

  it('returns null for unknown domains', () => {
    expect(emailInboxLink('user@ceramedical.org')).toBeNull();
  });
});

describe('suggestedOidcProviderForEmail', () => {
  it('suggests Google for Gmail', () => {
    expect(suggestedOidcProviderForEmail('thestackandscale@gmail.com')).toBe('google');
  });
});

describe('buildEmailVerificationSignInHref', () => {
  it('requests a fresh login and preserves return path', () => {
    expect(buildEmailVerificationSignInHref('/account', 'google')).toBe(
      '/auth/signin?next=%2Faccount&refresh=1&provider=google',
    );
  });
});
