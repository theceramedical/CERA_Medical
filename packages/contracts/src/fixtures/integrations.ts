import {
  CLAIM_TOKEN_TTL_MINUTES,
  type EnquiryClaimToken,
  EnquiryClaimTokenSchema,
  type IntegrationDelivery,
  IntegrationDeliverySchema,
  type OutboxRecord,
  OutboxRecordSchema,
} from '../entities.ts';
import { hashEmail, hashToken } from '../primitives.ts';

import { after, FIXTURE_HORIZON, hours, sha256Hex, uuid } from './deterministic.ts';
import { enquiryByKey } from './enquiries.ts';
import { unverifiedCustomerProfile, verifiedCustomerProfile } from './identities.ts';
import { fixture, type Fixture } from './marker.ts';

import type { DeliveryStatus, IntegrationEventType, IntegrationProvider } from '../enums.ts';

/**
 * The delivery ledger, the outbox, and the claim tokens.
 *
 * These three tables are where the platform's failure modes live, so the fixtures
 * cover states rather than happy paths. A seed set containing only successful
 * deliveries and consumed-nothing tokens would leave the dead-letter view, the
 * lock reaper, and the two claim rejections with no data behind them - and each of
 * those is a path that only runs when something has already gone wrong, which is
 * the worst time to discover it was never exercised.
 */

// ---------------------------------------------------------------------------
// Integration deliveries
// ---------------------------------------------------------------------------

interface DeliverySeed {
  key: string;
  enquiryKey: string;
  provider: IntegrationProvider;
  eventType: IntegrationEventType;
  status: DeliveryStatus;
  attempt: number;
  responseCode: number | null;
  errorClass: string | null;
  /** Hours after the enquiry arrived. */
  offsetHours: number;
}

const DELIVERY_SEEDS: readonly DeliverySeed[] = [
  {
    key: 'zoho-received-unclaimed',
    enquiryKey: 'received-unclaimed',
    provider: 'zoho',
    eventType: 'zoho.lead.upsert',
    status: 'succeeded',
    attempt: 1,
    responseCode: 201,
    errorClass: null,
    offsetHours: 1,
  },
  {
    key: 'resend-received-unclaimed',
    enquiryKey: 'received-unclaimed',
    provider: 'resend',
    eventType: 'resend.customer.receipt',
    status: 'succeeded',
    attempt: 1,
    responseCode: 200,
    errorClass: null,
    offsetHours: 1,
  },
  {
    key: 'resend-staff-alert',
    enquiryKey: 'received-unclaimed',
    provider: 'resend',
    eventType: 'resend.staff.alert',
    status: 'succeeded',
    attempt: 1,
    responseCode: 200,
    errorClass: null,
    offsetHours: 1,
  },
  {
    key: 'resend-status-update',
    enquiryKey: 'in-progress',
    provider: 'resend',
    eventType: 'resend.status.update',
    status: 'succeeded',
    attempt: 1,
    responseCode: 200,
    errorClass: null,
    offsetHours: 13,
  },
  {
    /**
     * Mid-retry. `pending` with a non-zero attempt and a 429 recorded, which is the
     * state a rate-limited delivery sits in between backoffs - and the state a
     * reconciliation job must not mistake for a failure worth re-queuing.
     */
    key: 'zoho-retrying',
    enquiryKey: 'triaging',
    provider: 'zoho',
    eventType: 'zoho.lead.upsert',
    status: 'pending',
    attempt: 2,
    responseCode: 429,
    errorClass: 'rate_limited',
    offsetHours: 2,
  },
  {
    /**
     * In flight. Claimed by a worker and not yet resolved. Exists so a test can
     * assert that a second worker does not pick it up.
     */
    key: 'zoho-in-flight',
    enquiryKey: 'referred',
    provider: 'zoho',
    eventType: 'zoho.lead.upsert',
    status: 'in_flight',
    attempt: 1,
    responseCode: null,
    errorClass: null,
    offsetHours: 3,
  },
  {
    /**
     * Failed and retryable. Distinct from `dead_letter`: the difference decides
     * whether the worker tries again, and conflating them either abandons
     * recoverable work or retries forever.
     */
    key: 'resend-failed',
    enquiryKey: 'awaiting-customer',
    provider: 'resend',
    eventType: 'resend.status.update',
    status: 'failed',
    attempt: 3,
    responseCode: 502,
    errorClass: 'upstream_unavailable',
    offsetHours: 16,
  },
  {
    /**
     * The dead letter. The reason `in-progress-dead-letter` exists at all.
     *
     * Five attempts exhausted against an auth failure, which is the realistic case:
     * a rotated Zoho credential fails every retry identically, so backoff never
     * helps and the row must end up somewhere a human looks. `errorClass` is a
     * classification, never the provider's body - Zoho echoes the request, and the
     * request contains the enquiry message.
     */
    key: 'zoho-dead-letter',
    enquiryKey: 'in-progress-dead-letter',
    provider: 'zoho',
    eventType: 'zoho.lead.upsert',
    status: 'dead_letter',
    attempt: 5,
    responseCode: 401,
    errorClass: 'auth_failed',
    offsetHours: 4,
  },
];

