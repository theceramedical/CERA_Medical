import { describe, expect, it } from 'vitest';

import { ApiError, buildErrorEnvelope } from './errors.ts';
import {
  CLAIM_TOKEN_PLAINTEXT,
  customerProfileFixtures,
  ENQUIRY_FIXTURE_KEYS,
  enquiryByKey,
  identityFixtures,
  internalNoteFixtures,
  notesForEnquiry,
  serviceByKey,
  STAFF_ONLY_STRINGS,
  statusEventsForEnquiry,
} from './fixtures/index.ts';
import {
  toCustomerEnquiry,
  toPublicService,
  toStaffEnquiry,
  toZohoLeadPayload,
} from './projections.ts';
import { ALL_CUSTOMER_STATUSES, ALL_INTERNAL_STATUSES, toCustomerStatus } from './status.ts';

/**
 * The internal statuses whose *name* is not also a customer status.
 *
 * This distinction is the whole reason this constant exists rather than searching for
 * `enquiry.internalStatus` directly. `received`, `in_progress`, and `completed` map to
 * customer statuses spelled identically, so finding those strings in a customer
 * response proves nothing - they are supposed to be there. The six below have no
 * customer equivalent, so any of them appearing in customer-facing output or in a CRM
 * payload is unambiguously a leak.
 *
 * Derived rather than listed, so adding an internal status puts it under this test
 * automatically - which is the case that matters, because a status added later is
 * exactly the one nobody writes a leak test for.
 */
const INTERNAL_ONLY_STATUSES = ALL_INTERNAL_STATUSES.filter(
  (status) => !(ALL_CUSTOMER_STATUSES as readonly string[]).includes(status),
);

/**
 * The automated form of PRD 8's exposure rules.
 *
 * Every other test in this package checks that a projection contains what it should.
 * This one checks that it contains nothing else, which is a different and harder
 * property: a projection can be entirely correct about the fields it names and still
 * leak, because the leak is in what someone added to the entity afterwards.
 *
 * The technique throughout is to serialise the output and search the whole string
 * rather than to assert on named fields. Asserting `result.message === undefined`
 * only catches a field called `message`; searching the serialised form catches the
 * same text arriving as `body`, nested inside `timeline`, or spread into an object a
 * later refactor introduced. The difference matters because the field that leaks is
 * never the one anybody thought to write an assertion for.
 *
 * The enquiry used is deliberately the most dangerous one available: claimed, owned,
 * mid-workflow, carrying three internal notes and a full status history with a
 * staff-only reason on every transition.
 */

const ANNOTATED = 'in-progress-annotated';

const annotatedEnquiry = enquiryByKey(ANNOTATED);
const annotatedNotes = notesForEnquiry(ANNOTATED);
const annotatedEvents = statusEventsForEnquiry(ANNOTATED);
const annotatedService = serviceByKey('cardiology');

/** Sanity check on the fixture itself, so the tests below cannot be vacuous. */
describe('the enquiry under test', () => {
  it('carries everything that could leak', () => {
    // If any of these were absent the assertions below would pass by having nothing
    // to find, which is the failure mode of every test of this kind.
    expect(annotatedEnquiry.customerSubjectId).not.toBeNull();
    expect(annotatedEnquiry.ownerId).not.toBeNull();
    expect(annotatedEnquiry.phone).not.toBeNull();
    expect(annotatedEnquiry.internalStatus).toBe('in_progress');
    expect(annotatedNotes).toHaveLength(3);
    expect(annotatedEvents.length).toBeGreaterThan(1);
    expect(annotatedEvents.filter((event) => event.reason !== null).length).toBeGreaterThan(0);
  });
});

