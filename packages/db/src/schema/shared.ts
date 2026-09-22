import {
  AuditTargetTypeSchema,
  DeliveryStatusSchema,
  EnquirySourceSchema,
  IntegrationEventTypeSchema,
  IntegrationProviderSchema,
  OutboxStatusSchema,
} from '@cera/contracts/enums';
import { ALL_CUSTOMER_STATUSES, ALL_INTERNAL_STATUSES } from '@cera/contracts/status';
import { char, pgEnum, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

/**
 * Column and enum building blocks shared by every table.
 *
 * The enums are derived from the Zod enums in `@cera/contracts` rather than
 * retyped. Retyping them would let the database and the application disagree,
 * and the failure mode is the worst kind: an `INSERT` that passes validation and
 * is rejected by a check constraint at runtime, in a transaction that has already
 * written its audit event.
 */

/**
 * Drizzle's `pgEnum` needs a non-empty readonly tuple, which `z.enum().options`
 * does not narrow to. The cast is confined to this one helper so no table file
 * repeats it, and it is safe because every contract enum has at least one member
 * - asserted by the enum tests in `@cera/contracts`.
 */
const toPgEnumValues = (values: readonly string[]): [string, ...string[]] =>
  values as unknown as [string, ...string[]];

export const internalStatusEnum = pgEnum('internal_status', toPgEnumValues(ALL_INTERNAL_STATUSES));
export const customerStatusEnum = pgEnum('customer_status', toPgEnumValues(ALL_CUSTOMER_STATUSES));
export const enquirySourceEnum = pgEnum(
  'enquiry_source',
  toPgEnumValues(EnquirySourceSchema.options),
);
export const integrationProviderEnum = pgEnum(
  'integration_provider',
  toPgEnumValues(IntegrationProviderSchema.options),
);
export const integrationEventTypeEnum = pgEnum(
  'integration_event_type',
  toPgEnumValues(IntegrationEventTypeSchema.options),
);
export const deliveryStatusEnum = pgEnum(
  'delivery_status',
  toPgEnumValues(DeliveryStatusSchema.options),
);
export const outboxStatusEnum = pgEnum('outbox_status', toPgEnumValues(OutboxStatusSchema.options));
export const auditTargetTypeEnum = pgEnum(
  'audit_target_type',
  toPgEnumValues(AuditTargetTypeSchema.options),
);

/**
 * The primary key for every table in `cera_app`.
 *
 * UUID v7, generated in the application, not by the database. Two reasons, and
 * the second is the one that matters here:
 *
 * 1. UUID v7 is time-ordered, so inserts append to the end of the index instead
 *    of scattering writes across it the way UUID v4 does. On the enquiries table
 *    that is the difference between a B-tree that stays dense and one that
 *    fragments.
 * 2. The application needs the id *before* the insert. An enquiry write is one
 *    transaction that inserts the enquiry, its first status event, an audit
 *    event, and an outbox row, all referencing that id. Letting the database
 *    generate it would mean a `RETURNING` round trip before the dependent
 *    inserts, and would make the outbox payload impossible to build up front.
 *
 * No `defaultRandom()`: a v4 default would silently produce the wrong kind of id
 * for any insert that forgot to supply one.
 */
export const primaryId = () => uuid('id').primaryKey();

/**
 * `timestamptz`, always, and `withTimezone: true` is the whole point.
 *
 * Postgres `timestamp` without a zone stores wall-clock text and compares it
 * naively, so a deploy that changes the server's `TZ`, or a staff member in a
 * different offset, silently shifts what "created before" means. `timestamptz`
 * stores an instant. The contracts layer additionally rejects offsets in its
 * string form, so a value is unambiguous at both ends.
 */
export const utcTimestamp = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'string' });

/**
 * `created_at` defaulting to the server clock.
 *
 * `defaultNow()` is a safety net, not the intended path: the application passes
 * an explicit value so that the timestamp on the enquiry, its status event, and
 * its audit event are identical rather than microseconds apart, which makes a
 * timeline read consistently. The default exists so a row can never be written
 * without one.
 */
export const createdAt = () => utcTimestamp('created_at').notNull().defaultNow();

export const updatedAt = () => utcTimestamp('updated_at').notNull().defaultNow();

/**
 * An Authentik subject identifier.
 *
 * `text`, not a foreign key. Identities live in the `authentik` database, owned
 * by a separate service, and a cross-database reference is not expressible in
 * Postgres. That is a real limitation with a real consequence: a deleted
 * Authentik user leaves a dangling `owner_id`. Handled deliberately - the staff
 * UI resolves unknown subjects to "former staff member" rather than failing -
 * because the alternative, deleting or rewriting audit rows when a user leaves,
 * would destroy the audit trail the PRD requires.
 */
export const subjectId = (name: string) => varchar(name, { length: 255 });

/** SHA-256 in lower-case hex. Fixed width, so `char` rather than `varchar`. */
export const sha256Hex = (name: string) => char(name, { length: 64 });
