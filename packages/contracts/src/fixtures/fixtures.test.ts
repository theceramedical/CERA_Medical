import { describe, expect, it } from 'vitest';

import {
  AuditEventSchema,
  ContentDocumentSchema,
  CustomerProfileSchema,
  EnquiryClaimTokenSchema,
  EnquirySchema,
  EnquiryStatusEventSchema,
  IntegrationDeliverySchema,
  InternalNoteSchema,
  OutboxRecordSchema,
  PROHIBITED_ENQUIRY_FIELDS,
  ServiceSchema,
} from '../entities.ts';
import { AuditTargetTypeSchema, RoleSchema } from '../enums.ts';
import { EnquiryReferenceSchema, hashToken, Uuidv7Schema } from '../primitives.ts';
import {
  ALL_CUSTOMER_STATUSES,
  ALL_INTERNAL_STATUSES,
  canTransition,
  isTerminalStatus,
  toCustomerStatus,
} from '../status.ts';

import {
  ALL_CONTENT_TYPES,
  allIdentityFixtures,
  articleFixtures,
  at,
  auditEventFixtures,
  CLAIM_TOKEN_PLAINTEXT,
  claimTokenByState,
  claimTokenFixtures,
  contentFixtures,
  customerProfileFixtures,
  deadLetterDeliveryFixture,
  draftFixtures,
  enquirableServiceFixtures,
  enquiryByKey,
  enquiryFixtures,
  enquiryStatusEventFixtures,
  FIXTURE_EMAIL_DOMAIN,
  FIXTURE_HORIZON,
  FIXTURE_SUBJECT_PREFIX,
  identityFixtures,
  identityForRole,
  integrationDeliveryFixtures,
  internalNoteFixtures,
  listableServiceFixtures,
  notesForEnquiry,
  outboxFixtures,
  policyFixtures,
  publishedContentFixtures,
  reference,
  serviceByKey,
  serviceFixtures,
  staleLockOutboxFixture,
  statusEventsForEnquiry,
  unmarked,
  unverifiedCustomerProfile,
  uuid,
  verifiedCustomerProfile,
} from './index.ts';

/**
 * What this file is for.
 *
 * Fixtures are trusted by every other test in the monorepo, which makes them the
 * one place where a wrong value is invisible: a test asserting "the claimed
 * enquiry belongs to the verified customer" passes against a fixture where it does
 * not, and the assertion that was supposed to catch a real bug instead certifies
 * the fixture's mistake. So the properties asserted here are the ones the rest of
 * the suite assumes rather than checks.
 */

