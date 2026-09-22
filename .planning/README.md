# CERA Medical Platform - Delivery Planning

This directory is the executable breakdown of `CERA_Full_Platform_Product_Requirements_Document.pdf`
into sequenced, independently verifiable phases.

Read this file first, then the four reference documents, then the phase documents in order.

## Reference documents

| Document                                 | Purpose                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [design-language.md](design-language.md) | Colour, typography, spacing, and component specification derived from the approved reference image. **This supersedes PRD branding.** |
| [architecture.md](architecture.md)       | Container topology, port and subdomain map, environment matrix, data-flow diagrams                                                    |
| [data-contracts.md](data-contracts.md)   | The eight PRD entities, error envelope, status machines, customer-safe projections                                                    |
| [adr/](adr/)                             | Architecture decision records ADR-001 to ADR-007                                                                                      |

## Phase documents

Phases run in order. A phase may not begin until every phase it depends on has met its exit gate.

| Phase | Document                                                                       | PRD feature IDs                              | Depends on |
| ----- | ------------------------------------------------------------------------------ | -------------------------------------------- | ---------- |
| 00    | [phase-00-readiness.md](phase-00-readiness.md)                                 | (Phase 0 Readiness)                          | -          |
| 01    | [phase-01-foundation.md](phase-01-foundation.md)                               | FND-001, FND-002, FND-004, FND-005           | 00         |
| 02    | [phase-02-contracts.md](phase-02-contracts.md)                                 | FND-003                                      | 01         |
| 03    | [phase-03-design-system.md](phase-03-design-system.md)                         | WEB-301, QA-1102                             | 01         |
| 04    | [phase-04-web-shell-homepage.md](phase-04-web-shell-homepage.md)               | WEB-301                                      | 03         |
| 05    | [phase-05-payload-cms.md](phase-05-payload-cms.md)                             | CMS-101, CMS-102                             | 02         |
| 06    | [phase-06-vendure-catalogue.md](phase-06-vendure-catalogue.md)                 | CAT-201                                      | 02         |
| 07    | [phase-07-public-content-seo.md](phase-07-public-content-seo.md)               | WEB-302, WEB-303                             | 04, 05, 06 |
| 08    | [phase-08-enquiry-core.md](phase-08-enquiry-core.md)                           | ENQ-401, ENQ-402, ENQ-403                    | 02, 04, 06 |
| 09    | [phase-09-identity-rbac.md](phase-09-identity-rbac.md)                         | AUTH-501, AUTH-502                           | 01, 02     |
| 10    | [phase-10-integrations.md](phase-10-integrations.md)                           | INT-801, INT-802, INT-803                    | 08         |
| 11    | [phase-11-customer-portal.md](phase-11-customer-portal.md)                     | CUS-601, CUS-602                             | 08, 09     |
| 12    | [phase-12-staff-operations.md](phase-12-staff-operations.md)                   | OPS-701, OPS-702                             | 08, 09     |
| 13    | [phase-13-edge-deploy-observability.md](phase-13-edge-deploy-observability.md) | INF-901, INF-902, INF-903, INF-904, OBS-1001 | 01, 09     |
| 14    | [phase-14-quality-security.md](phase-14-quality-security.md)                   | QA-1101, QA-1102                             | 04-13      |
| 15    | [phase-15-release-handover.md](phase-15-release-handover.md)                   | REL-1101, REL-1102, DOC-1201                 | 14         |

## Traceability matrix

Every deliverable unit in PRD section 6 maps to exactly one owning phase. The acceptance
statement in the PRD is reproduced verbatim as that phase's exit gate for the feature.

