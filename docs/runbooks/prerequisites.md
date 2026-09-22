# Prerequisite register

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
| Hetzner projects for CX33 staging and CX43 production; SSH key owners                                                                    | Before Day 1            | Not available | Local Docker Compose with the identical container topology                                                                       | Phase 13     |
| R2, Resend, Zoho, and backup accounts owned by CERA                                                                                      | Before Day 2            | Not available | MinIO for R2, Mailpit for Resend, in-memory fake for Zoho                                                                        | Phase 10     |
| Approved logo, brand assets, service list, service copy, display pricing, contact details, privacy and terms drafts, launch blog content | Before Day 3            | Not available | Copy transcribed from the approved reference image, every record marked `__fixture` and labelled "pending CERA content approval" | Phase 15     |
| Written approval of data fields, consent text, retention, customer-safe statuses, Zoho field mapping, and email wording                  | Before Day 4            | Not available | Proposed defaults in `.planning/data-contracts.md`, flagged for approval                                                         | Phase 15 UAT |

## Why this does not block delivery

Every stand-in sits behind an adapter interface, so switching to the real service is an environment
change rather than a code change:

| Capability          | Interface      | Local driver              | Live driver                      |
| ------------------- | -------------- | ------------------------- | -------------------------------- |
| Object storage      | `StoragePort`  | MinIO over the S3 API     | Cloudflare R2 over the S3 API    |
| Transactional email | `EmailPort`    | Mailpit over SMTP         | Resend                           |
| CRM                 | `CrmPort`      | In-memory fake            | Zoho CRM v8                      |
| Identity            | OIDC discovery | Local Authentik container | Staging and production Authentik |

A conformance test suite runs against every driver, so a passing local test is meaningful rather than
a test of the fake alone.

## Blocker assessment

- **Phases 01 to 12:** no blocker. All are deliverable and verifiable on the local stack.
- **Phase 13:** deliverable as validated configuration plus a full rehearsal on local Compose,
  including a timed backup restore. Only the target host is absent.
- **Phase 15:** deliverable as rehearsed release and rollback, complete runbooks, and self-run UAT
  scripts. Signatures and the production host require CERA.

Outstanding items are tracked in the open-items register produced by Phase 15, each naming the
specific input required to close it.

## What must happen when the real accounts arrive

Ordered, because several steps depend on the one before:

1. CERA creates the GitHub organisation with two MFA owners, then the private `cera-platform`
   repository. Apply the rulesets recorded in `docs/runbooks/github-rulesets.md`.
2. Cloudflare: add the domain, create the subdomains, and issue a DNS-edit-scoped token for Caddy's
   DNS-01 challenge.
3. Hetzner: provision CX33 and CX43, register SSH key owners, enable daily backups and deletion
   protection. Attached volumes need a separate backup method - Hetzner server backups and snapshots
   do not include them.
4. R2: create separate staging and production buckets with `Object Read & Write` tokens scoped to a
   single bucket each, plus a custom delivery domain. Do not use the `r2.dev` development URL in
   production.
5. Resend: verify a sending subdomain, publish DKIM and SPF records, and create sending-access keys
   per environment plus a webhook signing secret.
6. Zoho: complete the OAuth self-client flow, confirm the data-centre domain, and - on Enterprise or
   Ultimate - create the `External_Lead_ID` external field through the UI. Absent that field the
   adapter falls back to `Email` deduplication with no code change.
7. Authentik: create the production OAuth2 provider and application with strict redirect URIs, the
   seven groups, the `groups` scope mapping, and the MFA validation stage.
8. Populate the GitHub staging and production environment secrets. Production secrets must remain
   unavailable until approval is recorded.
9. Run the first production deployment through `release.yml` against an approved `v*` tag.
10. Rotate every secret after developer handover, as PRD 15 requires.
