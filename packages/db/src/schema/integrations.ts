import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { enquiries } from './enquiries.ts';
import {
  createdAt,
  deliveryStatusEnum,
  integrationEventTypeEnum,
  integrationProviderEnum,
  outboxStatusEnum,
  primaryId,
  sha256Hex,
  subjectId,
  updatedAt,
  utcTimestamp,
} from './shared.ts';

/**
 * The outbox, the delivery ledger, and the claim tokens.
 *
 * The outbox is what makes PRD 8.1 true: an enquiry write and the intent to call
 * Zoho and Resend commit in one transaction, so there is no window in which an
 * enquiry exists and its downstream work has been lost, and no window in which a
 * CRM lead exists for an enquiry that was rolled back.
 */

export const outbox = pgTable(
  'outbox',
  {
    id: primaryId(),
    /** Only enquiries produce outbox work today; the column exists so that can change. */
    aggregateType: varchar('aggregate_type', { length: 40 }).notNull().default('enquiry'),
    aggregateId: uuid('aggregate_id').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    /**
     * Minimised. Identifiers, not records.
     *
     * The worker re-reads current state at send time. A payload snapshot would
     * send stale data after a retry - a status the enquiry has since moved past -
     * and would duplicate personal data into a second table with its own
     * retention story.
     */
    payload: jsonb('payload').notNull(),
    /** When this row becomes eligible. Moved forward by backoff on each failure. */
    availableAt: utcTimestamp('available_at').notNull().defaultNow(),
    attempts: smallint('attempts').notNull().default(0),
    /** Non-null while a worker holds the claim. */
    lockedAt: utcTimestamp('locked_at'),
    /**
     * Which worker holds it, so a stale lock can be attributed to a container
     * that died rather than merely reaped anonymously.
     */
    lockedBy: varchar('locked_by', { length: 120 }),
    status: outboxStatusEnum('status').notNull().default('pending'),
    /** Truncated classification only. Never a provider response body. */
    lastError: varchar('last_error', { length: 200 }),
    createdAt: createdAt(),
  },
  (table) => [
    /**
     * The sweep index, and the only query that runs on a timer.
     *
     * Partial on `pending`, because completed rows accumulate and are never swept
     * again - including them would grow the index without bound and make the
     * claim query slower every day the platform runs. Ordered by `available_at`
     * so the sweep is an index scan with `for update skip locked`.
     */
    index('outbox_pending_available_idx')
      .on(table.availableAt)
      .where(sql`${table.status} = 'pending'`),
    /** Finds locks held by a worker that is no longer running, so they can be reaped. */
    index('outbox_locked_idx')
      .on(table.lockedAt)
      .where(sql`${table.lockedAt} is not null`),
    index('outbox_aggregate_idx').on(table.aggregateType, table.aggregateId),
    /**
     * A lock is `locked_at` and `locked_by` together, or neither.
     *
     * Half a lock is the state that produces the worst bug in this table: a row
     * that looks claimed and cannot be attributed, so the reaper cannot decide
     * whether the holder is alive. Making it unrepresentable is cheaper than
     * detecting it.
     */
    check(
      'outbox_lock_consistency_check',
      sql`(${table.lockedAt} is null) = (${table.lockedBy} is null)`,
    ),
    check('outbox_attempts_bounded_check', sql`${table.attempts} between 0 and 100`),
  ],
);

/**
 * One row per attempt-bearing delivery to an external provider.
 *
 * This is the record operations read when asked "did the CRM get this enquiry",
 * and the dead-letter queue is a filter over it rather than a separate table -
 * a separate table would mean a retried dead letter loses its attempt history.
 */
