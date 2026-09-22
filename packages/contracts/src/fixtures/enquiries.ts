import {
  type Enquiry,
  EnquirySchema,
  type EnquiryStatusEvent,
  EnquiryStatusEventSchema,
  type InternalNote,
  InternalNoteSchema,
} from '../entities.ts';
import { type EnquirySource, type InternalStatus } from '../enums.ts';
import { canTransition, INITIAL_INTERNAL_STATUS, toCustomerStatus } from '../status.ts';

import { after, at, days, email, hours, phone, reference, uuid } from './deterministic.ts';
import { identityByKey, verifiedCustomerProfile } from './identities.ts';
import { fixture, type Fixture } from './marker.ts';
import { enquirableServiceFixtures, serviceByKey } from './services.ts';

/**
 * Twelve enquiries, their status histories, and their internal notes.
 *
 * Twelve is not an arbitrary number. Every internal status appears at least once,
 * because a status with no fixture is a status whose projection, label, and
 * transition rules are never exercised - and `internalStatus` is the field the
 * customer projection must never expose, so an unexercised value is exactly where
 * a leak survives. Three further enquiries cover the cases that are about shape
 * rather than status: one carrying three notes, one with a dead-lettered Zoho
 * delivery, and one that no account has claimed.
 *
 * Histories are not hand-written as free text. Each path is declared as a list of
 * statuses and then walked through `canTransition`, so a path the state machine
 * forbids throws when this module loads rather than seeding an enquiry whose
 * timeline could not have happened. A fixture that encodes an impossible history
 * is worse than no fixture: it makes a timeline test pass while the real machine
 * would have rejected the sequence.
 */

const HANDLER = identityByKey('enquiry-handler').subjectId;
const OPERATIONS = identityByKey('operations-manager').subjectId;

interface EnquirySeed {
  key: string;
  /** Display name. Obviously synthetic, and readable in a staff queue screenshot. */
  name: string;
  serviceKey: string;
  message: string;
  source: EnquirySource;
  /** Full status history, starting at `received`. The last entry is current. */
  path: readonly InternalStatus[];
  /** Null for an unclaimed enquiry. */
  claimed: boolean;
  /** Null for an unassigned enquiry. */
  owner: string | null;
  /** Days before the fixture epoch the enquiry arrived. */
  receivedDaysAgo: number;
  /** Hours between consecutive status changes. */
  stepHours?: number;
  withPhone?: boolean;
}

/**
 * Messages a real person might send, and deliberately nothing more.
 *
 * No symptoms, no medication, no dates of birth. PRD 3.2 puts clinical data out of
 * scope, and a fixture set that quietly contains it undermines the argument: the
 * first person to look for an example of what an enquiry holds would find clinical
 * text and reasonably conclude it belongs there.
 */
