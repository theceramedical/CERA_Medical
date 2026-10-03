import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CrmLeadPayload } from '@cera/contracts';

import { erpNextCrm } from './erpnext.ts';

const payload: CrmLeadPayload = {
  firstName: 'Alex',
  lastName: 'Patient',
  email: 'alex@example.com',
  company: 'CERA Research Institute',
  source: 'Website',
  description: 'I need an appointment.',
  externalReference: 'CERA-260928-AAAAA',
  service: 'Cardiology',
  customerStatus: 'Received',
  country: 'United Kingdom',
};

afterEach(() => vi.unstubAllGlobals());

describe('ERPNext CRM adapter', () => {
  it('creates a lead with the enquiry reference and customer-safe fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { name: 'CRM-LEAD-0001' } }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const crm = erpNextCrm({ url: 'https://crm.example.com/', apiKey: 'key', apiSecret: 'secret' });
    expect(await crm.upsertLead(payload, 'job-1')).toEqual({
      externalId: 'CRM-LEAD-0001',
      responseCode: 200,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const lookup = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(JSON.parse(lookup.searchParams.get('filters') ?? '')).toEqual([
      ['custom_cera_reference', '=', payload.externalReference],
    ]);
    const create = fetchMock.mock.calls[1]![1] as RequestInit;
    expect(create.method).toBe('POST');
    expect(JSON.parse(create.body as string)).toMatchObject({
      lead_name: 'Alex Patient',
      first_name: 'Alex',
      last_name: 'Patient',
      email_id: payload.email,
      company_name: payload.company,
      custom_cera_reference: payload.externalReference,
      custom_cera_service: payload.service,
      custom_cera_message: payload.description,
      custom_cera_country: payload.country,
      custom_cera_source: payload.source,
    });
    expect(create.headers).toMatchObject({ authorization: 'token key:secret' });
    expect(create.body).not.toContain('ownerId');
  });

  it('updates the same lead on retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ name: 'CRM-LEAD-0001' }] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { name: 'CRM-LEAD-0001' } }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const crm = erpNextCrm({ url: 'https://crm.example.com', apiKey: 'key', apiSecret: 'secret' });
    expect(await crm.upsertLead(payload, 'job-1')).toMatchObject({ externalId: 'CRM-LEAD-0001' });
    expect(fetchMock.mock.calls[1]![0]).toBe(
      'https://crm.example.com/api/resource/Lead/CRM-LEAD-0001',
    );
    expect((fetchMock.mock.calls[1]![1] as RequestInit).method).toBe('PUT');
  });

  it('rechecks the unique reference after a concurrent create', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 417 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ name: 'CRM-LEAD-0001' }] }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const crm = erpNextCrm({ url: 'https://crm.example.com', apiKey: 'key', apiSecret: 'secret' });
    expect(await crm.upsertLead(payload, 'job-1')).toEqual({
      externalId: 'CRM-LEAD-0001',
      responseCode: 200,
    });
  });
});
