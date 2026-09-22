import { type CustomerProfile, CustomerProfileSchema } from '../entities.ts';
import { type Role, RoleSchema } from '../enums.ts';

import { at, days, email, phone, subject } from './deterministic.ts';
import { fixture, type Fixture } from './marker.ts';

/**
 * One identity per role, plus the customers.
 *
 * Staff identities are not database rows: Authentik is the system of record and
 * `cera_app` stores only a subject id on the rows staff touch. These fixtures are
 * therefore the *inputs* to the authorisation matrix in Phase 09 - the set of
 * callers every endpoint test is run against - rather than something the seeder
 * inserts. Only the customer profiles below are persisted.
 *
 * Covering every role exhaustively matters more than it looks. An access-control
 * test suite that checks "staff can, customer cannot" passes while `auditor` is
 * quietly able to write, because nobody wrote a case for it. `RoleSchema.options`
 * is asserted against this list, so adding a role fails the fixture test until
 * that role has an identity and therefore a test subject.
 */

export interface FixtureIdentity {
  /** Stable key, used to name the identity in a test. */
  key: string;
  subjectId: string;
  email: string;
  displayName: string;
  role: Role;
  /**
   * Whether Authentik reports the address as verified.
   *
   * The claim guard depends on it, so at least one identity must be unverified or
   * the guard is only ever exercised on its passing branch.
   */
  emailVerified: boolean;
  /** Whether the role requires MFA at sign-in (PRD 9). */
  mfaRequired: boolean;
}

function identity(
  key: string,
  role: Role,
  displayName: string,
  options: { emailVerified?: boolean; mfaRequired?: boolean } = {},
): Fixture<FixtureIdentity> {
  return fixture({
    key,
    subjectId: subject(key),
    email: email(key),
    displayName,
    role,
    emailVerified: options.emailVerified ?? true,
    // Every staff role requires MFA; customers do not. Derived rather than passed
    // at each call site, so a new staff role cannot be added without it.
    mfaRequired: options.mfaRequired ?? role !== 'customer',
  });
}

/**
 * Seven identities, one per role, in `RoleSchema` order.
 *
 * Names are obviously synthetic. A fixture called "Sarah Johnson" eventually
 * appears in a screenshot in a ticket and someone has to establish whether it is
 * a real patient; "Editor Fixture" never raises that question.
 */
export const identityFixtures: readonly Fixture<FixtureIdentity>[] = [
  identity('customer-verified', 'customer', 'Verified Customer'),
  identity('content-editor', 'content_editor', 'Editor Fixture'),
  identity('content-approver', 'content_approver', 'Approver Fixture'),
  identity('enquiry-handler', 'enquiry_handler', 'Handler Fixture'),
  identity('operations-manager', 'operations_manager', 'Operations Fixture'),
  identity('administrator', 'administrator', 'Administrator Fixture'),
  identity('auditor', 'auditor', 'Auditor Fixture'),
];

/**
 * The eighth identity: a customer whose address Authentik has not verified.
 *
 * Separate from the seven so "one identity per role" stays a checkable property.
 * This one exists for a single case, and it is the one that matters most in the
 * portal: an unverified account must not be able to claim an enquiry, because the
 * claim is what grants access to another person's message and contact details.
 */
export const unverifiedCustomerFixture: Fixture<FixtureIdentity> = identity(
  'customer-unverified',
  'customer',
  'Unverified Customer',
  { emailVerified: false },
);

/** Every identity, including the unverified customer. */
export const allIdentityFixtures: readonly Fixture<FixtureIdentity>[] = [
  ...identityFixtures,
  unverifiedCustomerFixture,
];

/** Lookup by key, so a test names the caller it is acting as. */
export function identityByKey(key: string): Fixture<FixtureIdentity> {
  const found = allIdentityFixtures.find((candidate) => candidate.key === key);

  if (found === undefined) {
    throw new Error(`No identity fixture with key "${key}"`);
  }

  return found;
}

/** The single identity holding a role. Throws if a role has none. */
export function identityForRole(role: Role): Fixture<FixtureIdentity> {
  const found = identityFixtures.find((candidate) => candidate.role === role);

  if (found === undefined) {
    throw new Error(`No identity fixture for role "${role}"; every role needs a test subject`);
  }

  return found;
}

/** Asserted by the fixture tests: every role has exactly one identity. */
export const ALL_ROLES: readonly Role[] = RoleSchema.options;

// ---------------------------------------------------------------------------
// Customer profiles - the only identity rows that live in cera_app
// ---------------------------------------------------------------------------

function profile(
  identityFixture: Fixture<FixtureIdentity>,
  createdAtMinutes: number,
): Fixture<CustomerProfile> {
  return fixture(
    CustomerProfileSchema.parse({
      subjectId: identityFixture.subjectId,
      email: identityFixture.email,
      displayName: identityFixture.displayName,
      phone: phone(identityFixture.key),
      // Verified an hour after the account was created, not at the same instant:
      // equal timestamps would let a test that means "verified after signup" pass
      // against a `>=` comparison that should be `>`.
      emailVerifiedAt: identityFixture.emailVerified ? at(createdAtMinutes + 60) : null,
      createdAt: at(createdAtMinutes),
      updatedAt: at(createdAtMinutes + 60),
    }),
  );
}

export const customerProfileFixtures: readonly Fixture<CustomerProfile>[] = [
  profile(identityByKey('customer-verified'), -days(60)),
  profile(unverifiedCustomerFixture, -days(2)),
];

/** The verified customer, who owns the claimed enquiry. */
export const verifiedCustomerProfile: Fixture<CustomerProfile> = customerProfileFixtures[0]!;

/** The unverified customer, who must fail every claim attempt. */
export const unverifiedCustomerProfile: Fixture<CustomerProfile> = customerProfileFixtures[1]!;
