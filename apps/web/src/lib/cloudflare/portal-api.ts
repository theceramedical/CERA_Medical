import { customerOrderPaymentLabel, toCustomerEnquiry, type InternalStatus } from '@cera/contracts';

import { CloudflareApiError } from './api-error.ts';
import { getCloudflareDatabase } from './runtime.ts';

import type { WebSession } from '../auth/session.ts';

export async function handleCloudflarePortalApi(
  path: string,
  method: string,
  body: unknown,
  session: WebSession,
): Promise<Record<string, unknown> | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  const needsVerifiedEmail =
    path.startsWith('/v1/me/orders') ||
    path.startsWith('/v1/me/enquiries') ||
    path.startsWith('/v1/enquiries/claim/');
  if (!session.roles.includes('customer') || (needsVerifiedEmail && !session.emailVerified))
    throw new CloudflareApiError('Forbidden', 403);
  if (path === '/v1/me/profile' && method === 'GET') {
    const profile = await db
      .prepare('SELECT full_name AS displayName, phone FROM customer_profiles WHERE user_id = ?')
      .bind(session.sub)
      .first<{ displayName: string; phone: string | null }>();
    return {
      displayName: profile?.displayName ?? session.email.split('@')[0] ?? 'Customer',
      phone: profile?.phone ?? null,
      email: session.email,
    };
  }
  if (
    path === '/v1/me/profile' &&
    method === 'PATCH' &&
    isRecord(body) &&
    typeof body.displayName === 'string'
  ) {
    const displayName = body.displayName.trim();
    const phone = typeof body.phone === 'string' && body.phone ? body.phone : null;
    if (
      !displayName ||
      displayName.length > 120 ||
      (phone && (!/^[0-9+() .-]*$/.test(phone) || phone.length > 32))
    )
      throw new CloudflareApiError('Validation failed', 400);
    await db
      .prepare(
        `INSERT INTO customer_profiles (id, user_id, email, full_name, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch()) ON CONFLICT(user_id) DO UPDATE SET
      email = excluded.email, full_name = excluded.full_name, phone = excluded.phone, updated_at = unixepoch()`,
      )
      .bind(crypto.randomUUID(), session.sub, session.email.toLowerCase(), displayName, phone)
      .run();
    return { displayName, phone, email: session.email };
  }
  if (path === '/v1/me/enquiries' && method === 'GET') {
    await db
      .prepare(
        `UPDATE enquiries SET customer_user_id = ? WHERE customer_user_id IS NULL AND lower(email) = lower(?)`,
      )
      .bind(session.sub, session.email)
      .run();
    const rows = await db
      .prepare(
        `SELECT * FROM enquiries WHERE customer_user_id = ? ORDER BY created_at DESC LIMIT 100`,
      )
      .bind(session.sub)
      .all<EnquiryRow>();
    return {
      items: await Promise.all((rows.results ?? []).map((row) => customerEnquiry(db, row))),
    };
  }
  const enquiryMatch = /^\/v1\/me\/enquiries\/([^/]+)$/.exec(path);
  if (enquiryMatch?.[1] && method === 'GET') {
    const row = await db
      .prepare('SELECT * FROM enquiries WHERE reference = ? AND customer_user_id = ?')
      .bind(decodeURIComponent(enquiryMatch[1]), session.sub)
      .first<EnquiryRow>();
    return row ? customerEnquiry(db, row) : null;
  }
  if (path === '/v1/me/orders' && method === 'GET') {
    const rows = await db
      .prepare(
        `SELECT * FROM commerce_orders WHERE customer_user_id = ? OR
      (customer_user_id IS NULL AND lower(customer_email) = lower(?)) ORDER BY created_at DESC LIMIT 100`,
      )
      .bind(session.sub, session.email)
      .all<OrderRow>();
    return { items: await Promise.all((rows.results ?? []).map((row) => customerOrder(db, row))) };
  }
  const orderMatch = /^\/v1\/me\/orders\/([^/]+)$/.exec(path);
  if (orderMatch?.[1] && method === 'GET') {
    const row = await db
      .prepare(
        `SELECT * FROM commerce_orders WHERE order_code = ? AND (customer_user_id = ? OR
      (customer_user_id IS NULL AND lower(customer_email) = lower(?)))`,
      )
      .bind(decodeURIComponent(orderMatch[1]), session.sub, session.email)
      .first<OrderRow>();
    return row ? customerOrder(db, row) : null;
  }
  if (path === '/v1/enquiries/claim/request' && method === 'POST') {
    const hash = await sha256(session.email.toLowerCase());
    const matches = await db
      .prepare(
        `SELECT id FROM enquiries WHERE customer_user_id IS NULL AND lower(email) = lower(?) LIMIT 20`,
      )
      .bind(session.email)
      .all<{ id: string }>();
    if (
      (matches.results?.length ?? 0) > 0 &&
      (!process.env.NEXT_PUBLIC_SITE_URL ||
        !process.env.RESEND_API_KEY ||
        !process.env.RESEND_FROM_EMAIL)
    ) {
      throw new CloudflareApiError('Claim email delivery is not configured', 503);
    }
    let issued = 0;
    for (const enquiry of matches.results ?? []) {
      const token = randomToken();
      const tokenHash = await sha256(token);
      await db
        .prepare(
          `INSERT INTO enquiry_claim_tokens (token_hash, enquiry_id, email_hash, expires_at)
        VALUES (?, ?, ?, ?)`,
        )
        .bind(tokenHash, enquiry.id, hash, Math.floor(Date.now() / 1000) + 1800)
        .run();
      const base = process.env.NEXT_PUBLIC_SITE_URL;
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM;
      if (base && apiKey && from) {
        const link = new URL(`/account/claim?token=${encodeURIComponent(token)}`, base).toString();
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [session.email],
            subject: 'Claim your CERA Medical enquiry',
            text: `Use this one-time link within 30 minutes to link your enquiry to your account: ${link}`,
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new CloudflareApiError('Claim email could not be sent', 503);
        issued++;
      }
    }
    return { issued };
  }
  if (
    path === '/v1/enquiries/claim/consume' &&
    method === 'POST' &&
    isRecord(body) &&
    typeof body.token === 'string'
  ) {
    const tokenHash = await sha256(body.token);
    const hash = await sha256(session.email.toLowerCase());
    const token = await db
      .prepare(
        `SELECT enquiry_id FROM enquiry_claim_tokens WHERE token_hash = ? AND email_hash = ?
      AND expires_at > ? AND consumed_at IS NULL`,
      )
      .bind(tokenHash, hash, Math.floor(Date.now() / 1000))
      .first<{ enquiry_id: string }>();
    if (!token) throw new CloudflareApiError('Not found', 404);
    await db.batch([
      db
        .prepare(
          'UPDATE enquiries SET customer_user_id = ?, updated_at = unixepoch() WHERE id = ? AND customer_user_id IS NULL',
        )
        .bind(session.sub, token.enquiry_id),
      db
        .prepare(
          'UPDATE enquiry_claim_tokens SET consumed_at = ?, consumed_by = ? WHERE token_hash = ? AND consumed_at IS NULL',
        )
        .bind(Math.floor(Date.now() / 1000), session.sub, tokenHash),
    ]);
    return { claimed: true };
  }
  return null;
}