| PRD ID   | Feature                                    | PRD phase | Owning phase here |
| -------- | ------------------------------------------ | --------- | ----------------- |
| FND-001  | Repository and monorepo foundation         | 1         | 01                |
| FND-002  | Local service stack                        | 1         | 01                |
| FND-003  | Shared contracts and fixtures              | 1         | 02                |
| FND-004  | Continuous integration checks              | 1         | 01                |
| FND-005  | Environment contract                       | 1         | 01                |
| CMS-101  | Payload content models                     | 2         | 05                |
| CMS-102  | Editorial approval workflow                | 2         | 05                |
| CAT-201  | Vendure service catalogue                  | 2         | 06                |
| WEB-301  | Public website foundation                  | 2         | 03, 04            |
| WEB-302  | Public content pages                       | 2         | 07                |
| WEB-303  | Search and discoverability                 | 2         | 07                |
| ENQ-401  | Secure enquiry submission                  | 2         | 08                |
| ENQ-402  | Enquiry experience                         | 2         | 08                |
| ENQ-403  | Enquiry status model                       | 2         | 08                |
| AUTH-501 | Authentik identity provider                | 3         | 09                |
| AUTH-502 | Role based access control                  | 3         | 09                |
| CUS-601  | Customer account and enquiry claiming      | 3         | 11                |
| CUS-602  | Customer dashboard                         | 3         | 11                |
| OPS-701  | Operations enquiry queue                   | 3         | 12                |
| OPS-702  | Internal notes and audit history           | 3         | 12                |
| INT-801  | Zoho CRM synchronisation                   | 3         | 10                |
| INT-802  | Resend transactional email                 | 3         | 10                |
| INT-803  | Cloudflare R2 media storage                | 3         | 10                |
| INF-901  | Caddy and Cloudflare edge                  | 3         | 13                |
| INF-902  | Staging deployment                         | 3         | 13                |
| INF-903  | Production deployment                      | 4         | 13, 15            |
| INF-904  | Backup and restore                         | 3         | 13                |
| OBS-1001 | Monitoring and error reporting             | 3         | 13                |
| QA-1101  | Automated release test suite               | 4         | 14                |
| QA-1102  | Accessibility and performance verification | 4         | 03, 14            |
| REL-1101 | CERA user acceptance testing               | 4         | 15                |
| REL-1102 | Release and rollback                       | 4         | 15                |
| DOC-1201 | Operations handover                        | 4         | 15                |

## Status legend

Work packages inside each phase document use GitHub task list syntax.

- `- [ ]` not started
- `- [x]` complete, with verification evidence recorded in the phase document
- `- [~]` blocked; the blocker and its owner are named inline

## Standing constraints

These apply to every phase without restatement.

1. **Server-side authorisation only.** Hiding UI is never authorisation (PRD 1.2). Every protected
   route re-derives the caller's role and record ownership on the server.
2. **No clinical data.** Name, email, phone, selected service, message, consent, source, ownership,
   status, and audit metadata only (PRD 3.3). No health history, no document upload.
3. **No secrets in the repository.** Only `.env.example` with placeholder values (PRD 15).
4. **Customer-safe projections.** Internal notes, staff-only statuses, CRM identifiers, and owner
   identities never appear in a customer or public response (PRD 8).
5. **Durable external calls.** Zoho and Resend are invoked through the outbox, never inline in a
   request path (PRD 8.1).
6. **Synthetic test data only.** No production record is ever copied to local or staging (PRD 16.1).
7. **Accessibility target WCAG 2.2 AA** on all public and customer routes (PRD 10).
8. **Reference image is the design authority** for colour and typography, over the PRD.

## Confirmed delivery decisions

| Decision               | Value                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Design source of truth | Approved reference image; see [design-language.md](design-language.md)                                                                    |
| Typography             | Source Sans 3 (UI and headings), Montserrat (`CERA` wordmark only)                                                                        |
| External vendors       | Sandbox-first. MinIO stands in for R2, Mailpit for Resend, a fake driver for Zoho. Real credentials drop into `.env` with no code change. |
| Git remote             | None. Local repository only; CI workflow files are authored and committed but not pushed.                                                 |
| Node runtime           | 24.21.0 LTS, pinned by `.nvmrc`, `engines`, and the container base image                                                                  |
| Version discipline     | Every dependency version is verified against the npm registry, not recalled, and lives in the `catalog:` block of `pnpm-workspace.yaml`   |