export const integrationDeliveryFixtures: readonly Fixture<IntegrationDelivery>[] =
  DELIVERY_SEEDS.map((seed) => {
    const enquiryFixture = enquiryByKey(seed.enquiryKey);
    const createdAt = after(enquiryFixture.createdAt, hours(seed.offsetHours));

    return fixture(
      IntegrationDeliverySchema.parse({
        id: uuid(`delivery-${seed.key}`, createdAt),
        enquiryId: enquiryFixture.id,
        provider: seed.provider,
        eventType: seed.eventType,
        /**
         * Shaped like the real key: provider, event, and the enquiry it belongs to.
         *
         * Derived from those three rather than random, because that is what makes a
         * replayed job compute the same key and conflict on the unique index. A
         * random fixture key would make the uniqueness constraint look satisfied
         * while proving nothing about idempotency.
         */
        idempotencyKey: `${seed.provider}:${seed.eventType}:${enquiryFixture.id}`,
        // A succeeded delivery must carry the provider's id - there is a check
        // constraint for it, because without one the record cannot be reconciled and
        // the next full sync duplicates it.
        externalId: seed.status === 'succeeded' ? `ext-${sha256Hex(seed.key).slice(0, 16)}` : null,
        attempt: seed.attempt,
        status: seed.status,
        responseCode: seed.responseCode,
        errorClass: seed.errorClass,
        createdAt,
        updatedAt: after(createdAt, hours(seed.attempt)),
      }),
    );
  });

/** The dead-lettered delivery, which the ops dead-letter view must surface. */
export const deadLetterDeliveryFixture: Fixture<IntegrationDelivery> =
  integrationDeliveryFixtures.find((delivery) => delivery.status === 'dead_letter')!;

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

/**
 * One row per outbox state, because the sweep query treats each differently.
 *
 * The locked row is the one that earns its place: a worker that dies holding a lock
 * leaves exactly this row, and whether the reaper releases it decides between an
 * enquiry whose Zoho lead is late and one that never arrives at all.
 */