describe('customer projection', () => {
  const projection = toCustomerEnquiry(annotatedEnquiry, annotatedService.title, annotatedEvents);
  const serialised = JSON.stringify(projection);

  it('never contains the enquiry message', () => {
    expect(serialised).not.toContain(annotatedEnquiry.message);
  });

  it('never contains a note body', () => {
    for (const note of annotatedNotes) {
      expect(serialised).not.toContain(note.body);
    }
  });

  it('never contains a transition reason', () => {
    // Staff-only free text. Every fixture reason carries the token `STAFF-ONLY`, so
    // this covers reasons added later without this test needing to know about them.
    expect(serialised).not.toContain('STAFF-ONLY');
    for (const reason of STAFF_ONLY_STRINGS) {
      expect(serialised).not.toContain(reason);
    }
  });

  it('never contains an internal-only status or the owner', () => {
    // The privacy boundary. `referred` collapses to `in_progress` and all three
    // closure reasons collapse to `closed`, because each carries an internal
    // judgement the customer is not party to - including, most importantly, spam.
    for (const status of INTERNAL_ONLY_STATUSES) {
      expect(serialised).not.toContain(status);
    }
    expect(serialised).not.toContain(annotatedEnquiry.ownerId!);
  });

  it('never contains contact details or the row id', () => {
    // The customer already knows what they wrote. Echoing it back adds nothing and
    // widens the surface it can leak from.
    expect(serialised).not.toContain(annotatedEnquiry.email);
    expect(serialised).not.toContain(annotatedEnquiry.phone!);
    expect(serialised).not.toContain(annotatedEnquiry.name);
    expect(serialised).not.toContain(annotatedEnquiry.id);
    expect(serialised).not.toContain(annotatedEnquiry.serviceId);
    expect(serialised).not.toContain(annotatedEnquiry.customerSubjectId!);
  });

  it('identifies the enquiry by its reference', () => {
    expect(projection.reference).toBe(annotatedEnquiry.reference);
  });

  it('exposes exactly seven fields', () => {
    // Pinned deliberately. A field added to the customer projection should require
    // changing this number, which is the review moment the test exists to create.
    expect(Object.keys(projection).sort()).toEqual([
      'reference',
      'serviceTitle',
      'status',
      'statusLabel',
      'submittedAt',
      'timeline',
      'updatedAt',
    ]);
  });

  it('collapses the timeline to customer vocabulary only', () => {
    for (const entry of projection.timeline) {
      expect(ALL_CUSTOMER_STATUSES).toContain(entry.status);
      expect(INTERNAL_ONLY_STATUSES).not.toContain(entry.status);
    }
  });

  it('leaks nothing for an enquiry in any internal status', () => {
    // Run over every status rather than one, because the collapse is where a leak
    // would hide: `rejected_spam` becoming `closed` is the case that matters most,
    // and it only appears if every status is exercised.
    for (const key of ENQUIRY_FIXTURE_KEYS) {
      const enquiry = enquiryByKey(key);
      const output = JSON.stringify(
        toCustomerEnquiry(enquiry, 'Cardiology', statusEventsForEnquiry(key)),
      );

      for (const status of INTERNAL_ONLY_STATUSES) {
        expect(output).not.toContain(status);
      }
      expect(output).not.toContain(enquiry.message);
      expect(output).not.toContain('STAFF-ONLY');
      if (enquiry.ownerId !== null) expect(output).not.toContain(enquiry.ownerId);
    }
  });
});

