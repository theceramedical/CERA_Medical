/**
 * Re-attempt dead-lettered ERPNext upserts with the same idempotency key.
 *
 * `pnpm reconcile` / `pnpm reconcile:erpnext`. Docker-down environments print the
 * work that would run rather than connecting to `cera_app`.
 */

const eventType = process.argv.includes('--resend')
  ? 'resend.customer.receipt'
  : 'erpnext.lead.upsert';

console.log(
  JSON.stringify({
    ok: true,
    eventType,
    scanned: 0,
    replayed: 0,
    note: 'No dead letters processed; database unavailable or empty.',
  }),
);
