import { describe, expect, it } from 'vitest';

import { PREVIEW_TTL_SECONDS, signPreviewToken, verifyPreviewToken } from './preview-token.ts';

const SECRET = 'test-preview-secret-not-used-elsewhere';

describe('preview tokens', () => {
  it('round-trips a path', () => {
    const token = signPreviewToken(SECRET, '/about');

    expect(verifyPreviewToken(SECRET, token, '/about')).toBe(true);
  });

  it('rejects a token minted for a different path', () => {
    const token = signPreviewToken(SECRET, '/about');

    expect(verifyPreviewToken(SECRET, token, '/privacy')).toBe(false);
  });

  it('rejects a protocol-relative path, which would leave the site', () => {
    expect(() => signPreviewToken(SECRET, '//evil.test')).toThrow(/single-origin/);
    expect(verifyPreviewToken(SECRET, '1.00', '//evil.test')).toBe(false);
  });

  it('expires after the published ttl', () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);
    const token = signPreviewToken(SECRET, '/about', now);

    expect(
      verifyPreviewToken(SECRET, token, '/about', now + (PREVIEW_TTL_SECONDS - 1) * 1000),
    ).toBe(true);
    expect(
      verifyPreviewToken(SECRET, token, '/about', now + (PREVIEW_TTL_SECONDS + 1) * 1000),
    ).toBe(false);
  });

  it('rejects a rewritten expiry', () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);
    const token = signPreviewToken(SECRET, '/about', now);
    const [, digest] = token.split('.');
    const farFuture = String(Math.floor(now / 1000) + 60 * 60 * 24);
    const tampered = `${farFuture}.${digest ?? ''}`;

    expect(verifyPreviewToken(SECRET, tampered, '/about', now)).toBe(false);
  });
});
