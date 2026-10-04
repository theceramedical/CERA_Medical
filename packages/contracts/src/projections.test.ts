import { describe, expect, it } from 'vitest';

import {
  type Enquiry,
  type EnquiryStatusEvent,
  type InternalNote,
  PROHIBITED_ENQUIRY_FIELDS,
  type Service,
} from './entities.ts';
import { EnquirySchema } from './entities.ts';
import { EnquirySourceSchema } from './enums.ts';
import {
  splitName,
  toCustomerEnquiry,
  toPublicService,
  toStaffEnquiry,
  toCrmLeadPayload,
} from './projections.ts';

/**
 * The leak tests are the point of this file.
 *
 * Each projection is checked for the absence of specific values, not just for
 * the presence of expected keys. A key-shape assertion passes when a sensitive
 * value is smuggled into a field with an innocent name; searching the serialised
 * output for the actual secret string does not.
 */

const SECRET_MESSAGE =
  'I would like to discuss a persistent shoulder problem and my treatment options.';

const enquiry: Enquiry = {
  id: '018f6e1a-0000-7000-8000-000000000001',
  reference: 'CERA-260901-A4B7Z',
  customerSubjectId: 'authentik-subject-abc',
  name: 'Alex Fictional Morgan',
  email: 'alex.morgan@example.com',
  phone: '+441632960001',
  institution: null,
  country: null,
  serviceId: 'svc-cardiology',
  message: SECRET_MESSAGE,
  consentAt: '2026-09-01T10:00:00.000Z',
  source: 'web_service_page',
  internalStatus: 'rejected_spam',
  ownerId: 'authentik-subject-staff-7',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-04T12:00:00.000Z',
};

