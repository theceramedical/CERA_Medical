/**
 * The `cera_app` schema, as one module.
 *
 * `drizzle-kit` reads this file to generate migrations, so a table that is not
 * exported here does not exist as far as migrations are concerned - which is the
 * failure mode to watch for when adding one.
 */

export {
  auditTargetTypeEnum,
  customerStatusEnum,
  deliveryStatusEnum,
  enquirySourceEnum,
  integrationEventTypeEnum,
  integrationProviderEnum,
  internalStatusEnum,
  outboxStatusEnum,
} from './shared.ts';

export { enquiries, enquiryStatusEvents, internalNotes } from './enquiries.ts';
export { customerProfiles, emailSuppressions } from './identity.ts';
export { auditEvents } from './audit.ts';
export { enquiryClaimTokens, integrationDeliveries, outbox } from './integrations.ts';

/**
 * The tables an `UPDATE` or `DELETE` must never reach.
 *
 * Exported as data, not left implicit in a migration, so the trigger migration
 * and the test that proves the trigger works both read the same list. A table
 * added to one and not the other is the gap this closes.
 */
export const APPEND_ONLY_TABLES = ['enquiry_status_events', 'audit_events'] as const;
