import { sql } from 'drizzle-orm';
import { check, index, pgTable, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { createdAt, subjectId, updatedAt, utcTimestamp } from './shared.ts';

/**
 * The local projection of a customer identity.
 *
 * Authentik is the system of record. This table exists so the platform can read a
 * display name and phone number without an OIDC round trip on every render, and
 * so enquiry claiming has something to join against.
 */
export const customerProfiles = pgTable(
  'customer_profiles',
  {
    /**
     * The Authentik subject is the primary key, not a surrogate id.
     *
     * A surrogate would permit two rows for one subject, and since this table
     * governs which enquiries a person can claim, two rows is a path to one
     * customer reading another's enquiry. Making the subject the key makes that
     * state unrepresentable.
     */
    subjectId: subjectId('subject_id').primaryKey(),
    /**
     * Mirrored from Authentik at sign-in, never edited here.
     *
     * A customer who could change this column could change which enquiries they
     * match, so the profile update endpoint accepts `displayName` and `phone`
     * only. Email changes go through Authentik, which re-verifies.
     */
    email: varchar('email', { length: 320 }).notNull(),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    /** Must be non-null before any claim succeeds. */
    emailVerifiedAt: utcTimestamp('email_verified_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    /**
     * One profile per address, case-insensitively.
     *
     * Without `lower()`, `Alex@example.com` and `alex@example.com` are two rows,
     * and the claim check would match whichever the lookup happened to normalise
     * to. The unique index on the lowered value is what makes "the verified owner
     * of this address" a single, well-defined person.
     */
    uniqueIndex('customer_profiles_email_key').on(sql`lower(${table.email})`),
    index('customer_profiles_verified_idx')
      .on(table.emailVerifiedAt)
      .where(sql`${table.emailVerifiedAt} is not null`),
    check('customer_profiles_email_shape_check', sql`position('@' in ${table.email}) > 1`),
  ],
);

/**
 * Addresses that must not be emailed again.
 *
 * Populated from Resend bounce and complaint webhooks. Separate from
 * `customer_profiles` because a suppression can apply to an address that never
 * created an account - an enquiry acknowledgement bounces before anyone signs in
 * - and because a suppression must survive a profile being deleted.
 */
export const emailSuppressions = pgTable(
  'email_suppressions',
  {
    /**
     * The address, normalised and lower-cased, as the key.
     *
     * Stored in full rather than hashed. A hash would prevent operations from
     * answering "why did this customer never receive anything", which is the
     * only question this table is ever consulted for, and the address is already
     * stored in plaintext on the enquiry it came from.
     */
    email: varchar('email', { length: 320 }).primaryKey(),
    /** `bounced` or `complained`, as reported. */
    reason: varchar('reason', { length: 40 }).notNull(),
    /**
     * A hard bounce is permanent; a complaint is a standing instruction. Neither
     * expires automatically, so there is no `expires_at`: removing a suppression
     * is a deliberate administrative act, recorded as an audit event.
     */
    suppressedAt: utcTimestamp('suppressed_at').notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      'email_suppressions_reason_check',
      sql`${table.reason} in ('bounced', 'complained', 'manual')`,
    ),
    check('email_suppressions_email_lowercase_check', sql`${table.email} = lower(${table.email})`),
  ],
);
