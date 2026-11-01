import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCloudflareDatabase, prepare, bind, first, run } = vi.hoisted(() => ({
  getCloudflareDatabase: vi.fn(),
  prepare: vi.fn(),
  bind: vi.fn(),
  first: vi.fn(),
  run: vi.fn(),
}));

vi.mock('./runtime.ts', () => ({ getCloudflareDatabase }));

import { confirmNewsletter } from './newsletter.ts';

const statement = { bind, first, run };
const database = { prepare };

function confirmationRequest(token: string): Request {
  const form = new FormData();
  form.set('token', token);
  return new Request('https://www.ceramedical.org/newsletter/confirm', {
    method: 'POST',
    headers: { origin: 'https://www.ceramedical.org' },
    body: form,
  });
}

describe('newsletter confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCloudflareDatabase.mockResolvedValue(database);
    prepare.mockReturnValue(statement);
    bind.mockReturnValue(statement);
    run.mockResolvedValue({ meta: { changes: 1 } });
  });

  it('confirms only the current unexpired token in one conditional update', async () => {
    const response = await confirmNewsletter(confirmationRequest('single-use-token'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<h1>Subscription confirmed</h1>');
    expect(prepare).toHaveBeenCalledWith(
      expect.stringContaining(
        'WHERE confirmation_token_hash = ? AND expires_at > ? AND confirmed_at IS NULL AND unsubscribed_at IS NULL',
      ),
    );
    expect(first).not.toHaveBeenCalled();
    expect(bind).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.any(Number),
    );
  });

  it('does not report confirmation when the token no longer matches a row', async () => {
    run.mockResolvedValue({ meta: { changes: 0 } });

    const response = await confirmNewsletter(confirmationRequest('replaced-token'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<h1>Link expired</h1>');
    expect(html).not.toContain('You are subscribed to CERA Medical updates.');
  });
});
