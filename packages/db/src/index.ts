/**
 * `@cera/db` - the Drizzle schema and pool factory for `cera_app` (ADR-009).
 *
 * Exports the schema and a connection factory, and nothing else. No query
 * helpers: PRD 1.2 requires authorisation and record-ownership checks to live in
 * one auditable layer, and a shared package of convenience queries is exactly how
 * an ownership filter ends up applied in one place and forgotten in another.
 */

export {
  createDatabase,
  type CreateDatabaseOptions,
  type Database,
  type DatabaseHandle,
  schema,
} from './client.ts';

export {
  APPEND_ONLY_TABLES,
  auditEvents,
  auditTargetTypeEnum,
  customerProfiles,
  customerStatusEnum,
  deliveryStatusEnum,
  emailSuppressions,
  enquiries,
  enquiryClaimTokens,
  enquirySourceEnum,
  enquiryStatusEvents,
  integrationDeliveries,
  integrationEventTypeEnum,
  integrationProviderEnum,
  internalNotes,
  internalStatusEnum,
  outbox,
  outboxStatusEnum,
} from './schema/index.ts';
