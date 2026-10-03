import { randomUUID } from 'node:crypto';

import type {
  EnquiryStore,
  EnquiryWrite,
  StoredEnquiry,
  StatusEventRow,
  AuditEventRow,
} from './store.ts';
import type { Pool, PoolClient } from 'pg';

export async function transaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function recordEvent(
  client: PoolClient,
  event: StatusEventRow,
  audit: AuditEventRow,
  actor: string | null = null,
): Promise<void> {
  await client.query(
    `INSERT INTO enquiry_status_events (id,enquiry_id,previous_status,new_status,customer_status,reason,created_at,actor_subject_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      randomUUID(),
      event.enquiryId,
      event.previousStatus,
      event.newStatus,
      event.customerStatus,
      event.reason,
      event.createdAt,
      actor,
    ],
  );
  await recordAudit(client, audit.enquiryId, audit.action, actor, audit.createdAt);
}

export async function recordAudit(
  client: PoolClient,
  id: string,
  action: string,
  actor: string | null,
  at = new Date().toISOString(),
): Promise<void> {
  await client.query(
    `INSERT INTO audit_events (id,actor_subject_id,action,target_type,target_id,request_id,created_at) VALUES ($1,$2,$3,'enquiry',$4,$5,$6)`,
    [randomUUID(), actor, action, id, randomUUID(), at],
  );
}

// Explicit projection keeps internal database columns out of HTTP responses.
function project(row: Record<string, unknown>): StoredEnquiry {
  const date = (v: unknown) => new Date(String(v)).toISOString();
  return {
    id: String(row.id),
    reference: String(row.reference),
    name: String(row.name),
    email: String(row.email),
    institution: row.institution == null ? null : (row.institution as string),
    country: row.country == null ? null : (row.country as string),
    phone: row.phone == null ? null : (row.phone as string),
    source: row.source as StoredEnquiry['source'],
    serviceId: String(row.service_id),
    message: String(row.message),
    fingerprint: String(row.fingerprint),
    idempotencyKey: row.idempotency_key == null ? null : (row.idempotency_key as string),
    createdAt: date(row.created_at),
    consentAt: date(row.consent_at),
    consentVersion: String(row.consent_version),
    sequencingDataConsent: row.sequencing_data_consent === true,
    samplesCompoundsConsent: row.samples_compounds_consent === true,
    healthDataConsent: row.health_data_consent === true,
    updatesOptIn: row.updates_opt_in === true,
    internalStatus: row.internal_status as StoredEnquiry['internalStatus'],
    ownerId: row.owner_id == null ? null : (row.owner_id as string),
    notes: [],
    version: Number(row.version),
  };
}

export function postgresEnquiryStore(pool: Pool): EnquiryStore {
  const find = async (column: string, value: string) => {
    const result = await pool.query(`SELECT * FROM enquiries WHERE ${column}=$1`, [value]);
    return result.rows[0] === undefined ? null : project(result.rows[0] as Record<string, unknown>);
  };
  return {
    findByIdempotency: (key) => find('idempotency_key', key),
    findByFingerprint: (key) => find('fingerprint', key),
    findById: (id) => find('id', id),
    async insert(write: EnquiryWrite) {
      await transaction(pool, async (client) => {
        const e = write.enquiry;
        await client.query(
          `INSERT INTO enquiries (id,reference,name,email,phone,institution,country,service_id,message,consent_at,consent_version,sequencing_data_consent,samples_compounds_consent,health_data_consent,updates_opt_in,source,internal_status,created_at,updated_at,fingerprint,idempotency_key,version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$18,$19,$20,$21)`,
          [
            e.id,
            e.reference,
            e.name,
            e.email,
            e.phone,
            e.institution,
            e.country,
            e.serviceId,
            e.message,
            e.consentAt,
            e.consentVersion,
            e.sequencingDataConsent,
            e.samplesCompoundsConsent,
            e.healthDataConsent,
            e.updatesOptIn,
            e.source,
            e.internalStatus,
            e.createdAt,
            e.fingerprint,
            e.idempotencyKey,
            e.version,
          ],
        );
        await recordEvent(client, write.statusEvent, write.auditEvent);
        // Spam stays in the audit trail but never generates outbound messages.
        if (e.internalStatus !== 'rejected_spam')
          for (const row of write.outbox) {
            await client.query(
              `INSERT INTO outbox (id,aggregate_id,event_type,payload) VALUES ($1,$2,$3,$4)`,
              [
                randomUUID(),
                row.enquiryId,
                row.eventType,
                JSON.stringify({ enquiryId: row.enquiryId }),
              ],
            );
          }
      });
    },
    async saveTransition(e, event, audit) {
      return transaction(pool, async (client) => {
        const result = await client.query(
          `UPDATE enquiries SET internal_status=$2,version=version+1,updated_at=$3 WHERE id=$1 AND version=$4`,
          [e.id, e.internalStatus, event.createdAt, e.version - 1],
        );
        if (result.rowCount !== 1) return false;
        await recordEvent(client, event, audit);
        return true;
      });
    },
    async listStatusEvents(id) {
      const result = await pool.query(
        `SELECT enquiry_id AS "enquiryId",previous_status AS "previousStatus",new_status AS "newStatus",customer_status AS "customerStatus",reason,created_at AS "createdAt" FROM enquiry_status_events WHERE enquiry_id=$1 ORDER BY created_at`,
        [id],
      );
      return result.rows.map((row: StatusEventRow) => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString(),
      }));
    },
  };
}
