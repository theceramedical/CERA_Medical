import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import {
  createdAt,
  customerStatusEnum,
  enquirySourceEnum,
  internalStatusEnum,
  primaryId,
  subjectId,
  updatedAt,
  utcTimestamp,
} from './shared.ts';

/**
 * The enquiry, and the two append-only tables that record what happened to it.
 *
 * Constraints here are not documentation. Each one encodes a rule that would
 * otherwise depend on every future caller remembering it, and the tables that
 * form the audit trail are protected by triggers rather than by convention.
 */

export const enquiries = pgTable(
  'enquiries',
  {
    id: primaryId(),
    /**
     * `CERA-YYMMDD-XXXXX`. 18 characters, fixed by the format.
     *
     * The unique index below is the real uniqueness guarantee. The generator
     * draws from 32^5 suffixes per day, which makes a collision unlikely rather
     * than impossible, and "unlikely" is not a basis for a value customers quote
     * to staff. The API retries on conflict.
     */
    reference: varchar('reference', { length: 18 }).notNull(),
    /** Null until a verified customer claims it. Set once, never reassigned. */
    customerSubjectId: subjectId('customer_subject_id'),
    name: varchar('name', { length: 120 }).notNull(),
    /**
     * Stored as submitted, not normalised.
     *
     * The address the customer typed is the one shown to staff and sent to Zoho.
     * Claim matching uses a hash of the normalised form, computed at compare
     * time, so normalisation is a matching concern and never rewrites what the
     * customer actually entered.
     */
    email: varchar('email', { length: 320 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    /** Vendure's opaque id. Cross-database, so no foreign key is possible. */
    serviceId: varchar('service_id', { length: 64 }).notNull(),
    /**
     * The most sensitive column in the platform.
     *
     * `text` with a length check rather than `varchar(2000)`: both bound the
     * value, but a check constraint names itself in the error, which makes an
     * over-long message a diagnosable rejection instead of a generic truncation
     * error from the driver.
     */
    message: text('message').notNull(),
    /**
     * Not null, and that is the enforcement point for consent.
     *
     * PRD 10 requires consent before contact. A nullable column with an
     * application check would let a future code path - a back-office import, a
     * migration backfill, a test fixture loaded into the wrong environment -
     * create an enquiry with no recorded consent. Here it cannot be inserted.
     */
    consentAt: utcTimestamp('consent_at').notNull(),
    source: enquirySourceEnum('source').notNull(),
    internalStatus: internalStatusEnum('internal_status').notNull().default('received'),
    ownerId: subjectId('owner_id'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('enquiries_reference_key').on(table.reference),
    /**
     * The staff queue's only ordering, and the only reason this index exists.
     * `(internal_status, created_at desc)` serves "open enquiries, newest first"
     * as an index scan; without it the queue is a sort over the whole table,
     * which is fine at a hundred rows and an outage at a hundred thousand.
     */
    index('enquiries_status_created_idx').on(table.internalStatus, table.createdAt.desc()),
    /** The customer dashboard. Scoped by subject in SQL, so the index leads with it. */
    index('enquiries_customer_created_idx').on(table.customerSubjectId, table.createdAt.desc()),
    /** "What is unassigned" - partial, because assigned rows are the majority. */
    index('enquiries_unassigned_idx')
      .on(table.createdAt.desc())
      .where(sql`${table.ownerId} is null`),
    index('enquiries_owner_created_idx').on(table.ownerId, table.createdAt.desc()),
    index('enquiries_service_idx').on(table.serviceId),
    check('enquiries_message_length_check', sql`char_length(${table.message}) between 10 and 2000`),
    check('enquiries_name_length_check', sql`char_length(${table.name}) >= 2`),
    /**
     * An enquiry cannot be consented to before it was received.
     *
     * A one-second tolerance, not equality: the application sets both from the
     * same `Date`, but a clock adjustment between two statements in the same
     * transaction is possible, and failing a legitimate enquiry over a
     * millisecond of NTP correction would be worse than the check is worth.
     */
    check(
      'enquiries_consent_not_future_check',
      sql`${table.consentAt} <= ${table.createdAt} + interval '1 second'`,
    ),
  ],
);

/**
 * The foreign key every enquiry child shares.
 *
 * `onDelete: 'restrict'` on all of them, so an enquiry that has any history
 * cannot be deleted. That is the point of an audit trail: a cascade would mean
 * deleting one row erases the record that it ever existed or was acted on, and
 * `set null` would leave events attached to nothing. Data subject erasure is
 * handled by redacting the personal columns and keeping the event history, which
 * is what the retention job in Phase 14 implements.
 */
const enquiryRef = (name: string) =>
  uuid(name)
    .notNull()
    .references(() => enquiries.id, { onDelete: 'restrict' });

/**
 * Append-only. Every status change in the platform's history, including the
 * creation event.
 *
 * `customerStatus` is stored rather than derived at read time. If the internal-to
 * -customer mapping is ever changed, a derived timeline would retroactively
 * rewrite what customers were previously told, which is both confusing and
 * indefensible if a dispute arises. Storing it makes history immutable in
 * substance as well as in row count.
 */
export const enquiryStatusEvents = pgTable(
  'enquiry_status_events',
  {
    id: primaryId(),
    enquiryId: enquiryRef('enquiry_id'),
    /** Null only for the creation event. */
    previousStatus: internalStatusEnum('previous_status'),
    newStatus: internalStatusEnum('new_status').notNull(),
    customerStatus: customerStatusEnum('customer_status').notNull(),
    /** Null for system transitions, such as an automatic no-response closure. */
    actorSubjectId: subjectId('actor_subject_id'),
    /** Staff-only free text. Never projected to a customer, never sent to Zoho. */
    reason: text('reason'),
    createdAt: createdAt(),
  },
  (table) => [
    /** Timeline reads, in order. Ascending here: a timeline is read oldest first. */
    index('enquiry_status_events_enquiry_created_idx').on(table.enquiryId, table.createdAt),
    check(
      'enquiry_status_events_no_self_transition_check',
      sql`${table.previousStatus} is null or ${table.previousStatus} <> ${table.newStatus}`,
    ),
    check(
      'enquiry_status_events_reason_length_check',
      sql`${table.reason} is null or char_length(${table.reason}) <= 500`,
    ),
  ],
);

/**
 * Staff-only notes. Mutable, unlike the two audit tables, because a typo in a
 * note is worth fixing - but `edited_at` records that it happened.
 */
export const internalNotes = pgTable(
  'internal_notes',
  {
    id: primaryId(),
    enquiryId: enquiryRef('enquiry_id'),
    authorSubjectId: subjectId('author_subject_id').notNull(),
    body: text('body').notNull(),
    createdAt: createdAt(),
    editedAt: utcTimestamp('edited_at'),
  },
  (table) => [
    index('internal_notes_enquiry_created_idx').on(table.enquiryId, table.createdAt),
    check('internal_notes_body_length_check', sql`char_length(${table.body}) between 1 and 4000`),
    check(
      'internal_notes_edited_after_created_check',
      sql`${table.editedAt} is null or ${table.editedAt} >= ${table.createdAt}`,
    ),
  ],
);