describe('marker', () => {
  const allFixtures = [
    ...serviceFixtures,
    ...contentFixtures,
    ...customerProfileFixtures,
    ...enquiryFixtures,
    ...enquiryStatusEventFixtures,
    ...internalNoteFixtures,
    ...integrationDeliveryFixtures,
    ...outboxFixtures,
    ...claimTokenFixtures,
    ...auditEventFixtures,
    ...allIdentityFixtures,
  ];

  it('marks every fixture', () => {
    for (const record of allFixtures) {
      expect(record.__fixture).toBe(true);
    }
  });

  it('freezes every fixture', () => {
    // Fixtures are module-level singletons shared across a file. A test that
    // mutated one to set up a case would change the meaning of every later test in
    // the run, and the failure would surface in whichever ran next.
    for (const record of allFixtures) {
      expect(Object.isFrozen(record)).toBe(true);
    }
  });

  it('strips the marker for persistence', () => {
    expect(unmarked(enquiryFixtures[0]!)).not.toHaveProperty('__fixture');
  });

  it('gives every record a unique id', () => {
    // A name collision, or two fixtures derived from the same name, shows up as a
    // primary key violation halfway through seeding - after some rows are in.
    const ids = allFixtures.flatMap((record) => ('id' in record ? [record.id] : []));

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('deterministic derivation', () => {
  it('returns the same uuid for the same name', () => {
    expect(uuid('thing', at(0))).toBe(uuid('thing', at(0)));
  });

  it('returns different uuids for different names', () => {
    expect(uuid('thing-a', at(0))).not.toBe(uuid('thing-b', at(0)));
  });

  it('produces a valid UUID v7', () => {
    // Real ids come from `primaryId()` and are v7, which sorts by time. Fixtures
    // with v4-shaped ids would pass while leaving the ordering assumption that
    // keyset pagination depends on unverified.
    expect(Uuidv7Schema.safeParse(uuid('thing', at(0))).success).toBe(true);
  });

  it('sorts uuids by their timestamp', () => {
    const earlier = uuid('zzz-sorts-last-by-name', at(0));
    const later = uuid('aaa-sorts-first-by-name', at(60));

    // Compared as strings, which is how Postgres orders a uuid column's text form
    // and what makes a time-ordered id useful at all.
    expect(earlier < later).toBe(true);
  });

  it('produces references in the production format', () => {
    expect(EnquiryReferenceSchema.safeParse(reference('thing', at(0))).success).toBe(true);
  });

  it('encodes the creation date in the reference', () => {
    // 2026-01-05, the fixture epoch.
    expect(reference('thing', at(0)).slice(0, 12)).toBe('CERA-260105-');
  });

  it('gives every enquiry a schema-valid, unique reference', () => {
    const references = enquiryFixtures.map((enquiry) => enquiry.reference);

    for (const value of references) {
      expect(EnquiryReferenceSchema.safeParse(value).success).toBe(true);
    }
    expect(new Set(references).size).toBe(references.length);
  });
});

describe('contact details are unreachable', () => {
  it('puts every address at the reserved .invalid domain', () => {
    // RFC 2606 guarantees `.invalid` never resolves, so a fixture that escapes into
    // a real send path cannot reach a mailbox - not even a misconfigured internal
    // one, which `example.com` would.
    const addresses = [
      ...enquiryFixtures.map((enquiry) => enquiry.email),
      ...customerProfileFixtures.map((profile) => profile.email),
      ...allIdentityFixtures.map((identity) => identity.email),
    ];

    for (const address of addresses) {
      expect(address.endsWith(`@${FIXTURE_EMAIL_DOMAIN}`)).toBe(true);
    }
  });

  it('draws every phone number from the reserved drama range', () => {
    // Ofcom's 07700 900000-900999 is permanently unallocated. An invented number
    // eventually belongs to a real person.
    const numbers = [
      ...enquiryFixtures.flatMap((enquiry) => (enquiry.phone === null ? [] : [enquiry.phone])),
      ...customerProfileFixtures.flatMap((profile) =>
        profile.phone === null ? [] : [profile.phone],
      ),
    ];

    expect(numbers.length).toBeGreaterThan(0);
    for (const number of numbers) {
      expect(number).toMatch(/^\+44 7700 900\d{3}$/);
    }
  });

  it('keeps internal vocabulary out of customer-facing fields', () => {
    /**
     * Regression guard. The enquiry addresses were originally derived from the fixture
     * key, which encodes the internal status - so `enquiry-triaging@...` put the word
     * `triaging` into a field that legitimately reaches a erpnext payload, and the leak
     * test asserting no internal status appears there failed on a fixture artefact.
     *
     * The fix was to derive the address from the person's name. This keeps it fixed,
     * because the failure it prevents is subtle in the wrong direction: it makes a
     * real leak test look broken, and the path of least resistance is to weaken the
     * leak test rather than to fix the fixture.
     */
    const internalOnly = ALL_INTERNAL_STATUSES.filter(
      (status) => !(ALL_CUSTOMER_STATUSES as readonly string[]).includes(status),
    );

    for (const enquiry of enquiryFixtures) {
      const customerFacing = [enquiry.email, enquiry.name, enquiry.reference].join(' ');

      for (const status of internalOnly) {
        expect(customerFacing).not.toContain(status);
        // Also in hyphenated form, which is how the fixture keys are spelled.
        expect(customerFacing).not.toContain(status.replace(/_/g, '-'));
      }
    }
  });

  it('prefixes every subject id, so production can be queried for leaks', () => {
    for (const identity of allIdentityFixtures) {
      expect(identity.subjectId.startsWith(FIXTURE_SUBJECT_PREFIX)).toBe(true);
    }
  });
});

describe('services', () => {
  it('has the six from the reference image, in order, plus the withdrawn one', () => {
    // Order matters: the homepage renders these in sequence and the design review compares
    // that sequence against the reference. The withdrawn service is last and is not one of
    // the six, so a homepage card can never link to a page that 404s.
    expect(serviceFixtures.map((service) => service.title)).toEqual([
      'General Health',
      'Cardiology',
      'Orthopaedics',
      "Women's Health",
      'Diagnostic Tests',
      'Wellness & Preventive Care',
      'Travel Vaccinations',
    ]);
  });

  it('round-trips through the schema', () => {
    for (const service of serviceFixtures) {
      expect(ServiceSchema.safeParse(unmarked(service)).success).toBe(true);
    }
  });

  it('includes one active service that does not accept enquiries', () => {
    // So "browsable but the enquiry form must not render" is a case with data behind
    // it rather than a branch nobody exercises.
    const disabled = serviceFixtures.filter(
      (service) => service.status === 'active' && !service.enquiryEnabled,
    );

    expect(disabled).toHaveLength(1);
    expect(disabled[0]!.slug).toBe('diagnostic-tests');
  });

  it('includes one inactive service', () => {
    const inactive = serviceFixtures.filter((service) => service.status === 'inactive');

    expect(inactive).toHaveLength(1);
    expect(inactive[0]!.slug).toBe('travel-vaccinations');
  });

  it('excludes the inactive service from listings, leaving the reference six', () => {
    expect(listableServiceFixtures).toHaveLength(6);
    expect(listableServiceFixtures.map((service) => service.slug)).not.toContain(
      'travel-vaccinations',
    );
  });

  it('excludes both from the enquirable set', () => {
    expect(enquirableServiceFixtures).toHaveLength(5);
    const slugs = enquirableServiceFixtures.map((service) => service.slug);

    expect(slugs).not.toContain('diagnostic-tests');
    expect(slugs).not.toContain('travel-vaccinations');
  });

  it('never exposes a parseable price', () => {
    // `displayPrice` is presentational text by design: an amount cannot be summed or
    // handed to a payment provider without someone first parsing a string, which is
    // a visible act. A fixture holding "250" would quietly undo that.
    for (const service of serviceFixtures) {
      if (service.displayPrice === null) continue;
      expect(Number.isNaN(Number(service.displayPrice))).toBe(true);
    }
  });

  it('throws for an unknown key rather than returning undefined', () => {
    expect(() => serviceByKey('no-such-service')).toThrow(/No service fixture/);
  });
});

describe('content', () => {
  it('round-trips through the schema', () => {
    for (const document of contentFixtures) {
      expect(ContentDocumentSchema.safeParse(unmarked(document)).success).toBe(true);
    }
  });

  it('has the three articles, one page, and two policies', () => {
    expect(articleFixtures).toHaveLength(3);
    expect(policyFixtures).toHaveLength(2);
    expect(contentFixtures.filter((document) => document.type === 'page')).toHaveLength(2); // one published, one draft
  });

  it('has a draft of every content type', () => {
    // An unauthenticated read must exclude drafts, and the rule is easy to miss in
    // exactly one query - a sitemap that forgets the status filter, a search index
    // that reads the latest version. A type with no draft cannot catch any of those.
    const draftTypes = new Set(draftFixtures.map((document) => document.type));

    for (const type of ALL_CONTENT_TYPES) {
      expect(draftTypes.has(type)).toBe(true);
    }
  });

  it('gives every draft a null publishedAt and approverId', () => {
    // A draft in substance, not only by its status column: a fixture with
    // `status: 'draft'` and a `publishedAt` would let a query filtering on the wrong
    // one of the two pass.
    for (const document of draftFixtures) {
      expect(document.status).toBe('draft');
      expect(document.publishedAt).toBeNull();
      expect(document.approverId).toBeNull();
    }
  });

  it('gives every published document an approver who is not the author', () => {
    for (const document of publishedContentFixtures) {
      expect(document.status).toBe('published');
      expect(document.publishedAt).not.toBeNull();
      expect(document.approverId).not.toBeNull();
      expect(document.approverId).not.toBe(document.authorId);
    }
  });

  it('keeps SEO titles inside the length the schema allows', () => {
    for (const document of contentFixtures) {
      expect(document.seo.title?.length ?? 0).toBeLessThanOrEqual(70);
    }
  });
});

describe('identities', () => {
  it('has exactly one identity per role', () => {
    // An access-control suite that checks "staff can, customer cannot" passes while
    // `auditor` is quietly able to write, because nobody wrote a case for it.
    expect(identityFixtures).toHaveLength(RoleSchema.options.length);

    for (const role of RoleSchema.options) {
      expect(identityFixtures.filter((identity) => identity.role === role)).toHaveLength(1);
      expect(identityForRole(role).role).toBe(role);
    }
  });

  it('requires MFA for every staff role and no customer', () => {
    for (const identity of allIdentityFixtures) {
      expect(identity.mfaRequired).toBe(identity.role !== 'customer');
    }
  });

  it('includes a customer whose address is not verified', () => {
    expect(unverifiedCustomerProfile.emailVerifiedAt).toBeNull();
    expect(verifiedCustomerProfile.emailVerifiedAt).not.toBeNull();
  });

  it('round-trips the customer profiles through the schema', () => {
    for (const profile of customerProfileFixtures) {
      expect(CustomerProfileSchema.safeParse(unmarked(profile)).success).toBe(true);
    }
  });

  it('verifies the address after the account was created, not at the same instant', () => {
    // Equal timestamps would let a test meaning "verified after signup" pass against
    // a `>=` comparison that should be `>`.
    expect(Date.parse(verifiedCustomerProfile.emailVerifiedAt!)).toBeGreaterThan(
      Date.parse(verifiedCustomerProfile.createdAt),
    );
  });
});

describe('enquiries', () => {
  it('has twelve, round-tripping through the schema', () => {
    expect(enquiryFixtures).toHaveLength(12);

    for (const enquiry of enquiryFixtures) {
      expect(EnquirySchema.safeParse(unmarked(enquiry)).success).toBe(true);
    }
  });

  it('covers every internal status', () => {
    // An unexercised status is one whose projection is never run, and
    // `internalStatus` is the field the customer projection must never expose.
    const present = new Set(enquiryFixtures.map((enquiry) => enquiry.internalStatus));

    for (const status of ALL_INTERNAL_STATUSES) {
      expect(present.has(status)).toBe(true);
    }
  });

  it('includes at least two terminal enquiries', () => {
    const terminal = enquiryFixtures.filter((enquiry) => isTerminalStatus(enquiry.internalStatus));

    expect(terminal.length).toBeGreaterThanOrEqual(2);
  });

  it('includes both a claimed and an unclaimed enquiry', () => {
    expect(enquiryFixtures.some((enquiry) => enquiry.customerSubjectId === null)).toBe(true);
    expect(enquiryFixtures.some((enquiry) => enquiry.customerSubjectId !== null)).toBe(true);
  });

  it("gives every claimed enquiry the claiming customer's address", () => {
    // Claim matching compares a hash of the normalised email. A claimed row with an
    // unrelated address is a state the claim flow could not produce, and a test
    // written against it would pass while the real comparison failed.
    for (const enquiry of enquiryFixtures) {
      if (enquiry.customerSubjectId === null) continue;
      expect(enquiry.customerSubjectId).toBe(verifiedCustomerProfile.subjectId);
      expect(enquiry.email).toBe(verifiedCustomerProfile.email);
    }
  });

  it('records consent no later than creation', () => {
    for (const enquiry of enquiryFixtures) {
      expect(Date.parse(enquiry.consentAt)).toBeLessThanOrEqual(Date.parse(enquiry.createdAt));
    }
  });

  it('points every enquiry at a service that accepts enquiries', () => {
    const enquirableIds = new Set(enquirableServiceFixtures.map((service) => service.id));

    for (const enquiry of enquiryFixtures) {
      expect(enquirableIds.has(enquiry.serviceId)).toBe(true);
    }
  });

  it('carries no prohibited field', () => {
    // PRD 3.2 puts clinical data out of scope. Stating that as data means a
    // well-meaning addition fails here instead of passing review.
    for (const enquiry of enquiryFixtures) {
      for (const field of PROHIBITED_ENQUIRY_FIELDS) {
        expect(enquiry).not.toHaveProperty(field);
      }
    }
  });

  it('contains no clinical text in any message', () => {
    // The fixtures are the first place someone looks for an example of what an
    // enquiry holds. Clinical text here would reasonably be read as permission.
    const clinicalTerms = /\b(diagnos|prescrib|medication|dosage|mg\b|symptom|nhs number)/i;

    for (const enquiry of enquiryFixtures) {
      expect(enquiry.message).not.toMatch(clinicalTerms);
    }
  });

  it('throws for an unknown key', () => {
    expect(() => enquiryByKey('no-such-enquiry')).toThrow(/No enquiry fixture/);
  });
});

describe('status histories', () => {
  it('round-trips through the schema', () => {
    for (const event of enquiryStatusEventFixtures) {
      expect(EnquiryStatusEventSchema.safeParse(unmarked(event)).success).toBe(true);
    }
  });

  it('is a legal path through the state machine for every enquiry', () => {
    // The fixture module already throws on an illegal hop at load time; this asserts
    // it from the outside, so removing that guard fails a test rather than silently
    // permitting impossible timelines.
    for (const enquiry of enquiryFixtures) {
      const events = enquiryStatusEventFixtures.filter((event) => event.enquiryId === enquiry.id);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]!.previousStatus).toBeNull();
      expect(events[0]!.newStatus).toBe('received');

      for (const [index, event] of events.entries()) {
        if (index === 0) continue;
        expect(event.previousStatus).toBe(events[index - 1]!.newStatus);
        expect(canTransition(event.previousStatus!, event.newStatus)).toBe(true);
      }

      expect(events.at(-1)!.newStatus).toBe(enquiry.internalStatus);
    }
  });

  it('stores the customer status rather than leaving it to be derived', () => {
    // Stored so that changing the mapping cannot retroactively rewrite what a
    // customer was previously told.
    for (const event of enquiryStatusEventFixtures) {
      expect(event.customerStatus).toBe(toCustomerStatus(event.newStatus));
    }
  });

  it('orders events within an enquiry', () => {
    for (const enquiry of enquiryFixtures) {
      const times = enquiryStatusEventFixtures
        .filter((event) => event.enquiryId === enquiry.id)
        .map((event) => Date.parse(event.createdAt));

      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  it('attributes the creation event to nobody', () => {
    // The submission is made by an unauthenticated visitor. Attributing it to a
    // staff member would make the audit trail claim someone acted when nobody did.
    for (const event of enquiryStatusEventFixtures) {
      if (event.previousStatus !== null) continue;
      expect(event.actorSubjectId).toBeNull();
    }
  });

  it('attributes every later event to someone', () => {
    for (const event of enquiryStatusEventFixtures) {
      if (event.previousStatus === null) continue;
      expect(event.actorSubjectId).not.toBeNull();
    }
  });

  it('resolves a history by key, oldest first', () => {
    const events = statusEventsForEnquiry('completed');

    expect(events.map((event) => event.newStatus)).toEqual([
      'received',
      'triaging',
      'in_progress',
      'completed',
    ]);
  });

  it('gives every non-creation event a staff-only reason', () => {
    for (const event of enquiryStatusEventFixtures) {
      if (event.previousStatus === null) {
        expect(event.reason).toBeNull();
        continue;
      }
      expect(event.reason).toContain('STAFF-ONLY');
    }
  });
});

describe('internal notes', () => {
  it('round-trips through the schema', () => {
    for (const note of internalNoteFixtures) {
      expect(InternalNoteSchema.safeParse(unmarked(note)).success).toBe(true);
    }
  });

  it('puts three notes on one enquiry', () => {
    // Three rather than one because ordering is what breaks: a list sorted by the
    // wrong column looks correct with a single note.
    const notes = notesForEnquiry('in-progress-annotated');

    expect(notes).toHaveLength(3);
    const times = notes.map((note) => Date.parse(note.createdAt));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('includes one edited note, edited after it was created', () => {
    const edited = internalNoteFixtures.filter((note) => note.editedAt !== null);

    expect(edited).toHaveLength(1);
    expect(Date.parse(edited[0]!.editedAt!)).toBeGreaterThan(Date.parse(edited[0]!.createdAt));
  });

  it('creates every note after its enquiry', () => {
    for (const note of internalNoteFixtures) {
      const enquiry = enquiryFixtures.find((candidate) => candidate.id === note.enquiryId)!;

      expect(Date.parse(note.createdAt)).toBeGreaterThanOrEqual(Date.parse(enquiry.createdAt));
    }
  });

  it('marks every body staff-only', () => {
    for (const note of internalNoteFixtures) {
      expect(note.body).toContain('STAFF-ONLY');
    }
  });
});

describe('integration deliveries', () => {
  it('round-trips through the schema', () => {
    for (const delivery of integrationDeliveryFixtures) {
      expect(IntegrationDeliverySchema.safeParse(unmarked(delivery)).success).toBe(true);
    }
  });

  it('gives every succeeded delivery an external id', () => {
    // There is a check constraint for it: without the provider's id the record
    // cannot be reconciled and the next full sync duplicates it.
    for (const delivery of integrationDeliveryFixtures) {
      if (delivery.status !== 'succeeded') continue;
      expect(delivery.externalId).not.toBeNull();
    }
  });

  it('keeps idempotency keys unique and derived from the event', () => {
    // Derived rather than random, because that is what makes a replayed job compute
    // the same key and conflict. A random key satisfies the index while proving
    // nothing about idempotency.
    const keys = integrationDeliveryFixtures.map((delivery) => delivery.idempotencyKey);

    expect(new Set(keys).size).toBe(keys.length);
    for (const delivery of integrationDeliveryFixtures) {
      expect(delivery.idempotencyKey).toBe(
        `${delivery.provider}:${delivery.eventType}:${delivery.enquiryId}`,
      );
    }
  });

  it('includes a dead letter for the ops view to surface', () => {
    expect(deadLetterDeliveryFixture.status).toBe('dead_letter');
    expect(deadLetterDeliveryFixture.provider).toBe('erpnext');
    expect(deadLetterDeliveryFixture.enquiryId).toBe(enquiryByKey('in-progress-dead-letter').id);
  });

  it('covers every delivery status', () => {
    const present = new Set(integrationDeliveryFixtures.map((delivery) => delivery.status));

    // Each is treated differently by the worker, and conflating `failed` with
    // `dead_letter` either abandons recoverable work or retries forever.
    for (const status of ['pending', 'in_flight', 'succeeded', 'failed', 'dead_letter'] as const) {
      expect(present.has(status)).toBe(true);
    }
  });

  it('records a classification, never a provider body', () => {
    // Provider errors routinely echo the request, and the request contains the
    // enquiry message.
    for (const delivery of integrationDeliveryFixtures) {
      if (delivery.errorClass === null) continue;
      expect(delivery.errorClass).toMatch(/^[a-z_]+$/);
    }
  });
});

describe('outbox', () => {
  it('round-trips through the schema', () => {
    for (const record of outboxFixtures) {
      expect(OutboxRecordSchema.safeParse(unmarked(record)).success).toBe(true);
    }
  });

  it('holds a lock as both columns or neither', () => {
    // Half a lock is a row that looks claimed and cannot be attributed, so the
    // reaper cannot decide whether the holder is alive.
    for (const record of outboxFixtures) {
      expect(record.lockedAt === null).toBe(record.lockedBy === null);
    }
  });

  it('includes one stale lock for the reaper', () => {
    expect(staleLockOutboxFixture.status).toBe('in_flight');
    expect(staleLockOutboxFixture.lockedBy).not.toBeNull();
  });

  it('includes a pending row backed off into the future', () => {
    // So a sweep that ignores `available_at` picks it up and the test fails.
    const backedOff = outboxFixtures.filter(
      (record) => record.status === 'pending' && record.attempts > 0,
    );

    expect(backedOff).toHaveLength(1);
    expect(Date.parse(backedOff[0]!.availableAt)).toBeGreaterThan(
      Date.parse(backedOff[0]!.createdAt),
    );
  });

  it('carries identifiers in the payload, never a record snapshot', () => {
    // A snapshot would send a status the enquiry has since moved past after a retry,
    // and would duplicate personal data into a second table.
    for (const record of outboxFixtures) {
      const payload = record.payload as Record<string, unknown>;

      expect(Object.keys(payload).sort()).toEqual(['enquiryId', 'reference', 'requestId']);
      expect(JSON.stringify(payload)).not.toContain('@');
    }
  });
});

describe('claim tokens', () => {
  it('round-trips through the schema', () => {
    for (const token of claimTokenFixtures) {
      expect(EnquiryClaimTokenSchema.safeParse(unmarked(token)).success).toBe(true);
    }
  });

  it('stores the hash of the exported plaintext', () => {
    // A claim test presents the plaintext and the lookup has to find this row, which
    // it only does if this is genuinely `hashToken` of that string.
    for (const state of ['valid', 'expired', 'consumed'] as const) {
      expect(claimTokenByState(state).tokenHash).toBe(hashToken(CLAIM_TOKEN_PLAINTEXT[state]));
    }
  });

  it('has one token that is live whenever the tests run', () => {
    // Not a 30-minute TTL: every fixture is anchored to a fixed past date, so a
    // realistic TTL would already have lapsed and "valid" and "expired" would behave
    // identically.
    expect(claimTokenByState('valid').expiresAt).toBe(FIXTURE_HORIZON);
    expect(Date.parse(claimTokenByState('valid').expiresAt)).toBeGreaterThan(Date.now());
    expect(claimTokenByState('valid').consumedAt).toBeNull();
  });

  it('has one lapsed, unconsumed token', () => {
    expect(Date.parse(claimTokenByState('expired').expiresAt)).toBeLessThan(Date.now());
    expect(claimTokenByState('expired').consumedAt).toBeNull();
  });

  it('issues the lapsed token to the unverified customer', () => {
    // One row covering both rejections a claim can hit, so a test that fixes only
    // one of them still fails.
    expect(claimTokenByState('expired').emailHash).not.toBe(claimTokenByState('valid').emailHash);
  });

  it('has one consumed token, consumed inside its window', () => {
    const consumed = claimTokenByState('consumed');

    expect(consumed.consumedAt).not.toBeNull();
    expect(consumed.consumedBySubjectId).not.toBeNull();
    expect(Date.parse(consumed.consumedAt!)).toBeLessThan(Date.parse(consumed.expiresAt));
  });

  it('records consumption as both columns or neither', () => {
    // The pair is the evidence that a specific account claimed a specific enquiry,
    // and it is the one join that decides whether a customer may read one.
    for (const token of claimTokenFixtures) {
      expect(token.consumedAt === null).toBe(token.consumedBySubjectId === null);
    }
  });

  it('expires every token after it was issued', () => {
    for (const token of claimTokenFixtures) {
      expect(Date.parse(token.expiresAt)).toBeGreaterThan(Date.parse(token.createdAt));
    }
  });

  it('never stores the address or the token in the clear', () => {
    for (const token of claimTokenFixtures) {
      const serialised = JSON.stringify(unmarked(token));

      expect(serialised).not.toContain('@');
      for (const plaintext of Object.values(CLAIM_TOKEN_PLAINTEXT)) {
        expect(serialised).not.toContain(plaintext);
      }
    }
  });
});

describe('audit events', () => {
  it('round-trips through the schema', () => {
    for (const event of auditEventFixtures) {
      expect(AuditEventSchema.safeParse(unmarked(event)).success).toBe(true);
    }
  });

  it('covers every audit target type', () => {
    const present = new Set(auditEventFixtures.map((event) => event.targetType));

    for (const type of AuditTargetTypeSchema.options) {
      expect(present.has(type)).toBe(true);
    }
  });

  it('records free text as changed rather than by value', () => {
    // The single most load-bearing property in the audit fixtures: the alternative
    // puts a staff judgement about a customer into a table that outlives the
    // enquiry it was about.
    const serialised = JSON.stringify(auditEventFixtures.map(unmarked));

    expect(serialised).not.toContain('STAFF-ONLY');
    for (const enquiry of enquiryFixtures) {
      expect(serialised).not.toContain(enquiry.message);
      expect(serialised).not.toContain(enquiry.email);
    }
  });

  it('ties every event to a request id', () => {
    for (const event of auditEventFixtures) {
      expect(event.requestId.length).toBeGreaterThan(0);
    }
  });

  it('leaves the actor null for unauthenticated and system actions', () => {
    const systemActions = auditEventFixtures.filter((event) => event.actorSubjectId === null);

    expect(systemActions.map((event) => event.action).sort()).toEqual([
      'enquiry.created',
      'release.deployed',
    ]);
  });

  it('holds a non-UUID target id somewhere', () => {
    // `targetId` is a string so it can hold a Payload or Vendure identifier. If
    // every fixture happened to be a UUID the width would go unnoticed until a real
    // one did not fit.
    expect(
      auditEventFixtures.some((event) => !Uuidv7Schema.safeParse(event.targetId).success),
    ).toBe(true);
  });
});
