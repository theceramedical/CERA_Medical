import { describe, expect, it } from 'vitest';

import { looksLikeSpam, spamScore } from './spam.ts';

describe('spamScore', () => {
  it('treats a normal appointment question as clean', () => {
    expect(looksLikeSpam('I would like to know about a first appointment.')).toBe(false);
  });

  it('flags repeated words plus several links', () => {
    expect(
      spamScore('Buy now http://a.test http://b.test http://c.test cheap cheap cheap cheap cheap'),
    ).toBeGreaterThanOrEqual(3);
  });
});
