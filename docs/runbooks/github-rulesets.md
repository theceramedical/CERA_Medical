# GitHub rulesets

The exact configuration to apply once CERA supplies the organisation and repository (PRD 22). Recorded
here so the settings are reviewable in version control rather than existing only as clicks in a web UI.

Branching model (PRD 11.2): `main` is production, `develop` is integration, and work happens on
`feat/*`, `fix/*`, or `chore/*` branches merged into `develop`.

## Ruleset: `main`

| Setting                                  | Value              | Why                                                                          |
| ---------------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| Target                                   | `main`             |                                                                              |
| Restrict deletions                       | on                 |                                                                              |
| Restrict force pushes                    | on                 | Force-pushing production history breaks every rollback reference             |
| Require a pull request                   | on                 |                                                                              |
| Required approvals                       | 2                  | PRD 13 requires two reviewers for production                                 |
| Dismiss stale approvals on push          | on                 | An approval describes the code that was reviewed, not the branch name        |
| Require review from Code Owners          | on                 | The paths in `CODEOWNERS` carry security and brand consequences              |
| Require approval of the most recent push | on                 | Prevents self-approving a change added after review                          |
| Require conversation resolution          | on                 |                                                                              |
| Require status checks                    | on - `CI complete` | One aggregate check, so renaming a job cannot silently un-protect the branch |
| Require branches up to date              | on                 | Catches semantic conflicts that merge cleanly but break at runtime           |
| Require signed commits                   | on                 |                                                                              |
| Require linear history                   | on                 | Keeps `git bisect` and rollback comprehensible                               |
| Block force pushes                       | on                 |                                                                              |
| Require deployments to succeed           | staging            | Nothing reaches `main` that has not run on staging                           |

## Ruleset: `develop`

| Setting                         | Value              | Why                                                                       |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| Target                          | `develop`          |                                                                           |
| Restrict deletions              | on                 |                                                                           |
| Restrict force pushes           | on                 |                                                                           |
| Require a pull request          | on                 |                                                                           |
| Required approvals              | 1                  | One reviewer keeps integration moving; `main` requires two                |
| Dismiss stale approvals on push | on                 |                                                                           |
| Require conversation resolution | on                 |                                                                           |
| Require status checks           | on - `CI complete` |                                                                           |
| Require branches up to date     | on                 |                                                                           |
| Require linear history          | off                | Merge commits into `develop` are useful for tracing when a feature landed |

## Ruleset: tag protection

| Setting           | Value              | Why                                                                        |
| ----------------- | ------------------ | -------------------------------------------------------------------------- |
| Target            | tags matching `v*` |                                                                            |
| Restrict creation | maintainers only   | A tag triggers a production deploy, so tag creation is a deploy permission |
| Restrict deletion | on                 | A deleted release tag destroys the rollback target                         |
| Restrict updates  | on                 | A moved tag means the release no longer identifies what was released       |

## Environments

### `staging`

- Deployment branches: `develop` only
- Reviewers: none - staging should be fast
- Secrets: `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`, and staging provider credentials

### `production`

- Deployment branches: protected tags matching `v*` only
- **Required reviewers: 2** - the human gate before production
- Wait timer: 0 - the review is the gate; a timer only adds delay
- Secrets: `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`, and production provider credentials

The environment gate is what actually protects production. Workflow-level checks can be edited by
anyone who can edit a workflow file; an environment reviewer requirement cannot.

## Repository settings

| Setting                                       | Value                                       |
| --------------------------------------------- | ------------------------------------------- |
| Default branch                                | `develop`                                   |
| Allow merge commits                           | on, for `develop`                           |
| Allow squash merging                          | on, default for feature branches            |
| Allow rebase merging                          | off                                         |
| Automatically delete head branches            | on                                          |
| Always suggest updating pull request branches | on                                          |
| Private vulnerability reporting               | on                                          |
| Dependency graph                              | on                                          |
| Dependabot alerts                             | on                                          |
| Dependabot security updates                   | on                                          |
| Secret scanning                               | on                                          |
| Secret scanning push protection               | on                                          |
| Code scanning                                 | on, default setup                           |
| Wikis, Projects, Discussions                  | off - documentation lives in the repository |

## Organisation settings

- Two owners, both with mandatory MFA (PRD 22)
- Require MFA for every member
- Restrict repository creation to owners
- Default member permission: read
- Teams matching `CODEOWNERS`: `@cera-medical/platform`, `@cera-medical/design`, `@cera-medical/security`

`CODEOWNERS` silently ignores a team that does not exist. If these teams are not created, the paths in
that file appear protected while having no owner at all - verify after setup by opening a pull request
touching `packages/ui/src/styles/` and confirming the design team is requested.

## Verification

After applying, prove each control rather than assuming it:

1. Open a pull request into `develop` with a failing test. The merge button must be blocked.
2. Open a pull request touching `packages/ui/src/styles/`. The design team must be auto-requested.
3. Attempt `git push --force origin develop`. It must be rejected.
4. Attempt a direct push to `main`. It must be rejected.
5. Push a `v0.0.1-test` tag from a non-maintainer account. Creation must be rejected.
6. Trigger a production deploy. It must pause for reviewer approval before any secret is exposed.
7. Commit a fake key matching a known provider format. Push protection must block it.

Record the results in the Phase 15 handover. An unverified control is an assumption.