export const integrationDeliveries = pgTable(
  'integration_deliveries',
  {
    id: primaryId(),
    enquiryId: uuid('enquiry_id')
      .notNull()
      .references(() => enquiries.id, { onDelete: 'restrict' }),
    provider: integrationProviderEnum('provider').notNull(),
    eventType: integrationEventTypeEnum('event_type').notNull(),
    /**
     * The key sent to the provider, and the reason a retry does not duplicate.
     *
     * Unique across the table, which is what turns at-least-once delivery from
     * the worker into effectively-once at the provider: a replayed job computes
     * the same key, the insert conflicts, and the worker knows the call already
     * happened without asking the provider.
     */
    idempotencyKey: varchar('idempotency_key', { length: 256 }).notNull(),
    /** The provider's identifier once known, for example a Zoho lead id. */
    externalId: varchar('external_id', { length: 200 }),
    attempt: smallint('attempt').notNull().default(0),
    status: deliveryStatusEnum('status').notNull().default('pending'),
    responseCode: integer('response_code'),
    /**
     * A classification such as `rate_limited` or `auth_failed`, never a raw
     * provider body.
     *
     * Provider errors routinely echo the request. Storing the body would put the
     * enquiry message into a table that every staff member can list and filter,
     * which is exactly the exposure the projection rules exist to prevent.
     */
    errorClass: varchar('error_class', { length: 120 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('integration_deliveries_idempotency_key').on(table.idempotencyKey),
    index('integration_deliveries_enquiry_idx').on(table.enquiryId, table.createdAt.desc()),
    /** The dead-letter view, which is the reason the ops endpoint exists. */
    index('integration_deliveries_dead_letter_idx')
      .on(table.createdAt.desc())
      .where(sql`${table.status} = 'dead_letter'`),
    index('integration_deliveries_provider_status_idx').on(table.provider, table.status),
    check(
      'integration_deliveries_response_code_check',
      sql`${table.responseCode} is null or ${table.responseCode} between 100 and 599`,
    ),
    check('integration_deliveries_attempt_bounded_check', sql`${table.attempt} between 0 and 100`),
    /**
     * A succeeded delivery must say which record it created.
     *
     * Without `external_id` there is no way to find the Zoho lead later, which
     * makes reconciliation impossible and a duplicate on the next full sync
     * likely. `resend` is exempt only in that its id is the message id, which it
     * always returns.
     */
    check(
      'integration_deliveries_success_has_external_id_check',
      sql`${table.status} <> 'succeeded' or ${table.externalId} is not null`,
    ),
  ],
);

/**
 * Single-use, short-lived tokens that let a verified customer attach an existing
 * enquiry to their account.
 *
 * Neither the token nor the email is stored. Both are hashed, so a read of this
 * table - by a compromised database account, or in a backup that leaks - yields
 * nothing usable: the tokens cannot be replayed, and the addresses cannot be
 * enumerated.
 */
export const enquiryClaimTokens = pgTable(
  'enquiry_claim_tokens',
  {
    id: primaryId(),
    enquiryId: uuid('enquiry_id')
      .notNull()
      .references(() => enquiries.id, { onDelete: 'restrict' }),
    /** SHA-256 of the normalised email. The address itself is never on this row. */
    emailHash: sha256Hex('email_hash').notNull(),
    /**
     * SHA-256 of the token. The token exists only in the email that was sent.
     *
     * Unique, so consumption is a single conditional `UPDATE ... WHERE
     * consumed_at IS NULL` that either affects one row or none. That makes
     * single-use a property of the database rather than of a check-then-act
     * sequence two concurrent requests could both pass.
     */
    tokenHash: sha256Hex('token_hash').notNull(),
    expiresAt: utcTimestamp('expires_at').notNull(),
    consumedAt: utcTimestamp('consumed_at'),
    consumedBySubjectId: subjectId('consumed_by_subject_id'),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('enquiry_claim_tokens_token_hash_key').on(table.tokenHash),
    /** Rate-limits issuance per enquiry, and finds a live token to reuse. */
    index('enquiry_claim_tokens_enquiry_idx').on(table.enquiryId, table.createdAt.desc()),
    /** The expiry sweep. Partial, since consumed rows are never expired. */
    index('enquiry_claim_tokens_expiry_idx')
      .on(table.expiresAt)
      .where(sql`${table.consumedAt} is null`),
    check(
      'enquiry_claim_tokens_expires_after_created_check',
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    /**
     * A consumed token records who consumed it, or it is not consumed.
     *
     * The pair is the evidence that a specific account claimed a specific
     * enquiry. Half of it proves nothing, and this is the one join that decides
     * whether a customer may read an enquiry.
     */
    check(
      'enquiry_claim_tokens_consumption_consistency_check',
      sql`(${table.consumedAt} is null) = (${table.consumedBySubjectId} is null)`,
    ),
  ],
);