const ENQUIRY_SEEDS: readonly EnquirySeed[] = [
  {
    key: 'received-unclaimed',
    name: 'Alex Fixture',
    serviceKey: 'general-health',
    message:
      'I would like to book a general health check and I am not sure which appointment to choose. Could someone talk me through the options?',
    source: 'web_service_page',
    path: ['received'],
    claimed: false,
    owner: null,
    receivedDaysAgo: 1,
  },
  {
    key: 'received-claimed',
    name: 'Bea Fixture',
    serviceKey: 'cardiology',
    message:
      'My GP suggested I speak to a cardiologist. What information do you need from me before a first appointment?',
    source: 'web_service_page',
    path: ['received'],
    claimed: true,
    owner: null,
    receivedDaysAgo: 2,
    withPhone: true,
  },
  {
    key: 'triaging',
    name: 'Cal Fixture',
    serviceKey: 'orthopaedics',
    message:
      'I am trying to find out whether you offer follow-up appointments after surgery elsewhere, or only new consultations.',
    source: 'web_contact_page',
    path: ['received', 'triaging'],
    claimed: false,
    owner: HANDLER,
    receivedDaysAgo: 4,
  },
  {
    key: 'awaiting-customer',
    name: 'Dee Fixture',
    serviceKey: 'womens-health',
    message:
      'Please could you send me the details of what a first appointment involves and how long it usually takes?',
    source: 'web_service_page',
    path: ['received', 'triaging', 'awaiting_customer'],
    claimed: true,
    owner: HANDLER,
    receivedDaysAgo: 9,
    withPhone: true,
  },
  {
    key: 'in-progress',
    name: 'Eli Fixture',
    serviceKey: 'general-health',
    message:
      'I would like to arrange an appointment in the next fortnight if possible. Weekday mornings work best for me.',
    source: 'web_general',
    path: ['received', 'triaging', 'in_progress'],
    claimed: true,
    owner: HANDLER,
    receivedDaysAgo: 6,
  },
  {
    key: 'referred',
    name: 'Fay Fixture',
    serviceKey: 'cardiology',
    message:
      'I was told my question is better answered by a specialist team. Could you point me to the right department?',
    source: 'web_service_page',
    path: ['received', 'triaging', 'in_progress', 'referred'],
    claimed: false,
    owner: OPERATIONS,
    receivedDaysAgo: 12,
  },
  {
    key: 'completed',
    name: 'Gus Fixture',
    serviceKey: 'orthopaedics',
    message:
      'Thank you for the information about consultation times. I have everything I need to decide how to proceed.',
    source: 'web_service_page',
    path: ['received', 'triaging', 'in_progress', 'completed'],
    claimed: true,
    owner: HANDLER,
    receivedDaysAgo: 20,
  },
  {
    key: 'closed-no-response',
    name: 'Hal Fixture',
    serviceKey: 'womens-health',
    message:
      'I have a question about appointment availability later in the year. Is there a waiting list I can join?',
    source: 'web_contact_page',
    path: ['received', 'triaging', 'awaiting_customer', 'closed_no_response'],
    claimed: false,
    owner: HANDLER,
    receivedDaysAgo: 45,
  },
  {
    key: 'closed-withdrawn',
    name: 'Ivy Fixture',
    serviceKey: 'general-health',
    message:
      'I no longer need an appointment as my situation has changed. Please close my enquiry, and thank you for your help.',
    source: 'web_general',
    path: ['received', 'triaging', 'in_progress', 'closed_withdrawn'],
    claimed: true,
    owner: HANDLER,
    receivedDaysAgo: 30,
  },
  {
    key: 'rejected-spam',
    name: 'Jay Fixture',
    serviceKey: 'general-health',
    // Recognisably junk without reproducing anything abusive, so a staff-side
    // screenshot of the spam queue is publishable.
    message:
      'BEST SEO SERVICES GUARANTEED FIRST PAGE RANKING CONTACT US NOW FOR A FREE QUOTE AND UNLIMITED BACKLINKS',
    source: 'web_contact_page',
    path: ['received', 'rejected_spam'],
    claimed: false,
    owner: null,
    receivedDaysAgo: 3,
  },
  {
    key: 'in-progress-annotated',
    name: 'Kit Fixture',
    serviceKey: 'cardiology',
    message:
      'I have been passed between two departments and would like one person to confirm what happens next.',
    source: 'web_contact_page',
    path: ['received', 'triaging', 'in_progress'],
    claimed: true,
    owner: OPERATIONS,
    receivedDaysAgo: 8,
    withPhone: true,
  },
  {
    key: 'in-progress-dead-letter',
    name: 'Lou Fixture',
    serviceKey: 'orthopaedics',
    message:
      'Could you confirm you received my earlier enquiry? I have not had an acknowledgement email yet.',
    source: 'web_service_page',
    path: ['received', 'triaging', 'in_progress'],
    claimed: false,
    owner: HANDLER,
    receivedDaysAgo: 5,
  },
];

const HOURS_PER_STEP_DEFAULT = 6;

function serviceIdFor(seed: EnquirySeed): string {
  const service = serviceByKey(seed.serviceKey);

  // Every enquiry must point at a service that accepts enquiries. An enquiry
  // against a disabled or inactive service is not a case worth fixture data: it is
  // a state the API refuses to create, so seeding one would make an invalid row the
  // baseline that later tests are written against.
  if (!enquirableServiceFixtures.includes(service)) {
    throw new Error(
      `Enquiry fixture "${seed.key}" targets "${seed.serviceKey}", which does not accept enquiries`,
    );
  }

  return service.id;
}

