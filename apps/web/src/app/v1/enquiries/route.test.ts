import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { handleCloudflareEnquiry, isCloudflareWorkerRuntime } = vi.hoisted(() => ({
  handleCloudflareEnquiry: vi.fn(),
  isCloudflareWorkerRuntime: vi.fn(),
}));

vi.mock('../../../lib/cloudflare/enquiries.ts', () => ({ handleCloudflareEnquiry }));
vi.mock('../../../lib/cloudflare/runtime.ts', () => ({ isCloudflareWorkerRuntime }));

import { POST } from './route.ts';

describe('public enquiry route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    handleCloudflareEnquiry.mockResolvedValue(null);
    isCloudflareWorkerRuntime.mockResolvedValue(true);
  });

  it('never reports acceptance from an API database when Worker D1 is unavailable', async () => {
    vi.stubEnv('API_INTERNAL_URL', 'https://api.example.test');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await POST(
      new Request('https://www.ceramedical.org/v1/enquiries', {
        method: 'POST',
        headers: { origin: 'https://www.ceramedical.org' },
      }),
    );

    expect(response.status).toBe(503);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(handleCloudflareEnquiry).toHaveBeenCalledOnce();
  });
});
