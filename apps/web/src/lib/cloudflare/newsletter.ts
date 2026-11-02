import { getCloudflareDatabase } from './runtime.ts';

export async function subscribeToNewsletter(request: Request): Promise<Response | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return json({ error: 'forbidden' }, 403);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid_email' }, 400);
    }
    if (!isRecord(body) || typeof body.email !== 'string')
      return json({ error: 'invalid_email' }, 400);
    const email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json({ error: 'invalid_email' }, 400);
    const salt = process.env.ENQUIRY_RATE_LIMIT_SALT;
    if (!salt) return json({ error: 'newsletter_unavailable' }, 503);
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
    const emailHash = await sha256(`${salt}:${email}`);
    const ipHash = await sha256(`${salt}:${ip}`);
    const hour = Math.floor(Date.now() / 3_600_000) * 3600;
    const timestamp = Math.floor(Date.now() / 1000);
    await db.batch([
      db
        .prepare(
          `INSERT INTO enquiry_rate_limits (key_hash, window_start, request_count, updated_at) VALUES (?, ?, 1, ?)
      ON CONFLICT(key_hash) DO UPDATE SET request_count = CASE WHEN enquiry_rate_limits.window_start = excluded.window_start
        THEN enquiry_rate_limits.request_count + 1 ELSE 1 END, window_start = excluded.window_start, updated_at = excluded.updated_at`,
        )
        .bind(`newsletter-email:${emailHash}`, hour, timestamp),
      db
        .prepare(
          `INSERT INTO enquiry_rate_limits (key_hash, window_start, request_count, updated_at) VALUES (?, ?, 1, ?)
      ON CONFLICT(key_hash) DO UPDATE SET request_count = CASE WHEN enquiry_rate_limits.window_start = excluded.window_start
        THEN enquiry_rate_limits.request_count + 1 ELSE 1 END, window_start = excluded.window_start, updated_at = excluded.updated_at`,
        )
        .bind(`newsletter-ip:${ipHash}`, hour, timestamp),
    ]);
    const rate = await db
      .prepare(
        `SELECT
    (SELECT request_count FROM enquiry_rate_limits WHERE key_hash = ? AND window_start = ?) AS email_count,
    (SELECT request_count FROM enquiry_rate_limits WHERE key_hash = ? AND window_start = ?) AS ip_count`,
      )
      .bind(`newsletter-email:${emailHash}`, hour, `newsletter-ip:${ipHash}`, hour)
      .first<{ email_count: number; ip_count: number }>();
    if ((rate?.email_count ?? 0) > 5 || (rate?.ip_count ?? 0) > 10)
      return json({ error: 'rate_limited' }, 429);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (!apiKey || !from || !site) return json({ error: 'newsletter_unavailable' }, 503);
    const token = randomToken();
    const unsubscribeToken = randomToken();
    const tokenHash = await sha256(token);
    const unsubscribeHash = await sha256(unsubscribeToken);
    const now = Math.floor(Date.now() / 1000);
    const subscription = await db
      .prepare(
        `INSERT INTO newsletter_subscriptions (email, confirmation_token_hash, unsubscribe_token_hash, expires_at, confirmed_at, unsubscribed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, NULL, ?, ?) ON CONFLICT(email) DO UPDATE SET
    confirmation_token_hash = excluded.confirmation_token_hash, unsubscribe_token_hash = excluded.unsubscribe_token_hash,
    expires_at = excluded.expires_at, confirmed_at = NULL, unsubscribed_at = NULL, updated_at = excluded.updated_at
    WHERE newsletter_subscriptions.confirmed_at IS NULL OR newsletter_subscriptions.unsubscribed_at IS NOT NULL`,
      )
      .bind(email, tokenHash, unsubscribeHash, now + 86400, now, now)
      .run();
    if (subscription.meta?.changes === 0) return json({ accepted: true });
    const confirmUrl = new URL(
      `/newsletter/confirm?token=${encodeURIComponent(token)}`,
      site,
    ).toString();
    const unsubscribeUrl = new URL(
      `/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
      site,
    ).toString();
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Confirm your CERA Medical newsletter subscription',
          text: `Confirm your subscription by visiting this one-time link within 24 hours: ${confirmUrl}\n\nIf you did not request this, ignore this email. You can unsubscribe at any time: ${unsubscribeUrl}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return json({ error: 'newsletter_delivery_failed' }, 503);
    } catch {
      return json({ error: 'newsletter_delivery_failed' }, 503);
    }
    return json({ accepted: true });
  } catch {
    return json({ error: 'newsletter_unavailable' }, 503);
  }
}