const OUTBOX_SEEDS: readonly {
  key: string;
  enquiryKey: string;
  eventType: string;
  status: OutboxRecord['status'];
  attempts: number;
  /** Hours after the enquiry arrived that the row becomes eligible. */
  availableAfterHours: number;
  lockedBy?: string;
  lastError?: string;
}[] = [
  {
    key: 'pending-zoho',
    enquiryKey: 'received-claimed',
    eventType: 'zoho.lead.upsert',
    status: 'pending',
    attempts: 0,
    availableAfterHours: 0,
  },
  {
    key: 'pending-backed-off',
    enquiryKey: 'triaging',
    eventType: 'zoho.lead.upsert',
    status: 'pending',
    attempts: 2,
    // Backed off into the future relative to its enquiry, so a sweep that ignores
    // `available_at` picks it up and the test fails - which is the point.
    availableAfterHours: 8,
    lastError: 'rate_limited',
  },
  {
    key: 'stale-lock',
    enquiryKey: 'referred',
    eventType: 'zoho.lead.upsert',
    status: 'in_flight',
    attempts: 1,
    availableAfterHours: 1,
    lockedBy: 'worker-fixture-1',
  },
  {
    key: 'done',
    enquiryKey: 'received-unclaimed',
    eventType: 'resend.customer.receipt',
    status: 'done',
    attempts: 1,
    availableAfterHours: 0,
  },
  {
    key: 'dead-letter',
    enquiryKey: 'in-progress-dead-letter',
    eventType: 'zoho.lead.upsert',
    status: 'dead_letter',
    attempts: 5,
    availableAfterHours: 4,
    lastError: 'auth_failed',
  },
];

export const outboxFixtures: readonly Fixture<OutboxRecord>[] = OUTBOX_SEEDS.map((seed) => {
  const enquiryFixture = enquiryByKey(seed.enquiryKey);
  const createdAt = after(enquiryFixture.createdAt, hours(1));

  return fixture(
    OutboxRecordSchema.parse({
      id: uuid(`outbox-${seed.key}`, createdAt),
      aggregateType: 'enquiry',
      aggregateId: enquiryFixture.id,
      eventType: seed.eventType,
      /**
       * Identifiers only. The worker re-reads current state at send time.
       *
       * A payload snapshot would send a status the enquiry has since moved past
       * after a retry, and would duplicate personal data into a second table with
       * its own retention story. The `requestId` is here so a delivery failing hours
       * later still links back to the request that created it.
       */
      payload: {
        enquiryId: enquiryFixture.id,
        reference: enquiryFixture.reference,
        requestId: `fixture-request-${seed.key}`,
      },
      availableAt: after(enquiryFixture.createdAt, hours(seed.availableAfterHours)),
      attempts: seed.attempts,
      // A lock is both columns or neither - there is a check constraint for it,
      // because half a lock is a row that looks claimed and cannot be attributed.
      lockedAt: seed.lockedBy === undefined ? null : after(createdAt, hours(2)),
      lockedBy: seed.lockedBy ?? null,
      status: seed.status,
      lastError: seed.lastError ?? null,
      createdAt,
    }),
  );
});

/** The row a reaper must release. Held by a worker that is no longer running. */
export const staleLockOutboxFixture: Fixture<OutboxRecord> = outboxFixtures.find(
  (record) => record.lockedBy !== null,
)!;

// ---------------------------------------------------------------------------
// Claim tokens: one valid, one expired, one consumed
// ---------------------------------------------------------------------------

/**
 * The three states, and the plaintext tokens that hash to them.
 *
 * The plaintext is exported because a claim test has to present a token, and the
 * table stores only the hash - there is no way to recover it. Keeping the pair here
 * is what lets the claim flow be tested end to end without the test reaching into
 * the hashing function and reimplementing it.
 *
 * Production tokens are 160 bits of CSPRNG output. These are fixed strings, and are
 * safe to be fixed because the reserved `.invalid` domain means they can only ever
 * match a fixture enquiry.
 */
export const CLAIM_TOKEN_PLAINTEXT = {
  valid: 'fixture-claim-token-valid-Vq8Zy3Nk2Rt7Bw4Xc6Fm',
  expired: 'fixture-claim-token-expired-Hs5Jd9Pl1Qz3Tn8Vb2Kg',
  consumed: 'fixture-claim-token-consumed-Wm4Ry7Cx2Zf6Bq9Tj3Ns',
} as const;