const service: Service = {
  id: 'svc-cardiology',
  slug: 'cardiology',
  category: { id: 'cat-1', slug: 'diagnostics', title: 'Diagnostics' },
  title: 'Cardiology Assessment',
  summary: 'A consultant-led cardiac assessment.',
  description: 'Full description.',
  displayPrice: 'From £250',
  availabilityText: 'Usually within 2 weeks',
  enquiryEnabled: true,
  listPriceMinor: null,
  checkoutEnabled: false,
  mediaId: 'media-1',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const statusEvents: Pick<EnquiryStatusEvent, 'newStatus' | 'createdAt'>[] = [
  { newStatus: 'received', createdAt: '2026-09-01T10:00:00.000Z' },
  { newStatus: 'triaging', createdAt: '2026-09-02T10:00:00.000Z' },
  { newStatus: 'rejected_spam', createdAt: '2026-09-04T12:00:00.000Z' },
];

const notes: InternalNote[] = [
  {
    id: '018f6e1a-0000-7000-8000-000000000010',
    enquiryId: enquiry.id,
    authorSubjectId: 'authentik-subject-staff-7',
    body: 'Caller was abusive on the phone; flagging as spam and do not re-engage.',
    createdAt: '2026-09-03T10:00:00.000Z',
    editedAt: null,
  },
];

describe('customer projection', () => {
  const projection = toCustomerEnquiry(enquiry, service.title, statusEvents);
  const serialised = JSON.stringify(projection);

  it('exposes exactly the intended keys', () => {
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

  it('does not contain the enquiry message', () => {
    // The customer wrote it; echoing it back adds nothing and widens the surface
    // on which it can be logged or cached.
    expect(serialised).not.toContain(SECRET_MESSAGE);
    expect(serialised).not.toContain('shoulder');
  });

  it('does not contain the internal status or the owner', () => {
    expect(serialised).not.toContain('rejected_spam');
    expect(serialised).not.toContain('authentik-subject-staff-7');
    expect(serialised).not.toContain('spam');
  });

  it('does not contain contact details or internal identifiers', () => {
    expect(serialised).not.toContain('alex.morgan@example.com');
    expect(serialised).not.toContain('+441632960001');
    expect(serialised).not.toContain(enquiry.id);
    expect(serialised).not.toContain('authentik-subject-abc');
  });

  it('does not contain any internal note body', () => {
    for (const note of notes) {
      expect(serialised).not.toContain(note.body);
    }
    expect(serialised).not.toContain('abusive');
  });

  it('presents the spam rejection as a plain closure', () => {
    expect(projection.status).toBe('closed');
    expect(projection.statusLabel).toBe('Closed');
  });

  it('identifies the enquiry by reference, not by row id', () => {
    expect(projection.reference).toBe('CERA-260901-A4B7Z');
  });
});

describe('staff projection', () => {
  const projection = toStaffEnquiry(enquiry, {
    serviceTitle: service.title,
    ownerDisplayName: 'Sam Handler',
    noteCount: 1,
    lastIntegrationStatus: 'dead_letter',
  });

  it('does include operational fields, because staff are the audience', () => {
    expect(projection.internalStatus).toBe('rejected_spam');
    expect(projection.ownerId).toBe('authentik-subject-staff-7');
    expect(projection.message).toBe(SECRET_MESSAGE);
  });

  it('adds the display fields the queue needs', () => {
    expect(projection.serviceTitle).toBe('Cardiology Assessment');
    expect(projection.ownerDisplayName).toBe('Sam Handler');
    expect(projection.noteCount).toBe(1);
    expect(projection.lastIntegrationStatus).toBe('dead_letter');
  });

  it('copies every enquiry field, so a new field is not silently dropped', () => {
    // The mirror image of the customer test. Here, omission is the failure mode:
    // a field added to the entity but not to this builder would disappear from
    // the staff UI with no error.
    const entityKeys = Object.keys(EnquirySchema.shape);
    const missing = entityKeys.filter((key) => !(key in projection));

    expect(missing).toEqual([]);
  });
});

describe('CRM payload', () => {
  const payload = toCrmLeadPayload(enquiry, service);
  const serialised = JSON.stringify(payload);

  it('sends the customer status vocabulary, never the internal one', () => {
    // CRM users are not necessarily CERA staff.
    expect(payload.customerStatus).toBe('closed');
    expect(serialised).not.toContain('rejected_spam');
  });

  it('does not contain an internal note, owner identity, or row id', () => {
    expect(serialised).not.toContain('authentik-subject-staff-7');
    expect(serialised).not.toContain(enquiry.id);
    for (const note of notes) {
      expect(serialised).not.toContain(note.body);
    }
  });

  it('uses the reference as the external deduplication key', () => {
    expect(payload.externalReference).toBe('CERA-260901-A4B7Z');
  });

  it('sends the message as the only free text', () => {
    expect(payload.description).toBe(SECRET_MESSAGE);
  });

  it('omits institution when the individual has not supplied one', () => {
    expect(payload.company).toBeUndefined();
  });

  it('carries optional institution and country details to the CRM', () => {
    const withOrganisation = toCrmLeadPayload(
      { ...enquiry, institution: 'CERA Research Institute', country: 'United Kingdom' },
      service,
    );
    expect(withOrganisation.company).toBe('CERA Research Institute');
    expect(withOrganisation.description).toBe(SECRET_MESSAGE);
    expect(withOrganisation.country).toBe('United Kingdom');
  });

  it('omits the phone key entirely when there is no phone number', () => {
    // An explicit null could clear an existing value on a re-upsert.
    const payloadWithoutPhone = toCrmLeadPayload({ ...enquiry, phone: null }, service);

    expect('phone' in payloadWithoutPhone).toBe(false);
  });

  it('gives every source its own human-readable label', () => {
    // CRM reporting uses this source label, so two sources must never collapse into one
    // label, and none may leak the internal snake_case value.
    const sources = EnquirySourceSchema.options;
    const labels = sources.map(
      (source) => toCrmLeadPayload({ ...enquiry, source }, service).source,
    );

    expect(new Set(labels).size).toBe(sources.length);
    for (const label of labels) {
      expect(label).not.toContain('_');
    }
  });
});

describe('splitName', () => {
  it('treats a single word as the last name', () => {
    expect(splitName('Cher')).toEqual({ lastName: 'Cher' });
  });

  it('splits a two-part name', () => {
    expect(splitName('Alex Morgan')).toEqual({ firstName: 'Alex', lastName: 'Morgan' });
  });

  it('treats only the final token as the surname', () => {
    expect(splitName('Alex Fictional Morgan')).toEqual({
      firstName: 'Alex Fictional',
      lastName: 'Morgan',
    });
  });

  it('tolerates irregular whitespace', () => {
    expect(splitName('  Alex   Morgan  ')).toEqual({ firstName: 'Alex', lastName: 'Morgan' });
  });
});

describe('public service projection', () => {
  const projection = toPublicService(service);

  it('exposes exactly the intended keys', () => {
    expect(Object.keys(projection).sort()).toEqual([
      'availabilityText',
      'category',
      'checkoutEnabled',
      'description',
      'displayPrice',
      'enquiryEnabled',
      'listPriceMinor',
      'mediaId',
      'slug',
      'summary',
      'title',
    ]);
  });

  it('omits the internal id, status, and edit timestamps', () => {
    const serialised = JSON.stringify(projection);

    expect('id' in projection).toBe(false);
    expect('status' in projection).toBe(false);
    expect(serialised).not.toContain('createdAt');
    expect(serialised).not.toContain('updatedAt');
  });

  it('keeps displayPrice a string, so no payment path can form', () => {
    expect(typeof projection.displayPrice).toBe('string');
  });
});

describe('enquiry schema scope', () => {
  it('has no field for clinical data or file upload', () => {
    // PRD 3.2 puts clinical data out of scope. This asserts the absence, so a
    // well-meaning "short medical history" field fails a test rather than
    // passing review.
    const fields = Object.keys(EnquirySchema.shape);
    const violations = fields.filter((field) =>
      PROHIBITED_ENQUIRY_FIELDS.some(
        (prohibited) => field.toLowerCase() === prohibited.toLowerCase(),
      ),
    );

    expect(violations).toEqual([]);
  });

  it('checks a prohibited name would actually be caught', () => {
    // Proves the check above is capable of failing.
    const pretend = ['name', 'email', 'diagnosis'];
    const violations = pretend.filter((field) =>
      PROHIBITED_ENQUIRY_FIELDS.some(
        (prohibited) => field.toLowerCase() === prohibited.toLowerCase(),
      ),
    );

    expect(violations).toEqual(['diagnosis']);
  });
});
