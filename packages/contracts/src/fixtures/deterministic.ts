import { createHash } from 'node:crypto';

/**
 * How every fixture identifier, timestamp, and hash is produced.
 *
 * Fixtures are deterministic so that a fixture-dependent test failure reproduces
 * exactly. The obvious way to get that is a seeded PRNG drawn in declaration
 * order, and it is the wrong way: inserting a fixture at the top of a file shifts
 * every identifier below it, so a one-line addition produces a diff across the
 * whole set and invalidates any ID quoted in a test, a runbook, or a bug report.
 *
 * These helpers derive each value from a stable *name* instead. `uuid('enquiry-
 * referred')` is the same UUID whatever else changes around it, which makes the
 * set stable under insertion and reordering as well as reproducible.
 */

/**
 * The instant the fixture world is anchored to.
 *
 * A fixed date rather than `Date.now()`, because a relative base makes "created
 * 40 days ago" drift across runs and turns any assertion about age or retention
 * into a test that passes today and fails in March.
 */
export const FIXTURE_EPOCH = '2026-01-05T09:00:00.000Z';

/**
 * Far enough ahead that anything expiring at it is live whenever the tests run.
 *
 * Needed because the epoch is in the past: a fixture given a realistic 30-minute
 * TTL has already lapsed by the time a test executes, so "not yet expired" cannot
 * be expressed as an offset from the epoch and has to be expressed as a date no
 * plausible run reaches. Ten years, not 2099 - a date that far out tends to be
 * treated as "never" and stops being questioned.
 */
export const FIXTURE_HORIZON = '2036-01-05T09:00:00.000Z';

const FIXTURE_EPOCH_MS = Date.parse(FIXTURE_EPOCH);
const MS_PER_MINUTE = 60_000;

/**
 * Domain for every fixture address.
 *
 * `.invalid` is reserved by RFC 2606 and guaranteed never to resolve, so a
 * fixture that escapes into a real send path cannot reach a mailbox - not even a
 * misconfigured internal one. That is a stronger guarantee than `example.com`,
 * which does resolve.
 */
export const FIXTURE_EMAIL_DOMAIN = 'fixture.cera.invalid';

/**
 * The suffix shared by every address that is not a real person's.
 *
 * Fixtures use `fixture.cera.invalid` and the database integration tests use
 * `test.cera.invalid`, so each can clear its own rows without touching the other's
 * - but both end in this, which is what lets the seed guard ask the one question it
 * actually cares about: "is there anything in this database that belongs to a real
 * customer?"
 *
 * One suffix and two domains, rather than one domain, because a single marker would
 * mean `pnpm seed:reset` deletes rows a test run is relying on and a test's cleanup
 * deletes the seeded fixtures.
 */
export const NON_PRODUCTION_EMAIL_SUFFIX = '.cera.invalid';

/** The domain for rows created by a test run, cleared by that run. */
export const TEST_EMAIL_DOMAIN = 'test.cera.invalid';

/** Prefix on every fixture subject id, so a production query can find them. */
export const FIXTURE_SUBJECT_PREFIX = 'fixture-';

/**
 * Ofcom's reserved drama range, 07700 900000-900999.
 *
 * Numbers in it are permanently unallocated, so a fixture that reaches an SMS or
 * dialler path rings nobody. A plausible-looking invented number will eventually
 * belong to a real person.
 */
const FIXTURE_PHONE_BASE = 7_700_900_000;

/** Crockford base32, matching `generateEnquiryReference`. */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * A stable 32-byte digest for a fixture name.
 *
 * Namespaced so that `uuid('x')` and `tokenHash('x')` cannot collide into the
 * same bytes, which would make two unrelated fixtures share a value and produce
 * a confusing constraint violation rather than an obvious one.
 */
function digest(namespace: string, name: string): Buffer {
  return createHash('sha256').update(`cera-fixture:${namespace}:${name}`, 'utf8').digest();
}

/**
 * A timestamp `minutes` after the fixture epoch, in the contracts' UTC form.
 *
 * Minutes rather than a free-form date string so the ordering of any two fixtures
 * is visible at the call site as two numbers, instead of requiring the reader to
 * compare two ISO strings.
 */
