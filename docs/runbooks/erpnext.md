# ERPNext CRM on the production server

ERPNext replaces Zoho for lead delivery. It runs as a separate Frappe Docker project on the same
Linux server as CERA. Use the [official Frappe Docker production setup](https://github.com/frappe/frappe_docker/blob/main/docs/getting-started.md),
including its MariaDB and Redis overrides. Add `/opt/cera/infra/erpnext/compose.cera.yaml` as the
last Compose file. It connects only the Frappe frontend to `cera_cera-public` with the
`erpnext-frontend` network alias. CERA's Caddy serves it at `https://crm.<CERA_DOMAIN>`; do not
publish Frappe's port directly. Start the CERA Compose project once before Frappe Docker so the
external network exists. The ERPNext site is named `cera-production`, independent of the public
domain. Set `FRAPPE_SITE_NAME=cera-production` and
`FRAPPE_SITE_NAME_HEADER=cera-production` in Frappe Docker's `.env` so both Caddy and the internal
worker select that site when the public `crm.<CERA_DOMAIN>` address is added.

ERPNext has its own MariaDB, Redis, workers, scheduler, site files, and migrations. Allocate enough
memory and disk for both stacks. Check actual load on the chosen server before accepting enquiries.
The host checkout is pinned to Frappe Docker `v3.2.2` (`3061850feface8fbbad15b5dc08a110c596107cb`)
at `/opt/frappe_docker`; its `.env` pins `ERPNEXT_VERSION=v16.34.2`. Review upgrades explicitly;
do not automatically pull `latest` during CERA releases.

## Lead fields and API access

In ERPNext, use **Customize Form** for the `Lead` DocType and add these fields with these exact
fieldnames:

| Fieldname               | Type       | Setting                                 |
| ----------------------- | ---------- | --------------------------------------- |
| `custom_cera_reference` | Data       | Unique; required for CERA-created leads |
| `custom_cera_service`   | Data       | Service title                           |
| `custom_cera_status`    | Data       | Customer-safe status                    |
| `custom_cera_message`   | Small Text | Customer's enquiry message              |
| `custom_cera_country`   | Data       | Optional country supplied with enquiry  |
| `custom_cera_source`    | Data       | Website page where the enquiry started  |

Create a dedicated ERPNext integration user and give it only Lead read, create, and write access.
Generate an API key and secret for that user. In `/opt/cera/.env`, set `CRM_DRIVER=erpnext`,
`ERPNEXT_URL=http://erpnext-frontend:8080`, `ERPNEXT_API_KEY`, and `ERPNEXT_API_SECRET`. Do not put
the secret in Git or in a chat message. The worker authenticates with Frappe's `token key:secret`
header, looks up the unique reference, then creates or updates the Lead. It sends the customer's
message but never CERA internal notes or the staff owner ID.

Run `/opt/cera/infra/erpnext/provision.sh` after the Frappe site is created. It idempotently creates
the fields, the restricted `CERA Integration` role, and the system user, then stores the generated
credentials in `/opt/cera/.erpnext-credentials` with mode 600. Re-running it preserves the existing
credentials. The integration user and CERA Lead fields are provisioned on the live VPS. On 2026-10-03,
`bash /opt/cera/infra/erpnext/verify_api.sh` successfully created and read a synthetic Lead with
the CERA custom fields, then removed it and its temporary credential files. Re-run after release
to verify the deployed worker end to end.

Before launch, submit a synthetic enquiry and confirm one ERPNext Lead appears with the same
reference, service, status, and message. Retry the job and confirm it updates the same Lead.
Then change its status in the CERA staff portal and confirm ERPNext's customer-safe status changes.
Check the CERA delivery ledger for `succeeded` and ensure no ERPNext job remains pending or dead.

## Local-only backups

CERA's `backup.sh` saves encrypted dumps of its five PostgreSQL databases on the one server. It
does **not** include ERPNext's MariaDB database or Frappe site files. On 2026-10-03, the Hetzner
host already had `cera-erpnext-backup.timer` enabled and active, with seven encrypted archives; the
latest was `/opt/cera/backups/erpnext/erpnext-20261003T031834Z.tar.age`. The systemd service and
timer files are `infra/systemd/cera-erpnext-backup.service` and `.timer`. The script uses
Frappe's `bench --site cera-production backup --with-files --compress`, verifies that database,
configuration, public-files, and private-files artifacts were produced, and encrypts them with the
same age public key as CERA's PostgreSQL backups. Store that public key and the retention setting in
`/opt/cera/.backup.env` (mode 600); the private identity stays outside the VPS. The script removes
its temporary plaintext artifacts from the ERPNext container after encryption.

Before launch, decrypt one archive with the external age identity in an **isolated** restore
environment, inspect its four artifacts, and rehearse `bench --site <rehearsal-site> restore` with
the database and file archives. This restore rehearsal remains pending. Never restore into the live production site as a rehearsal. With no
off-site backup, loss of the server can destroy both CERA and ERPNext data and their local backups.
R2 media versioning does not protect either database.