interface ClaimTokenSeed {
  key: keyof typeof CLAIM_TOKEN_PLAINTEXT;
  enquiryKey: string;
  /** The address the token was sent to. Hashed; never stored in the clear. */
  email: string;
  /**
   * Whether the token is live or has lapsed, as seen from whenever the test runs.
   *
   * Not a TTL in minutes, and that is the subtle part. Every fixture is anchored to
   * a fixed date in the past, so a token given the production 30-minute TTL is
   * already expired by the time any test executes - which would make "the valid
   * token" and "the expired token" behave identically and the difference between
   * them untested. `live` therefore means "expires beyond any plausible run".
   *
   * A test that needs the expiry *boundary* rather than either side of it should
   * inject a clock instead of relying on wall time.
   */
  expiry: 'live' | 'lapsed';
  /** Hours after issuance it was consumed, if it was. */
  consumedAfterHours?: number;
  consumedBy?: string;
  /** Hours after the enquiry arrived that the token was issued. */
  issuedOffsetHours: number;
}

const CLAIM_TOKEN_SEEDS: readonly ClaimTokenSeed[] = [
  {
    key: 'valid',
    enquiryKey: 'received-claimed',
    email: verifiedCustomerProfile.email,
    expiry: 'live',
    issuedOffsetHours: 1,
  },
  {
    /**
     * Expired, and still unconsumed.
     *
     * Issued to the unverified customer, so this single row covers both rejections
     * a claim attempt can hit - past expiry and unverified claimant - and a test
     * that only fixes one of them still fails.
     */
    key: 'expired',
    enquiryKey: 'received-unclaimed',
    email: unverifiedCustomerProfile.email,
    expiry: 'lapsed',
    issuedOffsetHours: 2,
  },
  {
    /**
     * Already consumed. Must be rejected on a second presentation.
     *
     * Single use is enforced by a conditional `UPDATE ... WHERE consumed_at IS
     * NULL`, so this row is what proves the second attempt affects no rows rather
     * than quietly succeeding.
     */
    key: 'consumed',
    enquiryKey: 'completed',
    email: verifiedCustomerProfile.email,
    // Consumed fifteen minutes in, then allowed to lapse, which is the ordering a
    // real consumed token has: used well inside its window and never renewed.
    expiry: 'lapsed',
    consumedAfterHours: 0.25,
    consumedBy: verifiedCustomerProfile.subjectId,
    issuedOffsetHours: 3,
  },
];

export const claimTokenFixtures: readonly Fixture<EnquiryClaimToken>[] = CLAIM_TOKEN_SEEDS.map(
  (seed) => {
    const enquiryFixture = enquiryByKey(seed.enquiryKey);
    const createdAt = after(enquiryFixture.createdAt, hours(seed.issuedOffsetHours));

    return fixture(
      EnquiryClaimTokenSchema.parse({
        id: uuid(`claim-token-${seed.key}`, createdAt),
        enquiryId: enquiryFixture.id,
        // Hashed through the production function, not a stand-in. Claim matching
        // compares `sha256(normalisedEmail)` values, and a fixture that hashed
        // differently would make every claim test pass against data the real
        // comparison would never match.
        emailHash: hashEmail(seed.email),
        // Hashed from the exported plaintext, not an unrelated digest. The table
        // stores only the hash, so a claim test presents the plaintext and the
        // lookup has to find this row - which it only does if this is genuinely
        // `hashToken` of that string.
        tokenHash: hashToken(CLAIM_TOKEN_PLAINTEXT[seed.key]),
        expiresAt:
          seed.expiry === 'live' ? FIXTURE_HORIZON : after(createdAt, CLAIM_TOKEN_TTL_MINUTES),
        consumedAt:
          seed.consumedAfterHours === undefined
            ? null
            : after(createdAt, hours(seed.consumedAfterHours)),
        consumedBySubjectId: seed.consumedBy ?? null,
        createdAt,
      }),
    );
  },
);

/** Lookup by state, so a test names the case it is exercising. */
export function claimTokenByState(
  state: keyof typeof CLAIM_TOKEN_PLAINTEXT,
): Fixture<EnquiryClaimToken> {
  const index = CLAIM_TOKEN_SEEDS.findIndex((seed) => seed.key === state);

  return claimTokenFixtures[index]!;
}
