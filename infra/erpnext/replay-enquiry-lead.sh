#!/usr/bin/env bash
# Re-queue ERPNext lead upsert for the latest enquiry (fills empty CRM after test data was deleted).
set -euo pipefail
docker exec cera-postgres-1 psql -U cera_app -d cera_app -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO outbox (id, aggregate_id, event_type, payload)
SELECT gen_random_uuid(), e.id, 'erpnext.lead.upsert', json_build_object('enquiryId', e.id)::text
FROM enquiries e
ORDER BY e.created_at DESC
LIMIT 1;
SQL
echo 'Queued erpnext.lead.upsert for latest enquiry. Worker should process within ~15s.'