function buildEnquiry(seed: EnquirySeed): Fixture<Enquiry> {
  if (seed.path[0] !== INITIAL_INTERNAL_STATUS) {
    throw new Error(`Enquiry fixture "${seed.key}" must start at "${INITIAL_INTERNAL_STATUS}"`);
  }

  const createdAt = at(-days(seed.receivedDaysAgo));
  const stepMinutes = (seed.stepHours ?? HOURS_PER_STEP_DEFAULT) * 60;
  const updatedAt = at(-days(seed.receivedDaysAgo) + (seed.path.length - 1) * stepMinutes);

  return fixture(
    EnquirySchema.parse({
      id: uuid(`enquiry-${seed.key}`, createdAt),
      reference: reference(`enquiry-${seed.key}`, createdAt),
      // A claimed enquiry uses the claiming customer's address, not a fresh one.
      // Claim matching compares a hash of the normalised email, so a claimed row
      // with an unrelated address is a state the claim flow could not produce - and
      // a test written against it would pass while the real comparison failed.
      customerSubjectId: seed.claimed ? verifiedCustomerProfile.subjectId : null,
      name: seed.name,
      email: seed.claimed ? verifiedCustomerProfile.email : email(`enquiry-${seed.key}`),
      phone: seed.withPhone === true ? phone(`enquiry-${seed.key}`) : null,
      serviceId: serviceIdFor(seed),
      message: seed.message,
      // Equal to `createdAt`, not a moment before it. Both are set from one `Date`
      // in the same transaction in production, and the consent check constraint
      // allows a second of tolerance for clock adjustment - not a fixture that
      // backdates consent.
      consentAt: createdAt,
      source: seed.source,
      internalStatus: seed.path.at(-1)!,
      ownerId: seed.owner,
      createdAt,
      updatedAt,
    }),
  );
}

/**
 * Walks a declared path into status events, checking each hop.
 *
 * The creation event has `previousStatus: null`; every later event carries both
 * sides of the move. `customerStatus` is stored rather than derived at read time,
 * exactly as production does, so a change to the mapping cannot retroactively
 * rewrite what a customer was told.
 */
function buildStatusEvents(seed: EnquirySeed, enquiryId: string): Fixture<EnquiryStatusEvent>[] {
  const baseMinutes = -days(seed.receivedDaysAgo);
  const stepMinutes = (seed.stepHours ?? HOURS_PER_STEP_DEFAULT) * 60;

  return seed.path.map((status, index) => {
    const previousStatus = index === 0 ? null : seed.path[index - 1]!;

    if (previousStatus !== null && !canTransition(previousStatus, status)) {
      throw new Error(
        `Enquiry fixture "${seed.key}" declares the forbidden transition ${previousStatus} -> ${status}`,
      );
    }

    const createdAt = at(baseMinutes + index * stepMinutes);

    return fixture(
      EnquiryStatusEventSchema.parse({
        id: uuid(`status-event-${seed.key}-${index}`, createdAt),
        enquiryId,
        previousStatus,
        newStatus: status,
        customerStatus: toCustomerStatus(status),
        // The creation event has no actor: it is the submission itself, by an
        // unauthenticated visitor. Attributing it to a staff member would make the
        // audit trail claim someone acted when nobody did.
        actorSubjectId: index === 0 ? null : (seed.owner ?? HANDLER),
        reason: index === 0 ? null : STATUS_REASONS[status],
        createdAt,
      }),
    );
  });
}

/**
 * Staff-only transition reasons.
 *
 * Every one is written to be a leak test on its own: each contains the word
 * `STAFF-ONLY`, so the projection test can assert that no customer-facing response
 * or Zoho payload contains that token anywhere, rather than checking a list of
 * specific strings that a new status would not be added to.
 */
const STATUS_REASONS: Record<InternalStatus, string | null> = {
  received: null,
  triaging: 'STAFF-ONLY triage note: routing to the general enquiries queue.',
  awaiting_customer: 'STAFF-ONLY awaiting a reply on preferred appointment times.',
  in_progress: 'STAFF-ONLY picked up by the handler on shift.',
  referred: 'STAFF-ONLY referred to the specialist team for a clinical answer.',
  completed: 'STAFF-ONLY customer confirmed they have what they need.',
  closed_no_response: 'STAFF-ONLY closed after two reminders with no reply.',
  closed_withdrawn: 'STAFF-ONLY customer asked us to close this.',
  rejected_spam: 'STAFF-ONLY marked as spam: unsolicited commercial content.',
};

export const enquiryFixtures: readonly Fixture<Enquiry>[] = ENQUIRY_SEEDS.map(buildEnquiry);

export const enquiryStatusEventFixtures: readonly Fixture<EnquiryStatusEvent>[] =
  ENQUIRY_SEEDS.flatMap((seed, index) => buildStatusEvents(seed, enquiryFixtures[index]!.id));

