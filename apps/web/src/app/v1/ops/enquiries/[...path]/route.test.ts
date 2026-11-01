import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, getCloudflareDatabase, handleCloudflareOpsApi } = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCloudflareDatabase: vi.fn(),
  handleCloudflareOpsApi: vi.fn(),
}));

vi.mock('../../../../../lib/auth/session.ts', () => ({ getSession }));
vi.mock('../../../../../lib/cloudflare/runtime.ts', () => ({ getCloudflareDatabase }));
vi.mock('../../../../../lib/cloudflare/ops-api.ts', () => ({ handleCloudflareOpsApi }));

import { GET, PATCH, POST } from './route.ts';

const staffSession = {
  sub: 'staff-1',
  email: 'staff@example.com',
  emailVerified: true,
  roles: ['enquiry_handler'],
} as const;
const database = { prepare: vi.fn() };

function context(...path: string[]) {
  return { params: Promise.resolve({ path }) };
}

describe('Cloudflare staff enquiry routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue(staffSession);
    getCloudflareDatabase.mockResolvedValue(database);
    handleCloudflareOpsApi.mockResolvedValue({ ok: true });
  });

  it('dispatches the enquiry detail path used by the staff page', async () => {
    const response = await GET(
      new Request('https://staff.ceramedical.org/v1/ops/enquiries/enquiry-1'),
      context('enquiry-1'),
    );

    expect(response.status).toBe(200);
    expect(handleCloudflareOpsApi).toHaveBeenCalledWith(
      '/v1/ops/enquiries/enquiry-1',
      'GET',
      undefined,
      staffSession,
    );
  });

  it('dispatches staff assignment, transition, and note actions on their browser paths', async () => {
    const assign = await PATCH(
      new Request('https://staff.ceramedical.org/v1/ops/enquiries/enquiry-1/assign', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      context('enquiry-1', 'assign'),
    );
    const transition = await POST(
      new Request('https://staff.ceramedical.org/v1/ops/enquiries/enquiry-1/transition', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'triaging' }),
      }),
      context('enquiry-1', 'transition'),
    );
    const note = await POST(
      new Request('https://staff.ceramedical.org/v1/ops/enquiries/enquiry-1/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body: 'Contacted customer.' }),
      }),
      context('enquiry-1', 'notes'),
    );

    expect([assign.status, transition.status, note.status]).toEqual([200, 200, 200]);
    expect(handleCloudflareOpsApi).toHaveBeenNthCalledWith(
      1,
      '/v1/ops/enquiries/enquiry-1/assign',
      'PATCH',
      {},
      staffSession,
    );
    expect(handleCloudflareOpsApi).toHaveBeenNthCalledWith(
      2,
      '/v1/ops/enquiries/enquiry-1/transition',
      'POST',
      { status: 'triaging' },
      staffSession,
    );
    expect(handleCloudflareOpsApi).toHaveBeenNthCalledWith(
      3,
      '/v1/ops/enquiries/enquiry-1/notes',
      'POST',
      { body: 'Contacted customer.' },
      staffSession,
    );
  });

  it('rejects non-staff callers before accessing the staff API', async () => {
    getSession.mockResolvedValue(null);

    const response = await GET(
      new Request('https://staff.ceramedical.org/v1/ops/enquiries/enquiry-1'),
      context('enquiry-1'),
    );

    expect(response.status).toBe(403);
    expect(handleCloudflareOpsApi).not.toHaveBeenCalled();
  });
});
