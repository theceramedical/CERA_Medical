import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ZohoLeadPayload } from '@cera/contracts';

import { erpNextCrm } from './erpnext.ts';

const payload: ZohoLeadPayload = {
  First_Name: 'Alex',
  Last_Name: 'Patient',
  Email: 'alex@example.com',
  Company: 'Individual enquiry',
  Lead_Source: 'Website',
  Description: 'I need an appointment.',
  External_Lead_ID: 'CERA-260928-AAAAA',
  CERA_Service: 'Cardiology',
  CERA_Status: 'Received',
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
      ['custom_cera_reference', '=', payload.External_Lead_ID],
    ]);
    const create = fetchMock.mock.calls[1]![1] as RequestInit;
    expect(create.method).toBe('POST');
    expect(JSON.parse(create.body as string)).toMatchObject({
      first_name: 'Alex',
      last_name: 'Patient',
      email_id: payload.Email,
      custom_cera_reference: payload.External_Lead_ID,
      custom_cera_service: 'Cardiology',
      custom_cera_message: payload.Description,
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
