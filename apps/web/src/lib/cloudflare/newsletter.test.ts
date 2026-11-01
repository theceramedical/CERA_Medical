import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCloudflareDatabase, prepare, bind, first, run, batch } = vi.hoisted(() => ({
  getCloudflareDatabase: vi.fn(),
  prepare: vi.fn(),
  bind: vi.fn(),
  first: vi.fn(),
  run: vi.fn(),
  batch: vi.fn(),
}));

vi.mock('./runtime.ts', () => ({ getCloudflareDatabase }));

import { confirmNewsletter, subscribeToNewsletter, unsubscribeNewsletter } from './newsletter.ts';

const statement = { bind, first, run };
const database = { prepare, batch };

function subscribeRequest(email = 'alex@example.test'): Request {
  return new Request('https://www.ceramedical.org/api/newsletter/subscribe', {
    method: 'POST',
    headers: {
      origin: 'https://www.ceramedical.org',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
}

function confirmationRequest(token: string): Request {
  const form = new FormData();
  form.set('token', token);
  return new Request('https://www.ceramedical.org/newsletter/confirm', {
    method: 'POST',
    headers: { origin: 'https://www.ceramedical.org' },
    body: form,
  });
}

function unsubscribeRequest(token: string): Request {
  const form = new FormData();
  form.set('token', token);
  return new Request('https://www.ceramedical.org/newsletter/unsubscribe', {
    method: 'POST',
    headers: { origin: 'https://www.ceramedical.org' },
    body: form,
  });
}

describe('newsletter confirmation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getCloudflareDatabase.mockResolvedValue(database);
    prepare.mockReturnValue(statement);
    bind.mockReturnValue(statement);
    first.mockResolvedValue({ email_count: 1, ip_count: 1 });
    run.mockResolvedValue({ meta: { changes: 1 } });
    batch.mockResolvedValue([{ meta: { changes: 1 } }, { meta: { changes: 1 } }]);
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

  it('reports newsletter acceptance only after Resend accepts a confirmation message', async () => {
    vi.stubEnv('ENQUIRY_RATE_LIMIT_SALT', 'test-only-rate-limit-salt');
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'CERA <mail@example.test>');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', send);

    const response = await subscribeToNewsletter(subscribeRequest());

    expect(response?.status).toBe(200);
    await expect(response?.json()).resolves.toEqual({ accepted: true });
    expect(prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO newsletter_subscriptions'),
    );
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('reports provider failure instead of success while leaving D1 pending for another request', async () => {
    vi.stubEnv('ENQUIRY_RATE_LIMIT_SALT', 'test-only-rate-limit-salt');
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'CERA <mail@example.test>');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 502 }));
    vi.stubGlobal('fetch', send);

    const response = await subscribeToNewsletter(subscribeRequest());

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toEqual({ error: 'newsletter_delivery_failed' });
    expect(prepare).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO newsletter_subscriptions'),
    );
    expect(send).toHaveBeenCalledOnce();
  });

  it('does not claim a confirmation email was sent for an already confirmed address', async () => {
    vi.stubEnv('ENQUIRY_RATE_LIMIT_SALT', 'test-only-rate-limit-salt');
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'CERA <mail@example.test>');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.ceramedical.org');
    run.mockResolvedValue({ meta: { changes: 0 } });
    const send = vi.fn();
    vi.stubGlobal('fetch', send);

    const response = await subscribeToNewsletter(subscribeRequest());

    expect(response?.status).toBe(200);
    await expect(response?.json()).resolves.toEqual({ accepted: true });
    expect(send).not.toHaveBeenCalled();
  });

  it('reports unsubscribe success only when D1 changes the subscription state', async () => {
    const success = await unsubscribeNewsletter(unsubscribeRequest('unsubscribe-token'));
    expect(await success.text()).toContain('<h1>Unsubscribed</h1>');

    run.mockResolvedValue({ meta: { changes: 0 } });
    const invalid = await unsubscribeNewsletter(unsubscribeRequest('stale-token'));
    const html = await invalid.text();
    expect(html).toContain('<h1>Link unavailable</h1>');
    expect(html).not.toContain('You will no longer receive newsletter updates.');
  });
});
