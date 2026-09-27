import { toZohoLeadPayload } from '@cera/contracts';
import { describe, expect, it } from 'vitest';

import { fakeCrm, fakeEmail } from './fake.ts';

describe('fake adapters', () => {
  it('upserts the same Zoho lead once for a repeated idempotency key', async () => {
    const crm = fakeCrm();
    const payload = toZohoLeadPayload(
      {
        id: '01900000-0000-7000-8000-000000000001',
        reference: 'CERA-260101-AAAAA',
        customerSubjectId: null,
        name: 'Alex Patient',
        email: 'alex@example.com',
        phone: null,
        serviceId: 'cardiology',
        message: 'I would like to know about a first appointment.',
        consentAt: '2026-01-05T09:00:00.000Z',
        source: 'web_general',
        internalStatus: 'received',
        ownerId: null,
        createdAt: '2026-01-05T09:00:00.000Z',
        updatedAt: '2026-01-05T09:00:00.000Z',
      },
      { title: 'Cardiology' },
    );
    await crm.upsertLead(payload, 'zoho.lead.upsert/enq-1');
    await crm.upsertLead(payload, 'zoho.lead.upsert/enq-1');
    expect(crm.upserts).toHaveLength(1);
    expect(JSON.stringify(payload)).not.toContain('ownerId');
  });

  it('sends one email per idempotency key', async () => {
    const email = fakeEmail();
    await email.send({
      to: 'alex@example.com',
      subject: 'We received your enquiry',
      text: 'Your reference is CERA-260101-AAAAA.',
      html: '<p>Your reference is CERA-260101-AAAAA.</p>',
      idempotencyKey: 'resend.customer.receipt/enq-1',
    });
    await email.send({
      to: 'alex@example.com',
      subject: 'We received your enquiry',
      text: 'Your reference is CERA-260101-AAAAA.',
      html: '<p>Your reference is CERA-260101-AAAAA.</p>',
      idempotencyKey: 'resend.customer.receipt/enq-1',
    });
    expect(email.sent).toHaveLength(1);
  });
});
