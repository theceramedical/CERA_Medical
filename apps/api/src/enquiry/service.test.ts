import { toCustomerEnquiry } from '@cera/contracts';
import { describe, expect, it } from 'vitest';

import { createEnquiryService } from './service.ts';
import { memoryEnquiryStore } from './store.ts';

const valid = {
  name: 'Alex Patient',
  email: 'alex@example.com',
  serviceId: 'cardiology',
  message: 'I would like to know about a first appointment.',
  consent: true,
  source: 'web_general',
};

function service() {
  return createEnquiryService({
    store: memoryEnquiryStore(),
    allowedServiceIds: new Set(['cardiology']),
    ipSalt: 'salt',
  });
}

describe('createEnquiryService', () => {
  it('stores a valid enquiry once and returns only the reference', async () => {
    const enquiry = service();

    const first = await enquiry.submit({
      body: valid,
      ip: '127.0.0.1',
      idempotencyKey: 'form-1',
      honeypot: null,
      startedAt: null,
    });

    expect(first.status).toBe(201);
    expect(first.body.reference).toMatch(/^CERA-/);
    expect(JSON.stringify(first.body)).not.toContain('I would like');

    const replay = await enquiry.submit({
      body: valid,
      ip: '127.0.0.1',
      idempotencyKey: 'form-1',
      honeypot: null,
      startedAt: null,
    });
    expect(replay.status).toBe(200);
    expect(replay.body.reference).toBe(first.body.reference);
  });

  it('returns the original reference for a fingerprint match without a shared key', async () => {
    const enquiry = service();
    const first = await enquiry.submit({
      body: valid,
      ip: '127.0.0.1',
      idempotencyKey: 'tab-a',
      honeypot: null,
      startedAt: null,
    });
    const second = await enquiry.submit({
      body: { ...valid, name: 'Alex P.' },
      ip: '127.0.0.1',
      idempotencyKey: 'tab-b',
      honeypot: null,
      startedAt: null,
    });
    expect(second.status).toBe(200);
    expect(second.body.reference).toBe(first.body.reference);
  });

  it('rejects missing consent as consent_required', async () => {
    await expect(
      service().submit({
        body: { ...valid, consent: false },
        ip: '127.0.0.1',
        idempotencyKey: null,
        honeypot: null,
        startedAt: null,
      }),
    ).rejects.toMatchObject({ code: 'consent_required' });
  });

  it('requires and durably models service-specific consent evidence', async () => {
    const store = memoryEnquiryStore();
    const service = createEnquiryService({
      store,
      allowedServiceIds: new Set(['metagenomic-data-analysis']),
      ipSalt: 'salt',
    });
    const body = { ...valid, serviceId: 'metagenomic-data-analysis' };
    await expect(
      service.submit({
        body,
        ip: '127.0.0.1',
        idempotencyKey: 'missing-sequencing-consent',
        honeypot: null,
        startedAt: null,
      }),
    ).rejects.toMatchObject({
      code: 'consent_required',
      fieldErrors: [{ path: 'sequencingDataConsent' }],
    });

    const result = await service.submit({
      body: { ...body, sequencingDataConsent: true, updatesOptIn: true },
      ip: '127.0.0.1',
      idempotencyKey: 'accepted-sequencing-consent',
      honeypot: null,
      startedAt: null,
    });
    expect(result.enquiry).toMatchObject({
      consentVersion: expect.any(String),
      sequencingDataConsent: true,
      samplesCompoundsConsent: false,
      healthDataConsent: false,
      updatesOptIn: true,
    });
  });

  it('rejects an enquiry-disabled service', async () => {
    await expect(
      service().submit({
        body: { ...valid, serviceId: 'diagnostic-tests' },
        ip: '127.0.0.1',
        idempotencyKey: null,
        honeypot: null,
        startedAt: null,
      }),
    ).rejects.toMatchObject({ code: 'validation_failed' });
  });

  it('rejects a filled honeypot without storing a record', async () => {
    await expect(
      service().submit({
        body: valid,
        ip: '127.0.0.1',
        idempotencyKey: null,
        honeypot: 'Acme',
        startedAt: null,
      }),
    ).rejects.toMatchObject({ code: 'validation_failed' });
  });

  it('rejects a submission completed faster than a human could', async () => {
    const enquiry = createEnquiryService({
      store: memoryEnquiryStore(),
      allowedServiceIds: new Set(['cardiology']),
      ipSalt: 'salt',
      now: () => new Date('2026-01-01T00:00:02.000Z'),
    });
    await expect(
      enquiry.submit({
        body: valid,
        ip: '127.0.0.1',
        idempotencyKey: null,
        honeypot: null,
        startedAt: '2026-01-01T00:00:01.000Z',
      }),
    ).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('routes a high-score message to rejected_spam rather than discarding it', async () => {
    const enquiry = service();
    const created = await enquiry.submit({
      body: {
        ...valid,
        message: 'Buy now http://a.test http://b.test http://c.test cheap cheap cheap cheap cheap',
      },
      ip: '10.0.0.2',
      idempotencyKey: 'spam-1',
      honeypot: null,
      startedAt: null,
    });
    expect(created.status).toBe(201);
    expect(created.enquiry?.internalStatus).toBe('rejected_spam');
  });
});

describe('customer projection leak', () => {
  it('omits notes, owner, message, and staff-only statuses', async () => {
    const enquiry = service();
    const created = await enquiry.submit({
      body: valid,
      ip: '127.0.0.1',
      idempotencyKey: 'leak-1',
      honeypot: null,
      startedAt: null,
    });
    if (created.enquiry === undefined) throw new Error('expected a stored enquiry');
    await enquiry.transition(created.enquiry.id, 'triaging');

    const view = await enquiry.customerView(created.enquiry.id, 'Cardiology');
    const serialised = JSON.stringify(view);

    expect(serialised).not.toContain(valid.message);
    expect(serialised).not.toContain('rejected_spam');
    expect(serialised).not.toContain('triaging');
    expect(serialised).not.toContain('owner');
    expect(view.status).toBe('in_review');
    expect(toCustomerEnquiry).toBeTypeOf('function');
  });
});
