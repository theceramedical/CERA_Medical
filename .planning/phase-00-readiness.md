# Phase 00 - Readiness

**PRD mapping:** Phase 0 Readiness (PRD section 5)
**Depends on:** nothing
**Exit condition (PRD):** "No external-access blocker remains; CERA names Product Owner and Content
and Clinical Approver."

## Objective

Make the machine capable of building the stack, and record every decision that later phases assume,
so no phase stops to negotiate a choice that should already be settled.

## Work packages

### WP-00.1 Runtime toolchain

- [x] Verify Docker Desktop is running and Compose v2 is available
- [x] Install Node 24 LTS via the already-present nvm for Windows and make it the active version
- [x] Confirm `corepack` activates pnpm 10
- [x] Record the exact versions of node, pnpm, docker, compose, git, and gh in the decision log

Recorded: Node 24.21.0, pnpm 10.28.2, Docker 28.5.1, Compose v2.40.3, git 2.41.0, gh 2.68.1. The
machine started on Node 22.22.0.

### WP-00.1a Dependency version verification

- [x] Query every intended dependency against the npm registry rather than relying on recall, and
      record the result in the workspace `catalog:`

This step exists because it immediately found an error: an earlier research pass reported that Payload
required Node 24.15+, while `npm view payload engines` returns `^18.20.2 || >=20.9.0`. Node 24 is still
the choice, on LTS grounds, but the justification changed. Two version holds were also identified -
TypeScript at 6.0.3 and ESLint at 9.39.5, both because `typescript-eslint` 8.70 does not yet support
the next major of either. See [ADR-002](adr/ADR-002-node-24-payload-3x.md).

### WP-00.2 Decision log and ADRs

- [ ] Confirm all seven ADRs in [adr/](adr/) are written and internally consistent
- [ ] Record the confirmed delivery decisions: design authority, fonts, sandbox-first externals, local
      git only

### WP-00.3 Prerequisite register

PRD 22 lists items CERA must supply. None is available in a sandbox-first build, so each is recorded
with the stand-in that unblocks delivery and the point at which the real item must arrive.

- [ ] Author `docs/runbooks/prerequisites.md` with the register below

| PRD prerequisite                                                                                              | Status        | Stand-in used                                                  | Needed before |
| ------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------- | ------------- |
| GitHub org and private repo, two owners with MFA                                                              | Not available | Local git repository                                           | Phase 15      |
| Named Product Owner and Content and Clinical Approver                                                         | Not available | Fixture users per role                                         | Phase 15 UAT  |
| Domain and Cloudflare access, approved subdomains                                                             | Not available | `*.cera.localhost`                                             | Phase 13      |
| Hetzner CX33 and CX43 projects, SSH key owners                                                                | Not available | Local Compose                                                  | Phase 13      |
| R2, Resend, Zoho, backup accounts                                                                             | Not available | MinIO, Mailpit, fake Zoho driver                               | Phase 10      |
| Logo, brand assets, service copy, pricing, policies, blog content                                             | Not available | Reference-image copy, marked `__fixture`                       | Phase 15      |
| Written approval of data fields, consent text, retention, customer-safe statuses, Zoho mapping, email wording | Not available | Proposed defaults in `data-contracts.md`, flagged for approval | Phase 15 UAT  |

Every stand-in sits behind an adapter interface, so the real credential is a `.env` change.

### WP-00.4 Blocker register

- [ ] Record that no prerequisite blocks Phases 01 to 12, and that Phase 13 and 15 have
      infrastructure-dependent steps which will be delivered as validated configuration plus a
      rehearsal on local Compose rather than on Hetzner

## Verification

```bash
node -v          # expect v24.x, >= 24.15
pnpm -v          # expect 10.x
docker compose version
git --version && gh --version
```

## Exit gate

- [ ] Node 24 active and verified
- [ ] Docker and Compose responding
- [ ] Seven ADRs written
- [ ] Prerequisite register authored with a stand-in and a deadline for every missing item
- [ ] No blocker for Phases 01 to 12
