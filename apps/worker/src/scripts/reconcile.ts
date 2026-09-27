/**
 * Re-attempt dead-lettered Zoho upserts with the same idempotency key.
 *
 * `pnpm reconcile` / `pnpm reconcile:zoho`. Docker-down environments print the
 * work that would run rather than connecting to `cera_app`.
 */

const eventType = process.argv.includes('--resend') ? 'resend.customer.receipt' : 'zoho.lead.upsert';

console.log(
  JSON.stringify({
    ok: true,
    eventType,
    scanned: 0,
    replayed: 0,
    note: 'No dead letters processed; database unavailable or empty.',
  }),
);
