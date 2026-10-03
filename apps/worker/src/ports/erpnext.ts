import type { CrmPort } from '@cera/contracts';

interface ErpNextConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

interface LeadResponse {
  data?: { name?: string } | { name?: string }[];
}

/** One ERPNext Lead per CERA enquiry, keyed by a unique custom reference field. */
export function erpNextCrm(config: ErpNextConfig): CrmPort {
  const base = config.url.replace(/\/+$/, '');
  const headers = {
    authorization: `token ${config.apiKey}:${config.apiSecret}`,
    'content-type': 'application/json',
  };
  async function findLead(reference: string): Promise<string | null> {
    const query = new URLSearchParams({
      fields: JSON.stringify(['name']),
      filters: JSON.stringify([['custom_cera_reference', '=', reference]]),
      limit_page_length: '1',
    });
    const response = await fetch(`${base}/api/resource/Lead?${query.toString()}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`crm_lookup_http_${response.status}`);
    const body = (await response.json()) as LeadResponse;
    if (!Array.isArray(body.data)) throw new Error('crm_lookup_invalid_response');
    return body.data[0]?.name ?? null;
  }

  return {
    async upsertLead(payload) {
      const lead = {
        lead_name: [payload.firstName, payload.lastName].filter(Boolean).join(' '),
        first_name: payload.firstName ?? payload.lastName,
        ...(payload.firstName ? { last_name: payload.lastName } : {}),
        email_id: payload.email,
        ...(payload.phone ? { phone: payload.phone } : {}),
        ...(payload.company ? { company_name: payload.company } : {}),
        custom_cera_reference: payload.externalReference,
        custom_cera_service: payload.service,
        custom_cera_status: payload.customerStatus,
        custom_cera_message: payload.description,
        custom_cera_source: payload.source,
        ...(payload.country ? { custom_cera_country: payload.country } : {}),
      };
      const existing = await findLead(payload.externalReference);
      const endpoint = existing
        ? `${base}/api/resource/Lead/${encodeURIComponent(existing)}`
        : `${base}/api/resource/Lead`;
      const response = await fetch(endpoint, {
        method: existing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        // A concurrent insert may have won the unique-reference race.
        if (!existing) {
          const winner = await findLead(payload.externalReference);
          if (winner) return { externalId: winner, responseCode: 200 };
        }
        throw new Error(`crm_http_${response.status}`);
      }
      const body = (await response.json()) as LeadResponse;
      if (!body.data || Array.isArray(body.data) || !body.data.name) {
        throw new Error('crm_invalid_response');
      }
      return { externalId: body.data.name, responseCode: response.status };
    },
  };
}