export async function confirmNewsletter(request: Request): Promise<Response> {
  const db = await getCloudflareDatabase();
  if (!db)
    return htmlPage(
      'Temporarily unavailable',
      'Please try this confirmation link again later.',
      503,
    );
  let token = new URL(request.url).searchParams.get('token') ?? '';
  if (request.method === 'POST') {
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return htmlPage('Link unavailable', 'This confirmation request could not be verified.', 403);
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return htmlPage('Link unavailable', 'This confirmation request could not be verified.', 400);
    }
    const value = form.get('token');
    token = typeof value === 'string' ? value : '';
  }
  const hash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  if (request.method === 'GET') {
    const row = await db
      .prepare(
        `SELECT email FROM newsletter_subscriptions
      WHERE confirmation_token_hash = ? AND expires_at > ? AND confirmed_at IS NULL AND unsubscribed_at IS NULL`,
      )
      .bind(hash, now)
      .first<{ email: string }>();
    return row
      ? actionPage(
          'Confirm your subscription',
          'Select confirm to subscribe to CERA Medical updates.',
          '/newsletter/confirm',
          token,
          'Confirm subscription',
        )
      : htmlPage(
          'Link expired',
          'This confirmation link is invalid or expired. Submit the form again to request a new link.',
        );
  }
  const result = await db
    .prepare(
      `UPDATE newsletter_subscriptions SET confirmed_at = ?, confirmation_token_hash = '', updated_at = ?
    WHERE confirmation_token_hash = ? AND expires_at > ? AND confirmed_at IS NULL AND unsubscribed_at IS NULL`,
    )
    .bind(now, now, hash, now)
    .run();
  const confirmed = (result.meta?.changes ?? 0) > 0;
  return htmlPage(
    confirmed ? 'Subscription confirmed' : 'Link expired',
    confirmed
      ? 'Your email is confirmed. You are subscribed to CERA Medical updates.'
      : 'This confirmation link is invalid or expired. Submit the form again to request a new link.',
  );
}

export async function unsubscribeNewsletter(request: Request): Promise<Response> {
  const db = await getCloudflareDatabase();
  if (!db)
    return htmlPage(
      'Temporarily unavailable',
      'Please try this unsubscribe link again later.',
      503,
    );
  let token = new URL(request.url).searchParams.get('token') ?? '';
  if (request.method === 'POST') {
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return htmlPage('Link unavailable', 'This unsubscribe request could not be verified.', 403);
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return htmlPage('Link unavailable', 'This unsubscribe request could not be verified.', 400);
    }
    const value = form.get('token');
    token = typeof value === 'string' ? value : '';
  }
  const hash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  if (request.method === 'GET') {
    const row = await db
      .prepare(
        'SELECT email FROM newsletter_subscriptions WHERE unsubscribe_token_hash = ? AND unsubscribed_at IS NULL',
      )
      .bind(hash)
      .first();
    return row
      ? actionPage(
          'Unsubscribe from updates',
          'Select unsubscribe to stop newsletter updates.',
          '/newsletter/unsubscribe',
          token,
          'Unsubscribe',
        )
      : htmlPage('Link unavailable', 'This unsubscribe link is invalid or has already been used.');
  }
  const result = await db
    .prepare(
      `UPDATE newsletter_subscriptions SET unsubscribed_at = ?, updated_at = ?
    WHERE unsubscribe_token_hash = ? AND unsubscribed_at IS NULL`,
    )
    .bind(now, now, hash)
    .run();
  return htmlPage(
    result.meta?.changes ? 'Unsubscribed' : 'Link unavailable',
    result.meta?.changes
      ? 'You will no longer receive newsletter updates.'
      : 'This unsubscribe link is invalid or has already been used.',
  );
}

function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
async function sha256(value: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store' } });
}
function htmlPage(title: string, message: string, status = 200): Response {
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, (char) => {
      const escaped: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return escaped[char] ?? char;
    });
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)} · CERA Medical</title><main style="font:16px/1.6 system-ui;max-width:36rem;margin:12vh auto;padding:2rem"><h1>${escape(title)}</h1><p>${escape(message)}</p><a href="/">Return to CERA Medical</a></main></html>`,
    {
      status,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    },
  );
}
function actionPage(
  title: string,
  message: string,
  action: string,
  token: string,
  label: string,
): Response {
  const escape = (value: string) =>
    value.replace(/[&<>"']/g, (char) => {
      const escaped: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return escaped[char] ?? char;
    });
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)} · CERA Medical</title><main style="font:16px/1.6 system-ui;max-width:36rem;margin:12vh auto;padding:2rem"><h1>${escape(title)}</h1><p>${escape(message)}</p><form method="post" action="${escape(action)}"><input type="hidden" name="token" value="${escape(token)}"><button type="submit">${escape(label)}</button></form></main></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } },
  );
}
