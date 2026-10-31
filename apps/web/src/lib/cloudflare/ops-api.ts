import {
  allowedTransitionsFrom,
  evaluateTransition,
  toStaffEnquiry,
  type InternalStatus,
} from '@cera/contracts';

import { rolesIncludeStaff } from '../auth/staff-roles.ts';

import { CloudflareApiError } from './api-error.ts';
import { deliverCloudflareIntegration } from './enquiries.ts';
import { getCloudflareDatabase } from './runtime.ts';

import type { WebSession } from '../auth/session.ts';

const serviceTitles: Record<string, string> = {
  'preclinical-studies': 'Preclinical Studies',
  'molecular-research': 'Molecular Research',
  'metagenomic-data-analysis': 'Metagenomic Data Analysis',
  'biomedical-omics-data-analysis': 'Biomedical and Omics Data Analysis',
  'evidence-synthesis-technical-reports': 'Evidence Synthesis and Technical Reports',
  'biomedical-data-analysis': 'Biomedical Data Analysis',
};

export async function handleCloudflareOpsApi(
  path: string,
  method: string,
  body: unknown,
  session: WebSession,
): Promise<Record<string, unknown> | null> {
  const db = await getCloudflareDatabase();
  if (!db) return null;
  const parts = path
    .replace(/^\/v1\/ops\//, '')
    .split('/')
    .map(decodeURIComponent);
  const staffWriteRoles = ['enquiry_handler', 'operations_manager', 'administrator'];
  const canRetry = session.roles.includes('administrator');
  const canWrite = session.roles.some((role) => staffWriteRoles.includes(role));
  if (
    !rolesIncludeStaff(session.roles) ||
    !session.mfa ||
    (parts[0] === 'deliveries' && parts[2] === 'retry' && !canRetry) ||
    (parts[0] === 'enquiries' &&
      parts.length >= 3 &&
      ['PATCH', 'POST'].includes(method) &&
      !canWrite)
  )
    throw new CloudflareApiError('Forbidden', 403);
  if (parts[0] === 'deliveries') {
    if (parts.length === 3 && parts[2] === 'retry' && method === 'POST') {
      if (!session.roles.includes('administrator')) throw new CloudflareApiError('Forbidden', 403);
      const delivery = await db
        .prepare(
          `SELECT aggregate_id AS aggregateId, channel, payload_json AS payload
        FROM integration_deliveries WHERE id = ? AND status IN ('failed', 'pending')`,
        )
        .bind(parts[1])
        .first<{ aggregateId: string; channel: string; payload: string }>();
      if (!delivery) throw new CloudflareApiError('Not found', 404);
      await deliverCloudflareIntegration(
        db,
        delivery.aggregateId,
        delivery.channel,
        delivery.payload,
      );
      return { retried: true };
    }
    if (method !== 'GET') return { items: [] };
    await db
      .prepare(
        `UPDATE integration_deliveries SET status = 'failed', last_error = 'delivery_timeout', updated_at = unixepoch()
      WHERE status = 'processing' AND updated_at < unixepoch() - 120`,
      )
      .run();
    const rows = await db
      .prepare(
        `SELECT id, aggregate_type AS aggregateType, aggregate_id AS aggregateId,
      channel, status, attempts, last_error AS lastError, created_at AS createdAt, updated_at AS updatedAt
      FROM integration_deliveries ORDER BY created_at DESC LIMIT 200`,
      )
      .all();
    return {
      items: (rows.results ?? []).map((row) => ({
        id: row.id,
        provider: String(row.channel).split('.')[0],
        eventType: row.channel,
        status: row.status === 'failed' ? 'dead_letter' : row.status,
        attempt: row.attempts,
        lastError: row.lastError,
        createdAt: row.createdAt,
      })),
    };
  }
  if (parts[0] !== 'enquiries') return null;
  if (parts.length === 1 && method === 'GET') {
    const rows = await db
      .prepare('SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 250')
      .all<EnquiryRow>();
    return {
      items: await Promise.all((rows.results ?? []).map((row) => projectStaffEnquiry(db, row))),
    };
  }
  const row = parts[1]
    ? await db.prepare('SELECT * FROM enquiries WHERE id = ?').bind(parts[1]).first<EnquiryRow>()
    : null;
  if (!row) return null;
  if (parts.length === 2 && method === 'GET') {
    const status = normaliseStatus(row.internal_status);
    return {
      ...(await projectStaffEnquiry(db, row)),
      permittedNext: allowedTransitionsFrom(status),
    };
  }
  if (parts[2] === 'assign' && method === 'PATCH') {
    await db
      .prepare(`UPDATE enquiries SET assigned_staff_id = ?, updated_at = unixepoch() WHERE id = ?`)
      .bind(session.sub, row.id)
      .run();
    await audit(db, session.sub, row.id, 'enquiry.assigned', { ownerId: session.sub });
    return { assigned: true };
  }
  if (
    parts[2] === 'transition' &&
    method === 'POST' &&
    isRecord(body) &&
    typeof body.status === 'string'
  ) {
    const transition = evaluateTransition(
      normaliseStatus(row.internal_status),
      body.status as InternalStatus,
    );
    if (!transition.ok) throw new CloudflareApiError('Conflict', 409);
    await db.batch([
      db
        .prepare(
          'UPDATE enquiries SET internal_status = ?, updated_at = unixepoch(), version = version + 1 WHERE id = ? AND version = ?',
        )
        .bind(transition.to, row.id, row.version),
      db
        .prepare(
          `INSERT INTO enquiry_status_events (id, enquiry_id, from_status, to_status, actor_user_id, created_at)
        VALUES (?, ?, ?, ?, ?, unixepoch())`,
        )
        .bind(crypto.randomUUID(), row.id, transition.from, transition.to, session.sub),
    ]);
    await audit(db, session.sub, row.id, 'enquiry.status_changed', {
      from: transition.from,
      to: transition.to,
    });
    return { status: transition.to };
  }
  if (parts[2] === 'notes' && method === 'GET') {
    const notes = await db
      .prepare(
        'SELECT body, created_at AS createdAt FROM internal_notes WHERE enquiry_id = ? ORDER BY created_at',
      )
      .bind(row.id)
      .all();
    return { items: notes.results ?? [] };
  }
  if (
    parts[2] === 'notes' &&
    method === 'POST' &&
    isRecord(body) &&
    typeof body.body === 'string' &&
    body.body.trim().length > 0 &&
    body.body.length <= 4000
  ) {
    await db
      .prepare(
        `INSERT INTO internal_notes (id, enquiry_id, author_user_id, body) VALUES (?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), row.id, session.sub, body.body.trim())
      .run();
    await audit(db, session.sub, row.id, 'enquiry.note_added', {});
    return { recorded: true };
  }
  if (parts[2] === 'audit' && method === 'GET') {
    const events = await db
      .prepare(
        `SELECT action, created_at AS at, actor_user_id AS actor FROM audit_events
      WHERE target_type = 'enquiry' AND target_id = ? ORDER BY created_at`,
      )
      .bind(row.id)
      .all();
    return { items: events.results ?? [] };
  }
  return null;
}

async function projectStaffEnquiry(
  db: NonNullable<Awaited<ReturnType<typeof getCloudflareDatabase>>>,
  row: EnquiryRow,
) {
  const [noteCount, owner] = await Promise.all([
    db
      .prepare('SELECT COUNT(*) AS count FROM internal_notes WHERE enquiry_id = ?')
      .bind(row.id)
      .first<{ count: number }>(),
    row.assigned_staff_id
      ? db
          .prepare('SELECT name FROM user WHERE id = ?')
          .bind(row.assigned_staff_id)
          .first<{ name: string }>()
      : null,
  ]);
  const createdAt = new Date(row.created_at * 1000).toISOString();
  return toStaffEnquiry(
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
    {
      serviceTitle: serviceTitles[row.service_slug] ?? row.service_slug,
      ownerDisplayName: owner?.name ?? null,
      noteCount: noteCount?.count ?? 0,
      lastIntegrationStatus: null,
    },
  );
}

async function audit(
  db: NonNullable<Awaited<ReturnType<typeof getCloudflareDatabase>>>,
  actor: string,
  target: string,
  action: string,
  details: unknown,
) {
  await db
    .prepare(
      `INSERT INTO audit_events (id, actor_user_id, action, target_type, target_id, details_json, created_at)
    VALUES (?, ?, ?, 'enquiry', ?, ?, unixepoch())`,
    )
    .bind(crypto.randomUUID(), actor, action, target, JSON.stringify(details))
    .run();
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
  version: number;
  created_at: number;
  updated_at: number;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
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
