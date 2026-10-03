# Prerequisite register

Deployment decision (28 September 2026): CERA will use one production server, no staging server,
and no off-site database backup. Production retains encrypted backups on that server only.
Local integration tests and an isolated restore rehearsal precede the first production release.
Loss of the server can mean permanent loss of its databases and local backup files.

Implements PRD section 22. Every item CERA must supply, the stand-in used so delivery is not blocked,
and the phase by which the real item is required.

**Verified toolchain (2026-09-21)**

| Tool           | Version       |
| -------------- | ------------- |
| Node.js        | 24.21.0 (LTS) |
| pnpm           | 10.28.2       |
| Docker Engine  | 28.5.1        |
| Docker Compose | v2.40.3       |
| git            | 2.41.0        |
| GitHub CLI     | 2.68.1        |

## CERA prerequisites

| PRD prerequisite                                                            | PRD deadline            | Status          | Stand-in used                                                                                                                                                                                       | Required by               |
| --------------------------------------------------------------------------- | ----------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| GitHub repository visibility, owner MFA, and deploy permissions             | Before repository setup | Partially ready | `theceramedical/CERA_Medical` is private and `saadkhan2003` has write access; production deployment secrets exist, but `PRODUCTION_MEDIA_URL` is missing                                            | Before production push    |
| Named Product Owner and Content and Clinical Approver                       | Before Day 1            | Pending         | User will provide business content and final approval                                                                                                                                               | Before public launch      |
| Domain and Cloudflare access; approved production subdomains                | Before Day 1            | Partially ready | `ceramedical.org` uses Cloudflare nameservers and has a Resend DKIM TXT record; on 2026-10-03 the apex had no A answer and `www`, `api`, `admin`, `catalogue`, `auth`, and `crm` were NXDOMAIN      | Before DNS cutover        |
| One production Linux server; verified SSH key owners                        | Before Day 1            | Provisioned     | Hetzner `178.105.73.48`; SSH host key verified; Ubuntu 26.04, 4 vCPU, 8 GiB RAM, 75 GiB disk; CERA is not deployed                                                                                  | Before production release |
| R2 media account, Resend credentials, ERPNext                               | Before Day 2            | Partially ready | ERPNext is running on VPS; CERA fields and restricted API identity are provisioned; synthetic API create/read test passed on 2026-10-03; R2 token and Resend API/webhook credentials remain pending | Before live integration   |
| Error monitoring, alert destination, and retention policy                   | Before production       | Pending         | `GLITCHTIP_DSN` is optional in app code, but no monitoring service/account or alert route is configured                                                                                             | Before production release |
| Approved brand assets, service copy, contact, privacy/terms, images         | Before Day 3            | Partially ready | Client content document supplied; contact is `theceramedica@gmail.com`; approved logo/photos and business sign-off remain pending                                                                   | Before public launch      |
| Approval of data fields, consent, retention, CRM mapping, and email wording | Before Day 4            | Pending         | Consent implemented from client draft; legal terms, retention and operational wording need approval                                                                                                 | Before production release |

## Why this does not block delivery

Every stand-in sits behind an adapter interface, so switching to the real service is an environment
change rather than a code change:

| Capability          | Interface      | Local driver              | Live driver                   |
| ------------------- | -------------- | ------------------------- | ----------------------------- |
| Object storage      | `StoragePort`  | MinIO over the S3 API     | Cloudflare R2 over the S3 API |
| Transactional email | `EmailPort`    | Mailpit over SMTP         | Resend                        |
| CRM                 | `CrmPort`      | In-memory fake            | ERPNext Lead REST API         |
| Identity            | OIDC discovery | Local Authentik container | Production Authentik          |

A conformance test suite runs against every driver, so a passing local test is meaningful rather than
a test of the fake alone.

## Blocker assessment

- **Phases 01 to 12:** no blocker. All are deliverable and verifiable on the local stack.
- **Phase 13:** the production VPS is provisioned and its SSH identity verified. DNS, secrets,
  production configuration, encrypted local backups, and a restore rehearsal remain.
- **Phase 15:** release/rollback runbooks and self-run UAT scripts are present. Business/legal
  approval, repository access, provider credentials, and production verification remain.

Outstanding items are tracked in the open-items register produced by Phase 15, each naming the
specific input required to close it.

## What must happen when the real accounts arrive

Ordered, because several steps depend on the one before:

1. The repository is confirmed private and `saadkhan2003` has write access. The owner still needs to review branch protection and keep production deployment under owner control; `PRODUCTION_MEDIA_URL` is missing from the production environment.
2. Cloudflare: confirm `ceramedical.org` ownership and create production subdomains; point them to
   the VPS only after its production stack is ready.
3. Confirm VPS account recovery, SSH key owners, and deletion protection before release.
   Generate an age key pair and retain the private recovery key outside the server. Local encrypted
   database backups do not survive loss of the server.
4. If media uploads are enabled at launch, create one production R2 bucket with an `Object Read & Write` token scoped to that bucket,
   plus a custom delivery domain. Enable bucket versioning. Do not use the `r2.dev` development URL
   in production. The media bucket is not a copy of the server databases.
5. Resend: user reports domain setup; verify the sending subdomain, DKIM and SPF records, then
   create a sending key and webhook secret. Keep `theceramedica@gmail.com` as the public contact
   until the domain sender is ready and approved.
6. ERPNext: the Frappe Docker stack is running on the host. CERA Lead fields and the dedicated
   least-privilege integration user are provisioned; a synthetic Lead create/read test passed and
   removed its record on 2026-10-03. Configure the existing mode-600 credentials in the CERA host
   environment once `/opt/cera/.env` is created; also rehearse ERPNext encrypted backup and restore.
7. Authentik: create the production OAuth2 provider and application with strict redirect URIs, the
   seven groups, the `groups` scope mapping, and the MFA validation stage.
8. Populate the GitHub production environment secrets. Production secrets must remain unavailable
   until approval is recorded. Rehearse migration and encrypted restore against an isolated local copy.
9. Resolve the monitoring provider/account, set its DSN and alert route, then have the repository owner manually start `release.yml` from `main` for the first production deployment.
10. Rotate every secret after developer handover, as PRD 15 requires.
