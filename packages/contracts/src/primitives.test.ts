import { describe, expect, it } from 'vitest';

import {
  EmailSchema,
  EnquiryReferenceSchema,
  generateEnquiryReference,
  hashEmail,
  hashIp,
  hashToken,
  normaliseEmail,
  PhoneSchema,
  UtcTimestampSchema,
} from './primitives.ts';

describe('generateEnquiryReference', () => {
  it('produces the documented format', () => {
    const reference = generateEnquiryReference(new Date('2026-09-21T12:00:00.000Z'));

    expect(reference).toMatch(/^CERA-260921-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{5}$/);
    expect(EnquiryReferenceSchema.safeParse(reference).success).toBe(true);
  });

  it('uses UTC, not local time', () => {
    // Late-evening UTC would roll to the next day in a positive-offset zone, so
    // a reference could claim a date the enquiry was not received on.
    const reference = generateEnquiryReference(new Date('2026-09-21T23:59:59.000Z'));

    expect(reference.startsWith('CERA-260921-')).toBe(true);
  });

  it('never emits an ambiguous character', () => {
    // Crockford base32 excludes I, L, O, and U so a reference cannot be misread
    // over the phone, and cannot accidentally spell an offensive word.
    const suffixes = Array.from(
      { length: 400 },
      () => generateEnquiryReference().split('-')[2] ?? '',
    );
    const offending = suffixes.filter((suffix) => /[ILOU]/.test(suffix));

    expect(offending).toEqual([]);
  });

  it('does not collide across 100k draws on one day', () => {
    // The suffix space is 32^5 ~= 33.5M per day, so the birthday expectation at
    // 100k draws is roughly 150 collisions. Asserting zero would be asserting
    // luck. What this proves is that the generator draws from the full space:
    // a stuck seed, a truncated alphabet, or a time-derived suffix would produce
    // orders of magnitude more duplicates than chance allows.
    //
    // The API still treats the unique index on `enquiries.reference` as the real
    // guarantee and retries on conflict. This test is about the generator's
    // entropy, not about uniqueness.
    const draws = 100_000;
    const fixedDay = new Date('2026-09-21T12:00:00.000Z');
    const references = new Set(
      Array.from({ length: draws }, () => generateEnquiryReference(fixedDay)),
    );

    const collisions = draws - references.size;

    expect(collisions).toBeLessThan(600);
    // Every draw is still well-formed, not merely distinct.
    expect(
      [...references].every((reference) => EnquiryReferenceSchema.safeParse(reference).success),
    ).toBe(true);
  });

  it('spreads across the whole alphabet rather than a subset of it', () => {
    // A generator that used `randomInt(0, 16)` or indexed a shorter string would
    // pass a collision test at this sample size while halving the real space.
    const used = new Set(
      Array.from({ length: 20_000 }, () =>
        generateEnquiryReference(new Date('2026-09-21T12:00:00.000Z')),
      ).flatMap((reference) => [...(reference.split('-')[2] ?? '')]),
    );

    expect([...used].sort().join('')).toBe('0123456789ABCDEFGHJKMNPQRSTVWXYZ');
  });
});

describe('EnquiryReferenceSchema', () => {
  it('rejects a reference containing an ambiguous character', () => {
    expect(EnquiryReferenceSchema.safeParse('CERA-260921-ABCIO').success).toBe(false);
  });

  it('rejects lower case and a wrong-length suffix', () => {
    expect(EnquiryReferenceSchema.safeParse('cera-260921-A4B7Z').success).toBe(false);
    expect(EnquiryReferenceSchema.safeParse('CERA-260921-A4B7').success).toBe(false);
  });
});

describe('normaliseEmail', () => {
  it('trims and lower-cases', () => {
    expect(normaliseEmail('  Alex.Morgan@Example.COM ')).toBe('alex.morgan@example.com');
  });

  it('does not strip dots or plus tags', () => {
    // Provider-specific aliasing rules are not applied. Guessing wrong would let
    // one person claim another's enquiry, so the address the customer actually
    // verified is the one that must match.
    expect(normaliseEmail('a.b+tag@example.com')).toBe('a.b+tag@example.com');
  });
});

describe('hashEmail', () => {
  it('is stable across equivalent inputs', () => {
    expect(hashEmail('Alex@Example.com')).toBe(hashEmail(' alex@example.com '));
  });

  it('differs for different addresses', () => {
    expect(hashEmail('a@example.com')).not.toBe(hashEmail('b@example.com'));
  });

  it('returns a 64-character lower-case hex digest', () => {
    expect(hashEmail('a@example.com')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('does not contain the address', () => {
    expect(hashEmail('alex@example.com')).not.toContain('alex');
  });
});

describe('hashToken', () => {
  it('is deterministic and case-sensitive', () => {
    const token = 'J8KQ2M4NPRSTVWXYZ012';

    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(hashToken(token.toLowerCase()));
  });
});

describe('hashIp', () => {
  it('requires a salt', () => {
    // The IPv4 space is small enough that an unsalted hash is fully
    // brute-forceable in seconds, which would make it personal data in practice.
    expect(() => hashIp('203.0.113.4', '')).toThrow(/IP_HASH_SALT/);
  });

  it('produces different digests under different salts', () => {
    expect(hashIp('203.0.113.4', 'salt-a')).not.toBe(hashIp('203.0.113.4', 'salt-b'));
  });

  it('does not contain the address', () => {
    expect(hashIp('203.0.113.4', 'salt')).not.toContain('203');
  });
});

describe('EmailSchema', () => {
  it('accepts a normal address', () => {
    expect(EmailSchema.safeParse('alex.morgan@example.com').success).toBe(true);
  });

  it('rejects an address over the RFC 5321 limit', () => {
    const tooLong = `${'a'.repeat(250)}@example.com`;

    expect(EmailSchema.safeParse(tooLong).success).toBe(false);
  });

  it('rejects obvious malformations', () => {
    for (const invalid of ['alex', 'alex@', '@example.com', 'alex morgan@example.com']) {
      expect(EmailSchema.safeParse(invalid).success, invalid).toBe(false);
    }
  });
});

describe('PhoneSchema', () => {
  it('accepts international and spaced formats', () => {
    for (const valid of ['+441632960001', '01632 960001', '+44 (0) 1632 960001']) {
      expect(PhoneSchema.safeParse(valid).success, valid).toBe(true);
    }
  });

  it('rejects letters and an over-long value', () => {
    expect(PhoneSchema.safeParse('call me maybe').success).toBe(false);
    expect(PhoneSchema.safeParse('1'.repeat(30)).success).toBe(false);
  });

  it('rejects a value too short to be a real number', () => {
    expect(PhoneSchema.safeParse('12345').success).toBe(false);
  });
});

describe('UtcTimestampSchema', () => {
  it('accepts UTC with milliseconds', () => {
    expect(UtcTimestampSchema.safeParse('2026-09-21T12:00:00.000Z').success).toBe(true);
  });

  it('rejects an offset, so stored values are directly comparable', () => {
    expect(UtcTimestampSchema.safeParse('2026-09-21T12:00:00.000+01:00').success).toBe(false);
  });

  it('rejects a date without a time', () => {
    expect(UtcTimestampSchema.safeParse('2026-09-21').success).toBe(false);
  });
});

// Pagination is covered in pagination.test.ts, alongside the cursor codec.
