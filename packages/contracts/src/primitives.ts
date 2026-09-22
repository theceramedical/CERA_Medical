import { createHash, randomInt } from 'node:crypto';

import { z } from 'zod';

/**
 * Shared scalars, plus the two derivations that must be identical everywhere
 * they are computed: email normalisation and hashing.
 *
 * Hashing lives here rather than at each call site because a claim token is
 * matched by comparing `sha256(normalisedEmail)` values. If the API normalised
 * one way and the worker another, the comparison would fail for a subset of
 * addresses and the bug would look like "claiming is flaky". ESLint blocks
 * `createHash` imports outside this module for that reason.
 */

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/**
 * UUID v7. Chosen over v4 because v7 embeds a timestamp and therefore sorts by
 * creation time, which keeps B-tree index inserts sequential instead of
 * scattering them across the index.
 */
export const Uuidv7Schema = z.uuidv7();

/**
 * `CERA-YYMMDD-XXXXX`, where the suffix is five Crockford base32 characters.
 *
 * Crockford's alphabet excludes I, L, O, and U, so a reference cannot be
 * misread over the phone and cannot accidentally spell an offensive word. The
 * reference is the identifier a customer quotes to staff, so ambiguity here has
 * a real support cost.
 */
export const EnquiryReferenceSchema = z
  .string()
  .regex(/^CERA-[0-9]{6}-[0-9ABCDEFGHJKMNPQRSTVWXYZ]{5}$/, {
    message: 'Expected a reference in the form CERA-YYMMDD-XXXXX',
  });

/** Authentik subject claim. Opaque; never parsed or assumed to be a UUID. */
export const SubjectIdSchema = z.string().min(1).max(255);

export const SlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Expected a lower-case slug with single hyphen separators',
  });

// ---------------------------------------------------------------------------
// Contact details
// ---------------------------------------------------------------------------

/** 254 is the maximum length of an address permitted by RFC 5321. */
export const EmailSchema = z.email().max(254);

/**
 * Permissive on purpose. Rejecting a valid international number is a worse
 * outcome than accepting an odd one: the enquiry is the customer's only route
 * in, and staff can read a malformed number. Length and character class are
 * bounded; format is not asserted.
 */
export const PhoneSchema = z
  .string()
  .min(7)
  .max(24)
  .regex(/^[+0-9][0-9\s()-]*$/, {
    message: 'Enter a phone number using digits, spaces, + ( ) or -',
  });

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/** UTC ISO 8601. Offsets are rejected so stored values are directly comparable. */
export const UtcTimestampSchema = z.iso.datetime({ offset: false });

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

/**
 * Lower-cases and trims. Deliberately does NOT strip dots or `+tags`: for some
 * providers `a.b@` and `ab@` are the same mailbox, but that is provider-specific
 * and guessing wrong would let one person claim another's enquiry. Matching the
 * address the customer actually verified is the safe rule.
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** SHA-256 hex of the normalised address. The address itself is never stored. */
export function hashEmail(email: string): string {
  return createHash('sha256').update(normaliseEmail(email), 'utf8').digest('hex');
}

/**
 * SHA-256 hex of a claim token.
 *
 * Unsalted and deliberately so: the value being hashed is 160 bits of CSPRNG
 * output, not a password, so there is no dictionary to defend against and a
 * per-record salt would prevent the constant-time lookup by hash that makes
 * claiming a single indexed query.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Salted hash of a client IP, for rate limiting.
 *
 * Raw addresses are never persisted (PRD 10, minimisation). The salt is what
 * makes this non-reversible in practice: the IPv4 space is small enough that an
 * unsalted hash can be brute-forced completely in seconds.
 */
export function hashIp(ip: string, salt: string): string {
  if (salt.length === 0) {
    throw new Error('IP_HASH_SALT must be set; an unsalted IP hash is trivially reversible.');
  }
  return createHash('sha256').update(`${salt}:${ip}`, 'utf8').digest('hex');
}

export const Sha256HexSchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/, {
    message: 'Expected a lower-case hexadecimal SHA-256 digest',
  });

// ---------------------------------------------------------------------------
// Enquiry reference generation
// ---------------------------------------------------------------------------

/** Crockford base32, excluding I, L, O, and U. */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const REFERENCE_SUFFIX_LENGTH = 5;

/**
 * Generates `CERA-YYMMDD-XXXXX`.
 *
 * `randomInt` is used rather than `Math.random` because the reference appears in
 * customer emails and is quoted to staff; a predictable sequence would let
 * someone enumerate other people's references.
 *
 * 32^5 is about 33.5 million suffixes per day, so collisions are rare but not
 * impossible. The caller retries against the unique constraint rather than
 * checking first, because a check-then-insert has a race between the two.
 *
 * @param now Injectable for deterministic tests.
 */
export function generateEnquiryReference(now: Date = new Date()): string {
  const year = String(now.getUTCFullYear()).slice(-2);
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  let suffix = '';
  for (let index = 0; index < REFERENCE_SUFFIX_LENGTH; index += 1) {
    suffix += CROCKFORD_ALPHABET[randomInt(0, CROCKFORD_ALPHABET.length)];
  }

  return `CERA-${year}${month}${day}-${suffix}`;
}

// Pagination lives in `pagination.ts`: it needs the cursor codec and the error
// envelope, and a primitive module should not depend on either.
