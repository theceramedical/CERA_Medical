import {
  CreateEnquiryResponseSchema,
  EnquiryInputSchema,
  requiredServiceSpecificConsent,
} from '@cera/contracts';

import { getCloudflareDatabase } from './runtime.ts';

const SERVICES = new Set([
  'preclinical-studies',
  'molecular-research',
  'biomedical-data-analysis',
  'biomedical-omics-data-analysis',
  'metagenomic-data-analysis',
  'evidence-synthesis-technical-reports',
  'product-enquiry',
  'research-collaboration',
  'other-enquiry',
]);

export async function handleCloudflareEnquiry(request: Request): Promise<Response | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  if (request.headers.get('origin') !== new URL(request.url).origin)
    return json({ error: 'forbidden' }, 403);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'validation_failed' }, 400);
  }
  if (isRecord(raw) && typeof raw.company === 'string' && raw.company)
    return json({ error: 'validation_failed' }, 400);
  if (isRecord(raw) && typeof raw.startedAt === 'string') {
    const started = Date.parse(raw.startedAt);
    if (Number.isFinite(started) && Date.now() - started < 2000)
      return json({ error: 'rate_limited', retryable: true }, 429);
  }
  const parsed = EnquiryInputSchema.safeParse(raw);
  if (!parsed.success) return json({ error: 'validation_failed', retryable: false }, 422);
  if (!SERVICES.has(parsed.data.serviceId))
    return json({ error: 'validation_failed', retryable: false }, 422);
  const input = parsed.data;
  const configuredConsentVersion =
    process.env.ENQUIRY_CONSENT_VERSION ?? 'cera-brief-2026-10-03-v1';
  if (input.consentVersion !== configuredConsentVersion) {
    return json({ error: 'consent_version_changed', retryable: false }, 409);
  }
  const specificConsent = requiredServiceSpecificConsent(input.serviceId);
  if (specificConsent && input[specificConsent] !== true)
    return json({ error: 'consent_required' }, 422);
  const idempotencyKey = request.headers.get('idempotency-key');
  if (idempotencyKey && !/^[\w-]{8,128}$/.test(idempotencyKey))
    return json({ error: 'validation_failed' }, 400);
  const salt = process.env.ENQUIRY_RATE_LIMIT_SALT;
  if (!salt) return json({ error: 'service_unavailable', retryable: true }, 503);
  const email = input.email.trim().toLowerCase();
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const emailHash = await sha256(`${salt}:${email}`);
  const ipHash = await sha256(`${salt}:${ip}`);
  const currentHour = Math.floor(Date.now() / 3_600_000) * 3600;
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO enquiry_rate_limits (key_hash, window_start, request_count, updated_at) VALUES (?, ?, 1, ?)
        ON CONFLICT(key_hash) DO UPDATE SET request_count = CASE WHEN enquiry_rate_limits.window_start = excluded.window_start
          THEN enquiry_rate_limits.request_count + 1 ELSE 1 END,
          window_start = excluded.window_start, updated_at = excluded.updated_at`,
        )
        .bind(`email:${emailHash}`, currentHour, Math.floor(Date.now() / 1000)),
      db
        .prepare(
          `INSERT INTO enquiry_rate_limits (key_hash, window_start, request_count, updated_at) VALUES (?, ?, 1, ?)
        ON CONFLICT(key_hash) DO UPDATE SET request_count = CASE WHEN enquiry_rate_limits.window_start = excluded.window_start
          THEN enquiry_rate_limits.request_count + 1 ELSE 1 END,
          window_start = excluded.window_start, updated_at = excluded.updated_at`,
        )
        .bind(`ip:${ipHash}`, currentHour, Math.floor(Date.now() / 1000)),
    ]);
    const limited = await db
      .prepare(
        `SELECT
      (SELECT request_count FROM enquiry_rate_limits WHERE key_hash = ? AND window_start = ?) AS email_count,
      (SELECT request_count FROM enquiry_rate_limits WHERE key_hash = ? AND window_start = ?) AS ip_count`,
      )
      .bind(`email:${emailHash}`, currentHour, `ip:${ipHash}`, currentHour)
      .first<{ email_count: number; ip_count: number }>();
    if ((limited?.email_count ?? 0) > 5 || (limited?.ip_count ?? 0) > 10)
      return json({ error: 'rate_limited', retryable: true }, 429);
    await db
      .prepare('DELETE FROM enquiry_rate_limits WHERE updated_at < ?')
      .bind(Math.floor(Date.now() / 1000) - 86400)
      .run();
    if (idempotencyKey) {
      const previous = await db
        .prepare('SELECT reference FROM enquiries WHERE idempotency_key = ?')
        .bind(idempotencyKey)
        .first<{ reference: string }>();
      if (previous) return accepted(previous.reference, 200);
    }
    const fingerprint = await sha256(
      JSON.stringify({
        email,
        name: input.name,
        phone: input.phone ?? null,
        institution: input.institution ?? null,
        country: input.country ?? null,
        serviceId: input.serviceId,
        message: input.message.trim(),
      }),
    );
    const duplicate = await db
      .prepare(
        'SELECT reference FROM enquiries WHERE fingerprint = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1',
      )
      .bind(fingerprint, Math.floor(Date.now() / 1000) - 3600)
      .first<{ reference: string }>();
    if (duplicate) return accepted(duplicate.reference, 200);
    const id = crypto.randomUUID();
    const reference = `CERA-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${randomReferenceSuffix()}`;
    const now = Math.floor(Date.now() / 1000);
    const consentVersion = configuredConsentVersion;
    const message = input.message.trim();
    const payload = JSON.stringify({
      id,
      reference,
      name: input.name,
      email,
      phone: input.phone ?? null,
      institution: input.institution ?? null,
      country: input.country ?? null,
      serviceId: input.serviceId,
      message,
      consentVersion,
      consentAt: new Date(now * 1000).toISOString(),
    });
    await db.batch([
      db
        .prepare(
          `INSERT INTO enquiries (id, reference, fingerprint, idempotency_key, version, name, email, phone, organisation,
        service_slug, summary, internal_status, created_at, updated_at, country, consent, consent_version,
        sequencing_data_consent, samples_compounds_consent, health_data_consent, updates_opt_in, source)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          reference,
          fingerprint,
          idempotencyKey,
          input.name,
          email,
          input.phone ?? null,
          input.institution ?? null,
          input.serviceId,
          message,
          now,
          now,
          input.country ?? null,
          consentVersion,
          input.sequencingDataConsent ? 1 : 0,
          input.samplesCompoundsConsent ? 1 : 0,
          input.healthDataConsent ? 1 : 0,
          input.updatesOptIn ? 1 : 0,
          input.source,
        ),
      db
        .prepare(
          `INSERT INTO audit_events (id, action, target_type, target_id, details_json, created_at)
          VALUES (?, 'enquiry.created', 'enquiry', ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), id, JSON.stringify({ reference, source: input.source }), now),
      db
        .prepare(
          `INSERT INTO integration_deliveries (id, aggregate_type, aggregate_id, channel, payload_json) VALUES
        (?, 'enquiry', ?, 'resend.enquiry_ack', ?), (?, 'enquiry', ?, 'resend.enquiry_staff', ?)`,
        )
        .bind(crypto.randomUUID(), id, payload, crypto.randomUUID(), id, payload),
    ]);
    // The D1 outbox is authoritative. Attempt delivery now; failures remain visible and retryable.
    await Promise.all([
      deliverCloudflareIntegration(db, id, 'resend.enquiry_ack', payload),
      deliverCloudflareIntegration(db, id, 'resend.enquiry_staff', payload),
    ]);
    return accepted(reference, 201);
  } catch {
    if (idempotencyKey) {
      const existing = await db
        .prepare('SELECT reference FROM enquiries WHERE idempotency_key = ?')
        .bind(idempotencyKey)
        .first<{ reference: string }>();
      if (existing) return accepted(existing.reference, 200);
    }
    return json({ error: 'service_unavailable', retryable: true }, 503);
  }
}

export async function deliverCloudflareIntegration(
  db: NonNullable<Awaited<ReturnType<typeof getCloudflareDatabase>>>,
  id: string,
  channel: string,
  payload: string,
) {
  const started = Math.floor(Date.now() / 1000);
  await db
    .prepare(
      `UPDATE integration_deliveries SET status = 'processing', attempts = attempts + 1, updated_at = ?
    WHERE aggregate_id = ? AND channel = ? AND status IN ('pending', 'failed')`,
    )
    .bind(started, id, channel)
    .run();
  try {
    const data = JSON.parse(payload) as {
      reference: string;
      name: string;
      email: string;
      phone: string | null;
      institution: string | null;
      country: string | null;
      serviceId: string;
      message: string;
    };
    if (channel === 'resend.enquiry_ack' || channel === 'resend.enquiry_staff') {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      const to = channel === 'resend.enquiry_staff' ? process.env.EMAIL_STAFF_ALERT_TO : data.email;
      if (!apiKey || !from || !to) throw new Error('configuration_missing');
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'idempotency-key': `${id}:${channel}`,
        },
        body: JSON.stringify(
          channel === 'resend.enquiry_staff'
            ? {
                from,
                to: [to],
                subject: `New CERA Medical enquiry: ${data.reference}`,
                text: `Reference: ${data.reference}\nName: ${data.name}\nEmail: ${data.email}\nService: ${data.serviceId}\n\n${data.message}`,
              }
            : {
                from,
                to: [to],
                subject: `CERA Medical enquiry received: ${data.reference}`,
                text: `Hello ${data.name},\n\nWe received your enquiry (${data.reference}) about ${data.serviceId}. Our team will review it and contact you.\n\nCERA Medical`,
              },
        ),
        signal: AbortSignal.timeout(8000),
      }).then((response) => {
        if (!response.ok) throw new Error(`resend_http_${response.status}`);
      });
    } else {
      throw new Error('unsupported_delivery_channel');
    }
    await db
      .prepare(
        `UPDATE integration_deliveries SET status = 'succeeded', last_error = NULL, updated_at = ?
      WHERE aggregate_id = ? AND channel = ?`,
      )
      .bind(Math.floor(Date.now() / 1000), id, channel)
      .run();
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 200) : 'delivery_failed';
    await db
      .prepare(
        `UPDATE integration_deliveries SET status = 'failed', last_error = ?, updated_at = ?
      WHERE aggregate_id = ? AND channel = ?`,
      )
      .bind(reason, Math.floor(Date.now() / 1000), id, channel)
      .run();
  }
}

function accepted(reference: string, status: number) {
  return json(
    CreateEnquiryResponseSchema.parse({
      reference,
      submittedAt: new Date().toISOString(),
      message:
        'We received your enquiry. The team will review it and respond using the address provided.',
    }),
    status,
  );
}
function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function randomReferenceSuffix(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  return Array.from(
    crypto.getRandomValues(new Uint8Array(5)),
    (value) => alphabet[value & 31],
  ).join('');
}