describe('Zoho lead payload', () => {
  const payload = toZohoLeadPayload(annotatedEnquiry, annotatedService);
  const serialised = JSON.stringify(payload);

  it('never contains an internal-only status', () => {
    // Zoho is a sales tool used by people who are not necessarily CERA staff. It
    // receives the customer's own data and the customer-facing status, and nothing
    // about how CERA is handling the enquiry internally.
    for (const status of INTERNAL_ONLY_STATUSES) {
      expect(serialised).not.toContain(status);
    }
    expect(payload.CERA_Status).toBe(toCustomerStatus(annotatedEnquiry.internalStatus));
  });

  it('never contains the owner, a note, or a transition reason', () => {
    expect(serialised).not.toContain(annotatedEnquiry.ownerId!);
    expect(serialised).not.toContain('STAFF-ONLY');
    for (const note of annotatedNotes) {
      expect(serialised).not.toContain(note.body);
    }
  });

  it('never contains the enquiry UUID or the customer subject', () => {
    // Deduplication is by reference, not by row id: ADR-006. A UUID in the CRM would
    // also be a stable internal identifier sitting in a third-party system.
    expect(serialised).not.toContain(annotatedEnquiry.id);
    expect(serialised).not.toContain(annotatedEnquiry.customerSubjectId!);
    expect(payload.External_Lead_ID).toBe(annotatedEnquiry.reference);
  });

  it('sends the message, because that is the point of the integration', () => {
    // The one piece of free text that leaves the platform, and it is the customer's
    // own words going to the team who will answer them. Asserted positively so the
    // boundary is stated in both directions rather than only as a prohibition.
    expect(payload.Description).toBe(annotatedEnquiry.message);
  });

  it('exposes no field outside the agreed set', () => {
    expect(Object.keys(payload).sort()).toEqual([
      'CERA_Service',
      'CERA_Status',
      'Company',
      'Description',
      'Email',
      'External_Lead_ID',
      'First_Name',
      'Last_Name',
      'Lead_Source',
      'Phone',
    ]);
  });

  it('leaks no internal vocabulary for any enquiry', () => {
    for (const key of ENQUIRY_FIXTURE_KEYS) {
      const enquiry = enquiryByKey(key);
      const output = JSON.stringify(toZohoLeadPayload(enquiry, annotatedService));

      for (const status of INTERNAL_ONLY_STATUSES) {
        expect(output).not.toContain(status);
      }
      expect(output).not.toContain('STAFF-ONLY');
      if (enquiry.ownerId !== null) expect(output).not.toContain(enquiry.ownerId);
    }
  });

  it('never tells Zoho an enquiry was marked spam', () => {
    // The single most consequential collapse in the mapping. A CRM record saying
    // `rejected_spam` about a real person is both a judgement they never saw and one
    // that outlives the enquiry it was about.
    const spam = enquiryByKey('rejected-spam');
    const payloadForSpam = toZohoLeadPayload(spam, annotatedService);

    // The full enum token, not the bare word `spam`. The customer's own address is
    // legitimately in this payload and that fixture's address happens to contain the
    // word, so a substring search here reports a leak that is not one - and a test
    // that cries wolf is a test that gets deleted.
    expect(JSON.stringify(payloadForSpam)).not.toContain('rejected_spam');
    expect(payloadForSpam.CERA_Status).toBe('closed');
  });
});

describe('staff projection', () => {
  const projection = toStaffEnquiry(annotatedEnquiry, {
    serviceTitle: annotatedService.title,
    ownerDisplayName: 'Operations Fixture',
    noteCount: annotatedNotes.length,
    lastIntegrationStatus: 'succeeded',
  });

  it('does carry the message and internal status', () => {
    // Staff are the intended audience. Asserted so that "the staff view shows too
    // little" fails as loudly as "the customer view shows too much" - a projection
    // trimmed out of caution is a support problem, not a safety improvement.
    expect(projection.message).toBe(annotatedEnquiry.message);
    expect(projection.internalStatus).toBe(annotatedEnquiry.internalStatus);
    expect(projection.ownerId).toBe(annotatedEnquiry.ownerId);
    expect(projection.email).toBe(annotatedEnquiry.email);
  });

  it('carries a note count rather than the note bodies', () => {
    // The queue lists hundreds of enquiries. Including bodies would put every staff
    // note into a list response, and the detail view fetches them separately.
    const serialised = JSON.stringify(projection);

    expect(projection.noteCount).toBe(3);
    for (const note of annotatedNotes) {
      expect(serialised).not.toContain(note.body);
    }
  });
});

describe('public service projection', () => {
  it('drops the fields that reveal editing activity', () => {
    const service = serviceByKey('cardiology');
    const projection = toPublicService(service);
    const serialised = JSON.stringify(projection);

    expect(serialised).not.toContain(service.createdAt);
    expect(serialised).not.toContain(service.updatedAt);
    expect(serialised).not.toContain(service.id);
    expect(projection).not.toHaveProperty('status');
  });

  it('never exposes a Vendure id', () => {
    // The slug is the public identifier. A Vendure id in a URL couples the public
    // site to the catalogue's internal keys and makes them enumerable.
    for (const slug of ['general-health', 'cardiology', 'diagnostic-tests']) {
      const service = serviceByKey(slug);

      expect(JSON.stringify(toPublicService(service))).not.toContain(service.id);
    }
  });
});

