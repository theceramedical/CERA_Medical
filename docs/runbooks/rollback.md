# Rollback

Stop on the first failed health check.

1. Do not continue the rollout.
2. Restore the recorded previous digest with `infra/scripts/rollback.sh`.
3. Prefer a forward database correction. Reverse a migration only when that migration says it is reversible.
4. Verify web, API, worker, sign-in, enquiry submission, database, ERPNext queue, Resend queue, and monitoring.
5. Record the recovery time.
