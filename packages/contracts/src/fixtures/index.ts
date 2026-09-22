/**
 * The fixture set from `.planning/data-contracts.md` section 7.
 *
 * Every record is built by parsing it through its own schema, so a contract change
 * breaks this package's build rather than surfacing as a runtime failure in
 * whichever app happened to load the fixture first. That is the whole reason the
 * fixtures live beside the contracts instead of in a test helper.
 *
 * Nothing here is imported by application code. The subpath export exists so tests
 * and the seeder can reach it, and so a bundler can drop it from a client build.
 */

export {
  after,
  at,
  days,
  email,
  FIXTURE_EMAIL_DOMAIN,
  FIXTURE_EPOCH,
  FIXTURE_HORIZON,
  FIXTURE_SUBJECT_PREFIX,
  hours,
  NON_PRODUCTION_EMAIL_SUFFIX,
  phone,
  reference,
  sha256Hex,
  subject,
  TEST_EMAIL_DOMAIN,
  uuid,
} from './deterministic.ts';

export { fixture, type Fixture, unmarked, unmarkedAll } from './marker.ts';

export {
  enquirableServiceFixtures,
  listableServiceFixtures,
  serviceByKey,
  serviceFixtures,
} from './services.ts';

export {
  ALL_ROLES,
  allIdentityFixtures,
  customerProfileFixtures,
  type FixtureIdentity,
  identityByKey,
  identityFixtures,
  identityForRole,
  unverifiedCustomerFixture,
  unverifiedCustomerProfile,
  verifiedCustomerProfile,
} from './identities.ts';

export {
  ALL_CONTENT_TYPES,
  articleFixtures,
  contentFixtures,
  DRAFT_ONLY_STRINGS,
  draftFixtures,
  pageFixture,
  policyFixtures,
  publishedContentFixtures,
  servicePresentationFixture,
} from './content.ts';

export {
  ENQUIRY_FIXTURE_KEYS,
  ENQUIRY_MESSAGE_STRINGS,
  enquiryByKey,
  enquiryFixtures,
  enquiryStatusEventFixtures,
  internalNoteFixtures,
  notesForEnquiry,
  STAFF_ONLY_STRINGS,
  statusEventsForEnquiry,
} from './enquiries.ts';

export {
  CLAIM_TOKEN_PLAINTEXT,
  claimTokenByState,
  claimTokenFixtures,
  deadLetterDeliveryFixture,
  integrationDeliveryFixtures,
  outboxFixtures,
  staleLockOutboxFixture,
} from './integrations.ts';

export { auditEventByKey, auditEventFixtures } from './audit.ts';
