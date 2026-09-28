import { randomUUID } from 'node:crypto';

import { toZohoLeadPayload } from '@cera/contracts';

import type { CrmPort, EmailPort, Enquiry } from '@cera/contracts';

import { backoffMs } from './claim.ts';

import type { Pool } from 'pg';

interface Job {
  id: string;
  aggregate_id: string;
  event_type: string;
  attempts: number;
  payload: { token?: string };
}
export function outboxDrainer(
  pool: Pool,
  email: EmailPort,
  crm: CrmPort,
  onError: (error: unknown) => void,
) {
  const workerId = `worker-${randomUUID()}`;
  let stopped = false;
  async function sweep(): Promise<void> {
    // A crashed process cannot strand work indefinitely.
    await pool.query(
      `UPDATE outbox SET status='pending',locked_at=NULL,locked_by=NULL WHERE status='in_flight' AND locked_at < now()-interval '5 minutes'`,
    );
    const batch = await pool.query<Job>(
      `WITH eligible AS (SELECT id FROM outbox WHERE status='pending' AND available_at<=now() ORDER BY available_at LIMIT 10 FOR UPDATE SKIP LOCKED) UPDATE outbox o SET status='in_flight',locked_at=now(),locked_by=$1 FROM eligible WHERE o.id=eligible.id RETURNING o.*`,
      [workerId],
    );
    for (const job of batch.rows) {
      if (stopped) {
        await pool.query(
          `UPDATE outbox SET status='pending',locked_at=NULL,locked_by=NULL WHERE id=$1 AND locked_by=$2`,
          [job.id, workerId],
        );
        continue;
      }
      await deliver(job);
    }
  }
  async function deliver(job: Job): Promise<void> {
    if (job.event_type === 'enquiry.created') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const event of [
          'erpnext.lead.upsert',
          'resend.customer.receipt',
          'resend.staff.alert',
        ]) {
          const existing = await client.query(
            'SELECT 1 FROM outbox WHERE aggregate_id=$1 AND event_type=$2 LIMIT 1',
            [job.aggregate_id, event],
          );
          if (!existing.rowCount)
            await client.query(
              'INSERT INTO outbox (id,aggregate_id,event_type,payload) VALUES ($1,$2,$3,$4)',
              [
                randomUUID(),
                job.aggregate_id,
                event,
                JSON.stringify({ enquiryId: job.aggregate_id }),
              ],
            );
        }
        await client.query(
          "UPDATE outbox SET status='done',last_error=NULL,locked_at=NULL,locked_by=NULL WHERE id=$1 AND locked_by=$2",
          [job.id, workerId],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        onError(error);
      } finally {
        client.release();
      }
      return;
    }
    if (
      ![
        'erpnext.lead.upsert',
        'resend.customer.receipt',
        'resend.staff.alert',
        'resend.customer.claim',
        'resend.status.update',
      ].includes(job.event_type)
    ) {
      await pool.query(
        "UPDATE outbox SET status='dead_letter',last_error='unsupported_event',locked_at=NULL,locked_by=NULL WHERE id=$1 AND locked_by=$2",
        [job.id, workerId],
      );
      return;
    }
    const provider = job.event_type.startsWith('erpnext.') ? 'erpnext' : 'resend';
    const event =
      job.event_type === 'resend.customer.claim' ? 'resend.customer.receipt' : job.event_type;
    const key = job.id;
    try {
      const ledger = await pool.query<{ status: string }>(
        `INSERT INTO integration_deliveries (id,enquiry_id,provider,event_type,idempotency_key,attempt,status) VALUES ($1,$2,$3,$4,$5,$6,'in_flight') ON CONFLICT (idempotency_key) DO UPDATE SET attempt=$6,status=CASE WHEN integration_deliveries.status='succeeded' THEN 'succeeded'::delivery_status ELSE 'in_flight'::delivery_status END,updated_at=now() RETURNING status`,
        [key, job.aggregate_id, provider, event, key, job.attempts + 1],
      );
      if (ledger.rows[0]?.status !== 'succeeded') {
        const result = await pool.query<{
          id: string;
          reference: string;
          customer_subject_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          service_id: string;
          message: string;
          consent_at: Date;
          source: Enquiry['source'];
          internal_status: Enquiry['internalStatus'];
          owner_id: string | null;
          created_at: Date;
          updated_at: Date;
        }>('SELECT * FROM enquiries WHERE id=$1', [job.aggregate_id]);
        const r = result.rows[0];
        if (!r) throw new Error('enquiry_missing');
        let externalId: string;
        if (provider === 'erpnext') {
          const e: Enquiry = {
            id: r.id,
            reference: r.reference,
            customerSubjectId: r.customer_subject_id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            serviceId: r.service_id,
            message: r.message,
            consentAt: r.consent_at.toISOString(),
            source: r.source,
            internalStatus: r.internal_status,
            ownerId: r.owner_id,
            createdAt: r.created_at.toISOString(),
            updatedAt: r.updated_at.toISOString(),
          };
          externalId = (
            await crm.upsertLead(
              toZohoLeadPayload(e, { title: r.service_id.replaceAll('-', ' ') }),
              key,
            )
          ).externalId;
        } else {
          const staff = job.event_type === 'resend.staff.alert';
          const to = staff ? process.env.EMAIL_STAFF_ALERT_TO : r.email;
          if (!to) throw new Error('staff_recipient_missing');
          const suppressed = await pool.query<{ present: number }>(
            'SELECT 1 FROM email_suppressions WHERE email=lower($1)',
            [to],
          );
          if (suppressed.rowCount) throw new Error('recipient_suppressed');
          const link = job.payload.token
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/account/claim?token=${encodeURIComponent(job.payload.token)}`
            : null;
          const text = link
            ? `Claim enquiry ${r.reference}: ${link}`
            : staff
              ? `New enquiry ${r.reference}. Sign in to the staff portal to review it.`
              : `We received your enquiry ${r.reference}. Our team will contact you shortly.`;
          externalId = (
            await email.send({
              to,
              subject: link ? 'Claim your CERA enquiry' : `CERA enquiry ${r.reference}`,
              text,
              html: `<p>${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`,
              idempotencyKey: key,
            })
          ).id;
        }
        await pool.query(
          `UPDATE integration_deliveries SET status='succeeded',external_id=$2,error_class=NULL,updated_at=now() WHERE id=$1`,
          [key, externalId],
        );
      }
      // Clear the bearer claim token after delivery; only its hash persists.
      await pool.query(
        `UPDATE outbox SET status='done',locked_at=NULL,locked_by=NULL,payload=jsonb_build_object('enquiryId',aggregate_id) WHERE id=$1 AND locked_by=$2`,
        [job.id, workerId],
      );
    } catch (error) {
      const attempts = job.attempts + 1;
      const dead = attempts >= 8;
      const classification =
        error instanceof Error && /^[a-z_]+(?:_\d+)?$/.test(error.message)
          ? error.message
          : 'provider_failed';
      await pool.query(
        `UPDATE integration_deliveries SET status=$2,attempt=$3,error_class=$4,updated_at=now() WHERE id=$1`,
        [key, dead ? 'dead_letter' : 'failed', attempts, classification],
      );
      await pool.query(
        `UPDATE outbox SET status=$2,attempts=$3,last_error=$4,available_at=$5,locked_at=NULL,locked_by=NULL WHERE id=$1 AND locked_by=$6`,
        [
          job.id,
          dead ? 'dead_letter' : 'pending',
          attempts,
          classification,
          new Date(Date.now() + Math.max(1000, backoffMs(attempts))),
          workerId,
        ],
      );
      onError(new Error(classification));
    }
  }
  let active: Promise<void> | null = null;
  const tick = () => {
    if (stopped || active) return;
    active = sweep()
      .catch(onError)
      .finally(() => {
        active = null;
      });
  };
  const timer = setInterval(tick, 1000);
  tick();
  return {
    async close() {
      stopped = true;
      clearInterval(timer);
      await active;
    },
    async health() {
      const result = await pool.query<{
        depth: number;
        deadLetterCount: number;
        oldestPendingAgeSeconds: number;
      }>(
        `SELECT count(*) FILTER (WHERE status IN ('pending','in_flight'))::int AS depth, count(*) FILTER (WHERE status='dead_letter')::int AS "deadLetterCount", COALESCE(EXTRACT(epoch FROM now()-min(created_at) FILTER (WHERE status='pending')),0)::float AS "oldestPendingAgeSeconds" FROM outbox`,
      );
      return result.rows[0];
    },
  };
}