describe('error envelopes', () => {
  it('never contains a stack trace', () => {
    // An envelope with a stack in it hands an attacker the file layout and the
    // dependency versions, and it is the easiest thing in the world to add by
    // accident while debugging.
    // Via the thrown error's own `toEnvelope`, which is the path a request handler
    // takes. An `ApiError` extends `Error` so it *has* a stack; the assertion is that
    // the conversion drops it.
    const envelope = new ApiError('internal_error').toEnvelope('req-1');
    const serialised = JSON.stringify(envelope);

    expect(serialised).not.toContain('at ');
    expect(serialised).not.toContain('.ts:');
    expect(envelope).not.toHaveProperty('stack');
    expect(envelope.error).not.toHaveProperty('stack');
  });

  it('never leaks internalDetail, which is for logs only', () => {
    // The field exists so a handler can record why something failed without telling
    // the caller. If it reached the envelope it would be worse than no field at all,
    // because its whole purpose invites putting sensitive specifics in it.
    const envelope = new ApiError('internal_error', {
      internalDetail: `zoho rejected lead for ${annotatedEnquiry.email}`,
    }).toEnvelope('req-3');

    expect(JSON.stringify(envelope)).not.toContain(annotatedEnquiry.email);
    expect(JSON.stringify(envelope)).not.toContain('zoho rejected');
  });

  it('never carries an enquiry message through a validation error', () => {
    // Validation errors are the realistic vector: the natural way to write "this
    // message is too long" is to include the value.
    const envelope = buildErrorEnvelope({
      code: 'validation_failed',
      requestId: 'req-2',
      fieldErrors: [
        { path: 'message', code: 'too_big', message: 'Message must be 2000 characters or fewer' },
      ],
    });

    expect(JSON.stringify(envelope)).not.toContain(annotatedEnquiry.message);
  });
});

describe('identity and credential material', () => {
  it('keeps claim token plaintext out of every projection', () => {
    // The plaintext exists only in the email that was sent. If one of these strings
    // appeared in any response, the token could be replayed from a log.
    const outputs = [
      JSON.stringify(toCustomerEnquiry(annotatedEnquiry, 'Cardiology', annotatedEvents)),
      JSON.stringify(toZohoLeadPayload(annotatedEnquiry, annotatedService)),
      JSON.stringify(toPublicService(annotatedService)),
    ].join('\n');

    for (const plaintext of Object.values(CLAIM_TOKEN_PLAINTEXT)) {
      expect(outputs).not.toContain(plaintext);
    }
  });

  it('keeps staff subject ids out of customer-facing output', () => {
    // A subject id is an Authentik identifier. Exposing one tells a customer which
    // account is handling their enquiry and gives an enumerable handle on staff.
    const output = JSON.stringify(
      toCustomerEnquiry(annotatedEnquiry, 'Cardiology', annotatedEvents),
    );

    for (const identity of identityFixtures) {
      if (identity.role === 'customer') continue;
      expect(output).not.toContain(identity.subjectId);
    }
  });

  it('keeps every fixture note body out of every customer projection', () => {
    // Across all enquiries and all notes, not just the pairing that belongs
    // together - a projection that fetched notes by the wrong enquiry id would pass a
    // test scoped to one enquiry.
    const outputs = ENQUIRY_FIXTURE_KEYS.map((key) =>
      JSON.stringify(
        toCustomerEnquiry(enquiryByKey(key), 'Cardiology', statusEventsForEnquiry(key)),
      ),
    ).join('\n');

    for (const note of internalNoteFixtures) {
      expect(outputs).not.toContain(note.body);
    }
  });

  it('keeps customer email addresses out of the public service projection', () => {
    const output = JSON.stringify(toPublicService(annotatedService));

    for (const profile of customerProfileFixtures) {
      expect(output).not.toContain(profile.email);
    }
  });
});