export function at(minutes: number): string {
  return new Date(FIXTURE_EPOCH_MS + minutes * MS_PER_MINUTE).toISOString();
}

/** Minutes for a whole number of days, for readability at call sites. */
export function days(count: number): number {
  return count * 24 * 60;
}

/** Minutes for a whole number of hours. */
export function hours(count: number): number {
  return count * 60;
}

/**
 * A timestamp `minutes` after another timestamp.
 *
 * For fixtures positioned relative to a parent rather than to the epoch - a note
 * on an enquiry, an edit of that note. Expressing those as an epoch offset means
 * changing the enquiry's age silently moves its notes before it, which produces a
 * check-constraint violation a long way from the line that caused it.
 */
export function after(timestamp: string, minutes: number): string {
  const base = Date.parse(timestamp);

  if (Number.isNaN(base)) {
    throw new Error(`after() needs a parseable timestamp, got "${timestamp}"`);
  }

  return new Date(base + minutes * MS_PER_MINUTE).toISOString();
}

/**
 * A valid UUID v7 whose time bits come from `createdAt` and whose random bits
 * come from `name`.
 *
 * Real v7s from `primaryId()` sort by creation time, and index behaviour and any
 * keyset pagination test depend on that. Fixtures with random-ordered ids would
 * pass while the production ordering assumption went unverified, so the layout is
 * reproduced exactly rather than approximated.
 *
 * RFC 9562 section 5.7: 48 bits of millisecond timestamp, 4-bit version 7,
 * 12 bits rand_a, 2-bit variant 0b10, 62 bits rand_b.
 */
export function uuid(name: string, createdAt: string): string {
  const timestampMs = Date.parse(createdAt);

  if (Number.isNaN(timestampMs)) {
    throw new Error(`Fixture uuid("${name}") needs a parseable timestamp, got "${createdAt}"`);
  }

  const bytes = Buffer.alloc(16);
  const random = digest('uuid', name);

  // 48-bit big-endian millisecond timestamp. `writeUIntBE` caps at 6 bytes,
  // which is exactly the width needed.
  bytes.writeUIntBE(timestampMs, 0, 6);

  bytes[6] = 0x70 | (random[0]! & 0x0f);
  bytes[7] = random[1]!;
  bytes[8] = 0x80 | (random[2]! & 0x3f);
  random.copy(bytes, 9, 3, 10);

  const hex = bytes.toString('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * A reference in the production format, `CERA-YYMMDD-XXXXX`.
 *
 * The date part is taken from `createdAt` rather than invented, so a fixture
 * reference and its row agree - a test that asserts "the reference encodes the
 * day the enquiry was received" would otherwise pass against a value that only
 * looks right.
 */
export function reference(name: string, createdAt: string): string {
  const date = new Date(createdAt);
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  const random = digest('reference', name);
  let suffix = '';
  for (let index = 0; index < 5; index += 1) {
    suffix += CROCKFORD_ALPHABET[random[index]! % CROCKFORD_ALPHABET.length];
  }

  return `CERA-${yy}${mm}${dd}-${suffix}`;
}

/** A lower-case hex SHA-256 standing in for a real token hash. */
export function sha256Hex(name: string): string {
  return digest('sha256', name).toString('hex');
}

/** A fixture address at the reserved domain. */
export function email(localPart: string): string {
  return `${localPart}@${FIXTURE_EMAIL_DOMAIN}`;
}

/** A fixture subject id, prefixed so production can be queried for leaks. */
export function subject(name: string): string {
  return `${FIXTURE_SUBJECT_PREFIX}${name}`;
}

/**
 * A number in the reserved drama range, derived from `name`.
 *
 * Bounded to 1000 by the size of the range. Two fixture names can therefore
 * collide onto one number, which is harmless: the phone column is neither unique
 * nor a key, and a shared number is more honest than silently leaving the range.
 */
export function phone(name: string): string {
  const offset = digest('phone', name).readUInt16BE(0) % 1000;

  return `+44 ${String(FIXTURE_PHONE_BASE + offset).replace(/^(\d{4})(\d{6})$/, '$1 $2')}`;
}
