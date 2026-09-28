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

| PRD prerequisite                                                                                                                         | PRD deadline            | Status        | Stand-in used                                                                                                                    | Required by  |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| GitHub organisation and private repository; two owner accounts with MFA                                                                  | Before repository setup | Not available | Local git repository; workflows authored and committed but not pushed                                                            | Phase 15     |
| Named Product Owner and Content and Clinical Approver with GitHub and email access                                                       | Before Day 1            | Not available | One fixture user per role, wired to the real role matrix                                                                         | Phase 15 UAT |
| Domain and Cloudflare access; approved subdomains for web, admin, auth, status, monitoring                                               | Before Day 1            | Not available | `*.cera.localhost` with local TLS                                                                                                | Phase 13     |
| One production Linux server; SSH key owners                                                                                              | Before Day 1            | Not available | Local Docker Compose with the identical container topology                                                                       | Phase 13     |
| R2 and Resend accounts owned by CERA; ERPNext on the production host                                                                     | Before Day 2            | Not available | MinIO for R2, Mailpit for Resend, in-memory fake for CRM                                                                         | Phase 10     |
| Approved logo, brand assets, service list, service copy, display pricing, contact details, privacy and terms drafts, launch blog content | Before Day 3            | Not available | Copy transcribed from the approved reference image, every record marked `__fixture` and labelled "pending CERA content approval" | Phase 15     |
| Written approval of data fields, consent text, retention, customer-safe statuses, ERPNext field mapping, and email wording               | Before Day 4            | Not available | Proposed defaults in `.planning/data-contracts.md`, flagged for approval                                                         | Phase 15 UAT |

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
- **Phase 13:** deliverable as validated configuration plus a full rehearsal on local Compose,
  including a timed backup restore. Only the production host is absent.
- **Phase 15:** deliverable as rehearsed release and rollback, complete runbooks, and self-run UAT
  scripts. Signatures and the production host require CERA.

Outstanding items are tracked in the open-items register produced by Phase 15, each naming the
specific input required to close it.

## What must happen when the real accounts arrive

Ordered, because several steps depend on the one before:

1. CERA creates the GitHub organisation with two MFA owners, then the private `cera-platform`
   repository. Apply the rulesets recorded in `docs/runbooks/github-rulesets.md`.
2. Cloudflare: add the domain and create the production subdomains.
3. Provision one production Linux server, register SSH key owners, and enable deletion protection.
   Generate an age key pair and retain the private recovery key outside the server. Local encrypted
   database backups do not survive loss of the server.
4. R2: create one production media bucket with an `Object Read & Write` token scoped to that bucket,
   plus a custom delivery domain. Enable bucket versioning. Do not use the `r2.dev` development URL
   in production. The media bucket is not a copy of the server databases.
5. Resend: verify a sending subdomain, publish DKIM and SPF records, and create sending-access keys
   per environment plus a webhook signing secret.
6. ERPNext: deploy the official Frappe Docker stack on the same host, create the CERA Lead custom
   fields and a dedicated API user with Lead read/create/write permission, then configure
   `ERPNEXT_URL`, `ERPNEXT_API_KEY`, and `ERPNEXT_API_SECRET` on the CERA host.
7. Authentik: create the production OAuth2 provider and application with strict redirect URIs, the
   seven groups, the `groups` scope mapping, and the MFA validation stage.
8. Populate the GitHub production environment secrets. Production secrets must remain unavailable
   until approval is recorded. Rehearse migration and encrypted restore against an isolated local copy.
9. Run the first production deployment through `release.yml` against an approved `v*` tag.
10. Rotate every secret after developer handover, as PRD 15 requires.
