import { type AuditEvent, AuditEventSchema } from '../entities.ts';

import { after, hours, uuid } from './deterministic.ts';
import { enquiryByKey, statusEventsForEnquiry } from './enquiries.ts';
import { identityByKey } from './identities.ts';
import { fixture, type Fixture } from './marker.ts';

import type { AuditTargetType } from '../enums.ts';

/**
 * Audit events, including one per target type.
 *
 * The important property these encode is what a `safeDiff` is allowed to contain.
 * Free-text fields are recorded as `{ changed: true }`, never by value, so the
 * audit table does not become a second copy of enquiry messages and note bodies
 * that outlives the retention policy applied to the originals. Every fixture below
 * respects that, so a test can assert it over the whole set rather than trusting
 * each future caller to remember.
 *
 * `AuditTargetTypeSchema.options` is asserted against these, because an unaudited
 * target type is a category of action with no trail behind it.
 */

const ADMINISTRATOR = identityByKey('administrator').subjectId;
const HANDLER = identityByKey('enquiry-handler').subjectId;
const EDITOR = identityByKey('content-editor').subjectId;
const APPROVER = identityByKey('content-approver').subjectId;

interface AuditSeed {
  key: string;
  actor: string | null;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  safeDiff: AuditEvent['safeDiff'];
  createdAt: string;
}

const enquiryFixture = enquiryByKey('in-progress');
const transitionEvent = statusEventsForEnquiry('in-progress').at(-1)!;

const AUDIT_SEEDS: readonly AuditSeed[] = [
  {
    key: 'enquiry-created',
    // Null actor: the submission was made by an unauthenticated visitor. Attributing
    // it to anyone would make the trail claim a person acted when none did.
    actor: null,
    action: 'enquiry.created',
    targetType: 'enquiry',
    targetId: enquiryFixture.id,
    // No diff on creation: there is no prior state, and a diff listing every field
    // would copy the message into the audit table.
    safeDiff: null,
    createdAt: enquiryFixture.createdAt,
  },
  {
    key: 'enquiry-status-changed',
    actor: HANDLER,
    action: 'enquiry.status.changed',
    targetType: 'enquiry',
    targetId: enquiryFixture.id,
    safeDiff: {
      internalStatus: { from: transitionEvent.previousStatus, to: transitionEvent.newStatus },
      // The reason is staff-only free text, so it is recorded as having changed and
      // not by value. This is the single most load-bearing line in the file: the
      // alternative puts a staff judgement about a customer into a table that
      // outlives the enquiry.
      reason: { changed: true },
    },
    createdAt: transitionEvent.createdAt,
  },
  {
    key: 'enquiry-assigned',
    actor: HANDLER,
    action: 'enquiry.owner.assigned',
    targetType: 'enquiry',
    targetId: enquiryFixture.id,
    safeDiff: { ownerId: { from: null, to: HANDLER } },
    createdAt: after(enquiryFixture.createdAt, hours(2)),
  },
  {
    key: 'content-published',
    actor: APPROVER,
    action: 'content.published',
    targetType: 'content',
    // Not a UUID. `targetId` is deliberately a string so it can hold a Payload or
    // Vendure identifier, and at least one fixture exercises that rather than
    // letting every row happen to be a UUID and the width go unnoticed.
    targetId: 'payload-post-understanding-heart-health',
    safeDiff: {
      status: { from: 'draft', to: 'published' },
      approverId: { from: null, to: APPROVER },
    },
    createdAt: after(enquiryFixture.createdAt, hours(3)),
  },
  {
    key: 'customer-profile-updated',
    actor: identityByKey('customer-verified').subjectId,
    action: 'customer.profile.updated',
    targetType: 'customer',
    targetId: identityByKey('customer-verified').subjectId,
    // Both are personal data, so both are recorded as changed rather than by value.
    safeDiff: { displayName: { changed: true }, phone: { changed: true } },
    createdAt: after(enquiryFixture.createdAt, hours(4)),
  },
  {
    key: 'service-updated',
    actor: EDITOR,
    action: 'service.enquiry_enabled.changed',
    targetType: 'service',
    targetId: 'vendure-product-diagnostic-tests',
    safeDiff: { enquiryEnabled: { from: true, to: false } },
    createdAt: after(enquiryFixture.createdAt, hours(5)),
  },
  {
    key: 'user-role-granted',
    actor: ADMINISTRATOR,
    action: 'user.role.granted',
    targetType: 'user',
    targetId: HANDLER,
    safeDiff: { roles: { from: ['customer'], to: ['customer', 'enquiry_handler'] } },
    createdAt: after(enquiryFixture.createdAt, hours(6)),
  },
  {
    key: 'release-deployed',
    // Null actor: a deploy is performed by CI, not by a signed-in person. The
    // request id is what ties it to the workflow run.
    actor: null,
    action: 'release.deployed',
    targetType: 'release',
    targetId: 'v1.0.0',
    safeDiff: { release: { from: 'v0.9.3', to: 'v1.0.0' } },
    createdAt: after(enquiryFixture.createdAt, hours(7)),
  },
];

export const auditEventFixtures: readonly Fixture<AuditEvent>[] = AUDIT_SEEDS.map((seed) =>
  fixture(
    AuditEventSchema.parse({
      id: uuid(`audit-${seed.key}`, seed.createdAt),
      actorSubjectId: seed.actor,
      action: seed.action,
      targetType: seed.targetType,
      targetId: seed.targetId,
      safeDiff: seed.safeDiff,
      // Ties the change to the request that made it, and therefore to the logs.
      // Shaped like a real request id so a test that validates the format passes.
      requestId: `fixture-request-${seed.key}`,
      createdAt: seed.createdAt,
    }),
  ),
);

/** Lookup by key, so a test names the action it is asserting on. */
export function auditEventByKey(key: string): Fixture<AuditEvent> {
  const index = AUDIT_SEEDS.findIndex((seed) => seed.key === key);

  if (index === -1) {
    throw new Error(`No audit event fixture with key "${key}"`);
  }

  return auditEventFixtures[index]!;
}
