import { randomUUID } from 'node:crypto';

import { hashToken, toCustomerStatus } from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import { recordAudit, recordEvent, transaction } from '../enquiry/postgres-store.ts';

import { emailHashOf } from './store.ts';

import type { ClaimToken, PortalEnquiry, PortalProfile, PortalStore } from './store.ts';
import type { Pool } from 'pg';

export function postgresPortalStore(pool: Pool): PortalStore {
  const list = async (where = '', values: unknown[] = []): Promise<PortalEnquiry[]> => {
    const result = await pool.query(
      `SELECT e.*, ARRAY(SELECT body FROM internal_notes WHERE enquiry_id=e.id ORDER BY created_at) AS notes FROM enquiries e ${where} ORDER BY e.created_at DESC LIMIT 500`,
      values,
    );
    return result.rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      reference: String(r.reference),
      name: String(r.name),
      email: String(r.email),
      emailHash: emailHashOf(String(r.email)),
      serviceId: String(r.service_id),
      serviceTitle: String(r.service_id).replaceAll('-', ' '),
      phone: r.phone == null ? null : (r.phone as string),
      institution: r.institution == null ? null : (r.institution as string),
      country: r.country == null ? null : (r.country as string),
      consentVersion: String(r.consent_version),
      sequencingDataConsent: r.sequencing_data_consent === true,
      samplesCompoundsConsent: r.samples_compounds_consent === true,
      healthDataConsent: r.health_data_consent === true,
      updatesOptIn: r.updates_opt_in === true,
      message: String(r.message),
      internalStatus: r.internal_status as PortalEnquiry['internalStatus'],
      ownerId: r.owner_id == null ? null : (r.owner_id as string),
      customerSubjectId: r.customer_subject_id == null ? null : (r.customer_subject_id as string),
      notes: r.notes as string[],
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: new Date(String(r.updated_at)).toISOString(),
    }));
  };
  return {
    listAll: () => list(),
    getById: async (id) => (await list('WHERE e.id=$1', [id]))[0] ?? null,
    listForSubject: (subject) => list('WHERE e.customer_subject_id=$1', [subject]),
    getForSubject: async (subject, reference) =>
      (await list('WHERE e.customer_subject_id=$1 AND e.reference=$2', [subject, reference]))[0] ??
      null,
    findUnclaimedByEmailHash: async (hash) =>
      (await list('WHERE e.customer_subject_id IS NULL')).filter((e) => e.emailHash === hash),
    async claim(id, subject) {
      const result = await pool.query(
        `UPDATE enquiries SET customer_subject_id=$2,updated_at=now() WHERE id=$1 AND customer_subject_id IS NULL`,
        [id, subject],
      );
      return result.rowCount === 1;
    },
    async putEnquiry(e, actor) {
      await transaction(pool, async (client) => {
        const result = await client.query('SELECT * FROM enquiries WHERE id=$1 FOR UPDATE', [e.id]);
        const current = result.rows[0] as Record<string, unknown> | undefined;
        if (!current) throw new ApiError('not_found');
        // Do not overwrite another staff member's change from a stale view.
        if (new Date(String(current.updated_at)).toISOString() !== e.updatedAt)
          throw new ApiError('conflict');
        if (e.internalStatus !== current.internal_status) {
          const { assertTransition } = await import('../enquiry/status.ts');
          assertTransition(
            current.internal_status as PortalEnquiry['internalStatus'],
            e.internalStatus,
          );
          const at = new Date().toISOString();
          await recordEvent(
            client,
            {
              enquiryId: e.id,
              previousStatus: current.internal_status as PortalEnquiry['internalStatus'],
              newStatus: e.internalStatus,
              customerStatus: toCustomerStatus(e.internalStatus),
              reason: null,
              createdAt: at,
            },
            { enquiryId: e.id, action: 'enquiry.status.changed', createdAt: at },
            actor ?? null,
          );
        }
        await client.query(
          'UPDATE enquiries SET owner_id=$2,internal_status=$3,updated_at=now(),version=version+1 WHERE id=$1',
          [e.id, e.ownerId, e.internalStatus],
        );
        const count = await client.query<{ count: number }>(
          'SELECT count(*)::int AS count FROM internal_notes WHERE enquiry_id=$1',
          [e.id],
        );
        for (const body of e.notes.slice(Number(count.rows[0]?.count ?? 0))) {
          if (!actor || body.length > 4000) throw new ApiError('validation_failed');
          await client.query(
            'INSERT INTO internal_notes (id,enquiry_id,author_subject_id,body) VALUES ($1,$2,$3,$4)',
            [randomUUID(), e.id, actor, body],
          );
        }
        if (e.internalStatus !== current.internal_status)
          for (const type of ['erpnext.lead.upsert', 'resend.status.update']) {
            await client.query(
              'INSERT INTO outbox (id,aggregate_id,event_type,payload) VALUES ($1,$2,$3,$4)',
              [randomUUID(), e.id, type, JSON.stringify({ enquiryId: e.id })],
            );
          }
        await recordAudit(client, e.id, 'enquiry.updated', actor ?? null);
      });
    },
    async issueClaim(t, raw) {
      await transaction(pool, async (client) => {
        const recent = await client.query(
          'SELECT 1 FROM enquiry_claim_tokens WHERE enquiry_id=$1 AND consumed_at IS NULL AND expires_at>now()',
          [t.enquiryId],
        );
        if (recent.rowCount) return;
        await client.query(
          'INSERT INTO enquiry_claim_tokens (id,enquiry_id,email_hash,token_hash,expires_at) VALUES ($1,$2,$3,$4,$5)',
          [randomUUID(), t.enquiryId, t.emailHash, t.hash, new Date(t.expiresAt)],
        );
        await client.query(
          "INSERT INTO outbox (id,aggregate_id,event_type,payload) VALUES ($1,$2,'resend.customer.claim',$3)",
          [randomUUID(), t.enquiryId, JSON.stringify({ enquiryId: t.enquiryId, token: raw })],
        );
      });
    },
    async putToken(t) {
      await pool.query(
        'INSERT INTO enquiry_claim_tokens (id,enquiry_id,email_hash,token_hash,expires_at) VALUES ($1,$2,$3,$4,$5)',
        [randomUUID(), t.enquiryId, t.emailHash, t.hash, new Date(t.expiresAt)],
      );
    },
    async findToken(hash): Promise<ClaimToken | null> {
      const result = await pool.query<{
        token_hash: string;
        email_hash: string;
        enquiry_id: string;
        expires_at: Date;
        consumed_at: Date | null;
        consumed_by_subject_id: string | null;
      }>('SELECT * FROM enquiry_claim_tokens WHERE token_hash=$1', [hash]);
      const r = result.rows[0];
      return r
        ? {
            hash: r.token_hash,
            emailHash: r.email_hash,
            enquiryId: r.enquiry_id,
            expiresAt: new Date(r.expires_at).getTime(),
            consumedAt: r.consumed_at?.toISOString() ?? null,
            consumedBy: r.consumed_by_subject_id,
          }
        : null;
    },
    async consumeToken(token, subject, emailHash) {
      return transaction(pool, async (client) => {
        const result = await client.query<{ id: string; enquiry_id: string }>(
          `SELECT t.* FROM enquiry_claim_tokens t JOIN enquiries e ON e.id=t.enquiry_id WHERE token_hash=$1 AND email_hash=$2 AND expires_at>now() AND consumed_at IS NULL AND e.customer_subject_id IS NULL FOR UPDATE OF t,e`,
          [hashToken(token), emailHash],
        );
        const t = result.rows[0];
        if (!t) return false;
        await client.query(
          'UPDATE enquiries SET customer_subject_id=$2,updated_at=now() WHERE id=$1',
          [t.enquiry_id, subject],
        );
        await client.query(
          'UPDATE enquiry_claim_tokens SET consumed_at=now(),consumed_by_subject_id=$2 WHERE id=$1',
          [t.id, subject],
        );
        await recordAudit(client, t.enquiry_id, 'enquiry.claimed', subject);
        return true;
      });
    },
    async getProfile(subject): Promise<PortalProfile | null> {
      const result = await pool.query<{
        subject_id: string;
        email: string;
        display_name: string;
        phone: string | null;
      }>('SELECT * FROM customer_profiles WHERE subject_id=$1', [subject]);
      const p = result.rows[0];
      return p
        ? { subjectId: p.subject_id, displayName: p.display_name, phone: p.phone, email: p.email }
        : null;
    },
    async putProfile(p) {
      if (p.displayName.length < 1 || p.displayName.length > 120 || (p.phone?.length ?? 0) > 32)
        throw new ApiError('validation_failed');
      await pool.query(
        `INSERT INTO customer_profiles (subject_id,email,display_name,phone) VALUES ($1,$2,$3,$4) ON CONFLICT (subject_id) DO UPDATE SET display_name=$3,phone=$4,updated_at=now()`,
        [p.subjectId, p.email, p.displayName, p.phone],
      );
    },
    async listAudit(id) {
      return (
        await pool.query<{ action: string; at: Date; actor: string | null }>(
          'SELECT action,created_at AS at,actor_subject_id AS actor FROM audit_events WHERE target_id=$1 ORDER BY created_at',
          [id],
        )
      ).rows;
    },
    async listDeliveries() {
      return (
        await pool.query<Record<string, unknown>>(
          'SELECT id,enquiry_id AS "enquiryId",provider,event_type AS "eventType",status,attempt,error_class AS "lastError",updated_at AS "updatedAt" FROM integration_deliveries ORDER BY updated_at DESC LIMIT 200',
        )
      ).rows;
    },
    async retryDelivery(id, actor) {
      return transaction(pool, async (client) => {
        const result = await client.query<{ aggregate_id: string }>(
          `UPDATE outbox SET status='pending',attempts=0,available_at=now(),last_error=NULL,locked_at=NULL,locked_by=NULL WHERE id=$1 AND status='dead_letter' RETURNING aggregate_id`,
          [id],
        );
        if (!result.rows[0]) return false;
        await client.query(
          `UPDATE integration_deliveries SET status='pending',error_class=NULL,updated_at=now() WHERE id=$1 AND status='dead_letter'`,
          [id],
        );
        await recordAudit(client, result.rows[0].aggregate_id, 'delivery.retried', actor || null);
        return true;
      });
    },
  };
}