/** Lookup by the stable key, so a test names the enquiry it means. */
export function enquiryByKey(key: string): Fixture<Enquiry> {
  const index = ENQUIRY_SEEDS.findIndex((seed) => seed.key === key);

  if (index === -1) {
    throw new Error(`No enquiry fixture with key "${key}"`);
  }

  return enquiryFixtures[index]!;
}

/** The events for one enquiry, oldest first, as a timeline is read. */
export function statusEventsForEnquiry(key: string): Fixture<EnquiryStatusEvent>[] {
  const enquiryId = enquiryByKey(key).id;

  return enquiryStatusEventFixtures.filter((event) => event.enquiryId === enquiryId);
}

// ---------------------------------------------------------------------------
// Internal notes
// ---------------------------------------------------------------------------

/**
 * Three notes on one enquiry, and one edited note on another.
 *
 * Three rather than one because ordering is the thing that breaks: a note list
 * sorted by the wrong column, or by a column with ties, looks correct with a single
 * note and wrong with several. The edited note exists because `editedAt` has a
 * check constraint against `createdAt` and an unexercised constraint is an
 * assumption, not a guarantee.
 *
 * Every body contains `STAFF-ONLY`, for the same reason the transition reasons do.
 */
const NOTE_SEEDS: readonly {
  key: string;
  enquiryKey: string;
  author: string;
  body: string;
  offsetHours: number;
  editedAfterHours?: number;
}[] = [
  {
    key: 'annotated-1',
    enquiryKey: 'in-progress-annotated',
    author: HANDLER,
    body: 'STAFF-ONLY first contact attempted by phone, no answer. Will try again tomorrow morning.',
    offsetHours: 7,
  },
  {
    key: 'annotated-2',
    enquiryKey: 'in-progress-annotated',
    author: OPERATIONS,
    body: 'STAFF-ONLY reassigned to me after the handover. Customer has been passed around, so keep this one with a single owner.',
    offsetHours: 20,
  },
  {
    key: 'annotated-3',
    enquiryKey: 'in-progress-annotated',
    author: OPERATIONS,
    body: 'STAFF-ONLY spoke to the customer and confirmed next steps. Waiting on the specialist team to confirm a slot.',
    offsetHours: 31,
  },
  {
    key: 'awaiting-edited',
    enquiryKey: 'awaiting-customer',
    author: HANDLER,
    body: 'STAFF-ONLY sent the appointment information pack. Corrected: sent the updated pack, the first one was out of date.',
    offsetHours: 14,
    editedAfterHours: 2,
  },
];

export const internalNoteFixtures: readonly Fixture<InternalNote>[] = NOTE_SEEDS.map((seed) => {
  const enquiryFixture = enquiryByKey(seed.enquiryKey);
  // Positioned relative to its enquiry, not to the epoch, so changing an enquiry's
  // age moves its notes with it rather than in front of it.
  const createdAt = after(enquiryFixture.createdAt, hours(seed.offsetHours));

  return fixture(
    InternalNoteSchema.parse({
      id: uuid(`note-${seed.key}`, createdAt),
      enquiryId: enquiryFixture.id,
      authorSubjectId: seed.author,
      body: seed.body,
      createdAt,
      editedAt:
        seed.editedAfterHours === undefined ? null : after(createdAt, hours(seed.editedAfterHours)),
    }),
  );
});

/** The notes on one enquiry, oldest first. */
export function notesForEnquiry(key: string): Fixture<InternalNote>[] {
  const enquiryId = enquiryByKey(key).id;

  return internalNoteFixtures.filter((note) => note.enquiryId === enquiryId);
}

/**
 * Every string that is staff-only and must never leave the internal boundary.
 *
 * One list, built from the fixtures themselves, so the leak tests in WP-02.5 pick
 * up a new note or reason automatically instead of checking an inventory somebody
 * has to remember to update.
 */
export const STAFF_ONLY_STRINGS: readonly string[] = [
  ...new Set([
    ...enquiryStatusEventFixtures.flatMap((event) => (event.reason === null ? [] : [event.reason])),
    ...internalNoteFixtures.map((note) => note.body),
  ]),
];

/** Every enquiry message. Never logged, never in an alert, never in GlitchTip. */
export const ENQUIRY_MESSAGE_STRINGS: readonly string[] = enquiryFixtures.map(
  (enquiry) => enquiry.message,
);
