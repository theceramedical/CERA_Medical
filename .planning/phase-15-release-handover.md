# Phase 15 - Release, runbooks and handover

**PRD mapping:** REL-1101, REL-1102, DOC-1201, and the release half of INF-903
**Depends on:** Phase 14
**PRD acceptance:**

| ID       | Acceptance statement                                                                                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| REL-1101 | Every launch-blocking defect is closed; lower-priority defects have an owner and accepted follow-up date; approvals are recorded. |
| REL-1102 | The release checklist, change log, rollback reference, and ownership handover are complete.                                       |
| DOC-1201 | A named CERA owner can execute routine content and enquiry tasks without developer assistance.                                    |

## Objective

Make the release executable by someone who did not build it, and the platform operable by CERA without
a developer.

This phase deliberately separates what can be completed now from what requires CERA. Every artefact is
delivered and rehearsed; the signatures and the production host are the remaining inputs, and they are
named rather than assumed.

## Work packages

### WP-15.1 Release mechanics

- [ ] `release/vX.Y.Z` branch and tag flow scripted exactly as PRD 20.1, so the sequence is not retyped
      from memory under pressure
- [ ] Annotated, signed tags, with a tag ruleset restricting `v*` creation to release maintainers
- [ ] Change log generated from Conventional Commits, grouped by type, with PRD feature IDs resolved so a
      reader sees features rather than commit subjects
- [ ] `docs/runbooks/release.md` - the full checklist from pre-flight through post-deploy monitoring
- [ ] A **rehearsed release** on local Compose: tag, promote by digest, migrate, deploy, smoke-test, and
      record - proving the path rather than describing it

### WP-15.2 Rollback

- [ ] `docs/runbooks/rollback.md` implementing PRD 20.2: stop on any failure, restore the recorded
      digest, prefer a forward database correction unless the migration explicitly supports reversal,
      then verify web, APIs, workers, login, enquiry, database, Zoho queue, Resend queue, and monitoring
- [ ] A **rehearsed rollback**: deploy a deliberately broken image, confirm health checks fail, confirm
      automatic restoration of the previous digest, and record wall-clock recovery time
- [ ] An incident record template capturing timeline, symptoms, impact, decision, commands, digest,
      database action, and follow-up issue
- [ ] Severity classification per PRD 17: Sev 1 unavailable or data exposure, Sev 2 critical function
      impaired, Sev 3 limited defect, Sev 4 minor - with Sev 1 triggering rollback or containment before
      any further feature work

### WP-15.3 Hotfix path

- [ ] `docs/runbooks/hotfix.md` implementing PRD 20.3, including the second pull request back to
      `develop` so a production fix is never lost from the next release
- [ ] A rehearsed hotfix on the local repository, proving the branch topology behaves

### WP-15.4 Runbooks

Written for an operator who was not present during the build.

- [ ] `deploy.md`, `rollback.md`, `hotfix.md`, `backup-restore.md`, `incident.md`, `access.md`
- [ ] `content-operations.md` - create, edit, preview, request approval, publish, unpublish, restore a
      version, and upload media with alt text
- [ ] `enquiry-operations.md` - filter the queue, assign, transition, add a note, read audit history,
      retry a failed delivery, and interpret a bounce or complaint
- [ ] `service-catalogue.md` - add and edit a service, set availability text, toggle enquiry eligibility,
      and publish or unpublish
- [ ] `monitoring.md` - read GlitchTip, interpret each alert, and escalate
- [ ] `vendor-credentials.md` - the register PRD 15 requires: owner, purpose, environment, created date,
      rotation date, and revocation procedure, **recording no value**
- [ ] `going-live.md` - the ordered list of what must happen when the real accounts arrive: Cloudflare
      DNS, Hetzner provisioning, R2 buckets and tokens, Resend domain verification, Zoho OAuth and the
      UI-created External field, Authentik production client, GitHub org and rulesets, secret population,
      and first production deploy
- [ ] Every runbook validated by following it literally on the local stack and fixing every step that
      assumed knowledge

### WP-15.5 UAT

- [ ] `docs/uat/` scripts per PRD 16's UAT row: content approval, service management, visitor flow,
      customer flow, operations flow, CRM, email, and release approval
