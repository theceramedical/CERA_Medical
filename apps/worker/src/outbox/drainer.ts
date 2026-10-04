import { randomUUID } from 'node:crypto';

import { toCrmLeadFromCommerceOrder, toCrmLeadPayload } from '@cera/contracts';
import { z } from 'zod';

import type { CrmPort, EmailPort, Enquiry } from '@cera/contracts';

import { backoffMs } from './claim.ts';

import type { Pool } from 'pg';

interface Job {
  id: string;
  aggregate_id: string;
  event_type: string;
  attempts: number;
  payload: { token?: string; orderId?: string; customerName?: string };
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
    if (job.event_type === 'erpnext.order.upsert') {
      try {
        const orderId = job.payload.orderId;
        if (orderId === undefined) throw new Error('order_id_missing');
        const result = await pool.query<{
          order_code: string;
          customer_email: string;
          payment_method: string;
          currency_code: string;
          total_minor: number;
          lines: unknown;
        }>('SELECT * FROM commerce_orders WHERE id=$1', [orderId]);
        const row = result.rows[0];
        if (row === undefined) throw new Error('order_missing');
        const lines = z
          .array(
            z.object({
              title: z.string(),
              quantity: z.number(),
              lineTotalMinor: z.number(),
            }),
          )
          .parse(row.lines);
        const paymentMethod = z.enum(['cod', 'safepay', 'test']).parse(row.payment_method);
        const customerName =
          typeof job.payload.customerName === 'string' && job.payload.customerName.length > 0
            ? job.payload.customerName
            : 'Customer';
        await crm.upsertLead(
          toCrmLeadFromCommerceOrder({
            orderCode: row.order_code,
            customerEmail: row.customer_email,
            customerName,
            paymentMethod,
            currencyCode: row.currency_code,
            totalMinor: row.total_minor,
            lines,
          }),
          job.id,
        );
        await pool.query(
          "UPDATE outbox SET status='done',last_error=NULL,locked_at=NULL,locked_by=NULL WHERE id=$1 AND locked_by=$2",
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
          `UPDATE outbox SET status=$2,attempts=$3,last_error=$4,available_at=$5,locked_at=NULL,locked_by=NULL WHERE id=$1 AND locked_by=$6`,
          [
            job.id,
            dead ? 'dead_letter' : 'pending',
            attempts,
            classification,
            new Date(Date.now() + backoffMs(attempts)),
            workerId,
          ],
        );
        onError(error);
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
          institution: string | null;
          country: string | null;
          service_id: string;
          message: string;
          consent_at: Date;
          consent_version: string;
          sequencing_data_consent: boolean;
          samples_compounds_consent: boolean;
          health_data_consent: boolean;
          updates_opt_in: boolean;
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
            institution: r.institution,
            country: r.country,
            serviceId: r.service_id,
            message: r.message,
            consentAt: r.consent_at.toISOString(),
            consentVersion: r.consent_version,
            sequencingDataConsent: r.sequencing_data_consent,
            samplesCompoundsConsent: r.samples_compounds_consent,
            healthDataConsent: r.health_data_consent,
            updatesOptIn: r.updates_opt_in,
            source: r.source,
            internalStatus: r.internal_status,
            ownerId: r.owner_id,
            createdAt: r.created_at.toISOString(),
            updatedAt: r.updated_at.toISOString(),
          };
          externalId = (
            await crm.upsertLead(
              toCrmLeadPayload(e, { title: r.service_id.replaceAll('-', ' ') }),
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
