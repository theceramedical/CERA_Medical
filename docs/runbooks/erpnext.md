# ERPNext CRM on the production server

ERPNext replaces Zoho for lead delivery. It runs as a separate Frappe Docker project on the same
Linux server as CERA. Use the [official Frappe Docker production setup](https://github.com/frappe/frappe_docker/blob/main/docs/getting-started.md),
including its MariaDB and Redis overrides. Add `/opt/cera/infra/erpnext/compose.cera.yaml` as the
last Compose file. It connects only the Frappe frontend to `cera_cera-public` with the
`erpnext-frontend` network alias. CERA's Caddy serves it at `https://crm.<CERA_DOMAIN>`; do not
publish Frappe's port directly. Start the CERA Compose project once before Frappe Docker so the
external network exists. Create the ERPNext site as `crm.<CERA_DOMAIN>` and set Frappe Docker's
`FRAPPE_SITE_NAME_HEADER=crm.<CERA_DOMAIN>` so both Caddy and the internal worker select that site.

ERPNext has its own MariaDB, Redis, workers, scheduler, site files, and migrations. Allocate enough
memory and disk for both stacks. Check actual load on the chosen server before accepting enquiries.
Keep Frappe Docker at a reviewed version; do not automatically pull `latest` during CERA releases.

## Lead fields and API access

In ERPNext, use **Customize Form** for the `Lead` DocType and add these fields with these exact
fieldnames:

| Fieldname               | Type       | Setting                                 |
| ----------------------- | ---------- | --------------------------------------- |
| `custom_cera_reference` | Data       | Unique; required for CERA-created leads |
| `custom_cera_service`   | Data       | Service title                           |
| `custom_cera_status`    | Data       | Customer-safe status                    |
| `custom_cera_message`   | Small Text | Customer's enquiry message              |

Create a dedicated ERPNext integration user and give it only Lead read, create, and write access.
Generate an API key and secret for that user. In `/opt/cera/.env`, set `CRM_DRIVER=erpnext`,
`ERPNEXT_URL=http://erpnext-frontend:8080`, `ERPNEXT_API_KEY`, and `ERPNEXT_API_SECRET`. Do not put
the secret in Git or in a chat message. The worker authenticates with Frappe's `token key:secret`
header, looks up the unique reference, then creates or updates the Lead. It sends the customer's
message but never CERA internal notes or the staff owner ID.

Before launch, submit a synthetic enquiry and confirm one ERPNext Lead appears with the same
reference, service, status, and message. Retry the job and confirm it updates the same Lead.
Then change its status in the CERA staff portal and confirm ERPNext's customer-safe status changes.
Check the CERA delivery ledger for `succeeded` and ensure no ERPNext job remains pending or dead.

## Local-only backups

CERA's `backup.sh` saves encrypted dumps of its five PostgreSQL databases on the one server. It
does **not** include ERPNext's MariaDB database or Frappe site files. Configure an ERPNext-local
`bench backup --with-files` schedule under Frappe Docker and rehearse restoring it into an isolated
local copy before launch. With no off-site backup, loss of the server can destroy both CERA and
ERPNext data and their local backups. R2 media versioning does not protect either database.