async function customerEnquiry(
  db: NonNullable<Awaited<ReturnType<typeof getCloudflareDatabase>>>,
  row: EnquiryRow,
) {
  const events = await db
    .prepare(
      'SELECT to_status AS newStatus, created_at FROM enquiry_status_events WHERE enquiry_id = ? ORDER BY created_at',
    )
    .bind(row.id)
    .all<{ newStatus: InternalStatus; created_at: number }>();
  const createdAt = new Date(row.created_at * 1000).toISOString();
  return toCustomerEnquiry(
    {
      id: row.id,
      reference: row.reference,
      customerSubjectId: row.customer_user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      institution: row.organisation,
      country: row.country,
      serviceId: row.service_slug,
      message: row.summary,
      consentAt: createdAt,
      consentVersion: row.consent_version,
      sequencingDataConsent: Boolean(row.sequencing_data_consent),
      samplesCompoundsConsent: Boolean(row.samples_compounds_consent),
      healthDataConsent: Boolean(row.health_data_consent),
      updatesOptIn: Boolean(row.updates_opt_in),
      source: row.source as 'web_general' | 'web_service_page' | 'web_contact_page',
      internalStatus: normaliseStatus(row.internal_status),
      ownerId: row.assigned_staff_id,
      createdAt,
      updatedAt: new Date(row.updated_at * 1000).toISOString(),
    },
    row.service_slug,
    (events.results ?? []).map((event) => ({
      newStatus: event.newStatus,
      createdAt: new Date(event.created_at * 1000).toISOString(),
    })),
  );
}
async function customerOrder(
  db: NonNullable<Awaited<ReturnType<typeof getCloudflareDatabase>>>,
  row: OrderRow,
) {
  const items = await db
    .prepare(
      'SELECT sku, title, quantity, total_minor AS lineTotalMinor FROM commerce_order_items WHERE order_id = ? ORDER BY created_at',
    )
    .bind(row.id)
    .all<{ sku: string; title: string; quantity: number; lineTotalMinor: number }>();
  const method =
    row.payment_method === 'CASH_ON_DELIVERY' ? 'cod' : row.payment_method.toLowerCase();
  return {
    orderCode: row.order_code,
    placedAt: new Date(row.created_at * 1000).toISOString(),
    paymentMethod: method,
    paymentLabel: customerOrderPaymentLabel(method as 'cod'),
    currencyCode: row.currency,
    totalMinor: row.total_amount_minor,
    lines: (items.results ?? []).map((item) => ({
      slug: item.sku,
      title: item.title,
      quantity: item.quantity,
      lineTotalMinor: item.lineTotalMinor,
    })),
  };
}
interface EnquiryRow {
  id: string;
  reference: string;
  customer_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  country: string | null;
  service_slug: string;
  summary: string;
  consent_version: string;
  sequencing_data_consent: number;
  samples_compounds_consent: number;
  health_data_consent: number;
  updates_opt_in: number;
  source: string;
  internal_status: string;
  assigned_staff_id: string | null;
  created_at: number;
  updated_at: number;
}
interface OrderRow {
  id: string;
  order_code: string;
  payment_method: string;
  currency: string;
  total_amount_minor: number;
  created_at: number;
}
function normaliseStatus(value: string): InternalStatus {
  const legacy: Record<string, InternalStatus> = {
    TRIAGED: 'triaging',
    UNDER_REVIEW: 'in_progress',
    PROTOCOL_DRAFTED: 'in_progress',
    CLOSED: 'completed',
  };
  return legacy[value] ?? (value.toLowerCase() as InternalStatus);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
async function sha256(value: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}