- [ ] Each script as numbered steps with an explicit expected result and a pass, fail, or blocked field,
      written in CERA's language rather than in implementation terms
- [ ] A seeded UAT environment on local Compose with an account per role
- [ ] A defect register classifying each finding as launch-blocking or follow-up, with an owner and a
      date (REL-1101)
- [ ] An approval record capturing CERA Product Owner UAT approval and Technical Release Approver
      technical approval, with the PRD 21 constraint that a deployment initiator cannot approve their own
      deployment
- [ ] A self-run pass of every script, with results recorded, so CERA receives a validated script rather
      than a first draft

### WP-15.6 Definition of done

- [ ] `docs/definition-of-done.md` reproducing PRD 21 as a checklist, with each item resolved against
      recorded evidence
- [ ] A launch checklist covering the tag, image digest, deployment record, smoke evidence, backup status,
      monitoring release annotation, and rollback target
- [ ] A traceability report walking all 30 PRD feature IDs to their acceptance evidence, so a reviewer can
      confirm coverage without reading every phase document

### WP-15.7 Handover

- [ ] `docs/handover.md` - architecture summary, what is where, how to operate it, who owns what, and the
      known limitations
- [ ] ADRs copied from `.planning/adr/` to `docs/adr/`
- [ ] An access-transfer checklist: CERA holds every vendor account, developer access is reduced to what
      support requires, and every secret is rotated after handover as PRD 15 requires
- [ ] An **open-items register** stating plainly what is not done and why, so nothing is discovered later:

| Open item                           | Reason                                                          | Needed from CERA                                |
| ----------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Production deployment to Hetzner    | No Hetzner account in a sandbox-first build                     | CX43 project and SSH key owner                  |
| Live Cloudflare DNS and R2 buckets  | No Cloudflare account                                           | Domain and account access                       |
| Zoho External field                 | Creatable only through the Zoho UI, Enterprise or Ultimate only | Administrator action, or accept `Email` dedupe  |
| Resend verified sending domain      | No Resend account                                               | DKIM and SPF records published                  |
| GitHub org, rulesets, environments  | No org; local git only                                          | Org with two MFA owners                         |
| CERA content approval               | Reference-image copy is placeholder                             | Approved copy, pricing, policies, blog content  |
| Legal, clinical, and privacy review | Explicitly outside scope per PRD 3.2                            | CERA counsel and clinical approver              |
| Named approvers and signatures      | Roles unfilled                                                  | Product Owner and Content and Clinical Approver |

- [ ] A recorded walkthrough script covering the content and enquiry tasks DOC-1201 names

## Verification

```bash
./infra/scripts/release-rehearsal.sh          # tag, promote, migrate, deploy, smoke
./infra/scripts/rollback.sh --rehearse        # timed, automatic restoration
pnpm smoke
cat docs/uat/results.md
cat docs/definition-of-done.md
```

## Exit gate

- [ ] REL-1102: the release checklist, change log, rollback reference, and ownership handover are complete,
      and both the release and the rollback have been rehearsed with recorded timings
- [ ] DOC-1201: the content and enquiry runbooks were followed literally by someone working only from the
      documentation, and every gap found was fixed
- [ ] REL-1101 (deliverable portion): UAT scripts authored, self-run, and recorded; the defect register
      exists with owners and dates; the approval record is prepared for signature
- [ ] The traceability report resolves all 30 PRD feature IDs to evidence
- [ ] The open-items register names every outstanding dependency and its owner
- [ ] No secret in the repository, and the credential register records owners and rotation without values

## What cannot be completed in this build

Stated plainly rather than marked done:

- **Production deployment to Hetzner** (INF-903 execution) - the pipeline, scripts, approval gates, and
  rollback are delivered and rehearsed locally; only the target host is absent.
- **CERA UAT sign-off** (REL-1101 approval) - scripts and environment are delivered and self-verified;
  the signatures require the named CERA roles to exist.
- **Legal, medical-device, privacy, and healthcare certification** - explicitly excluded by PRD 3.2 and
  CERA's responsibility.

Each is in the open-items register with the specific input required to close it.
