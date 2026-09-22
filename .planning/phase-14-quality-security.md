# Phase 14 - Quality, security and accessibility gates

**PRD mapping:** QA-1101, QA-1102
**Depends on:** Phases 04 to 13
**PRD acceptance:**

| ID      | Acceptance statement                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------ |
| QA-1101 | Required checks pass from a clean clone; failures are reproducible locally; test fixtures contain no real customer data. |
| QA-1102 | Automated checks pass and manual keyboard, focus, screen-reader smoke, mobile, and slow-network checks are recorded.     |

## Objective

Prove the release. Every earlier phase tested its own slice; this phase runs the complete suite from a
clean clone, closes the manual checks that automation cannot cover, and reviews the whole surface
against OWASP Top 10 2025.

## Work packages

### WP-14.1 Test suite completion

Against the layer table in PRD 16.

- [ ] **Unit** - validation, status mapping, permission helpers, idempotency keys, content transforms,
      redaction, reference generation, timeline collapsing. Coverage thresholds enforced, with the
      threshold set per package rather than one global number that hides a weak area.
- [ ] **Contract** - shared schemas, mock fixtures, request and response compatibility, error envelopes,
      and safe projections
- [ ] **Integration** - migrations, repositories, queues, Authentik token validation, Zoho and Resend
      adapters, R2 behaviour, audit events
- [ ] **Authorisation** - the full role-and-ownership matrix with a negative test for every protected
      action, from Phase 09, re-run as a gate here
- [ ] **Browser** - published browse, service discovery, enquiry, receipt, login, claim, dashboard, staff
      processing, logout, errors, mobile, and keyboard
- [ ] **Operations** - backup and restore, deployment rollback, monitoring alert, disk pressure, provider
      outage, and worker restart
- [ ] Every suite runnable independently and locally with one command, because "reproducible locally" is
      half of QA-1101

### WP-14.2 Flake and determinism

- [ ] Each suite run three times; any non-deterministic test is fixed, not retried. A retry hides the
      bug and keeps the signal noisy.
- [ ] No arbitrary sleeps - waits are on conditions
- [ ] Time frozen where behaviour depends on it; seeded randomness everywhere
- [ ] Test isolation verified by shuffling execution order
- [ ] Total wall-clock runtime recorded, with the slowest tests identified

### WP-14.3 Fixture audit

- [ ] Every fixture confirmed synthetic: generated names, reserved-range phone numbers
      (`+44 7700 900xxx`, `555-01xx`), `@example.com` addresses, non-sensitive messages
- [ ] A scan asserting no fixture contains a plausible real personal identifier
- [ ] A test asserting no `__fixture` record can exist in a production database
- [ ] Confirmation that no production data was ever copied to local or staging (PRD 16.1)

### WP-14.4 Accessibility verification

QA-1102 names the manual checks explicitly, so each produces a recorded result.

- [ ] **Automated** - axe at `wcag2a`, `wcag2aa`, `wcag21aa` on every public, customer, and staff route,
      zero violations
- [ ] **Keyboard** - every route walked with keyboard only: all functionality reachable, no trap, logical
      order, working skip link
- [ ] **Focus** - focus visible on every interactive element against every background including the
      gradient band, and correctly managed on route change, modal open and close, and form error
- [ ] **Screen-reader smoke** - NVDA on Windows and VoiceOver on macOS across the homepage, a service
      detail, the enquiry form including an error state, and the dashboard. Recorded as pass, fail, or
      observation per route.
- [ ] **Mobile** - real-device or emulated touch checks at 360px: targets at least 44px, no horizontal
      scroll, working mobile navigation
- [ ] **Slow network** - throttled 3G: loading states appear, nothing shifts, the enquiry form remains
      submittable, and no timeout leaves the user without feedback
- [ ] **Zoom and reflow** - 200% zoom and 400% reflow with no loss of content or function
- [ ] **Additional 2.2 criteria** - focus not obscured by sticky elements, dragging movements have a
      single-pointer alternative, target size, consistent help placement, and redundant entry avoided in
      the enquiry flow
- [ ] `docs/accessibility-report.md` recording every check, its result, and any accepted deviation with
      justification

### WP-14.5 Security review

Against OWASP Top 10 2025, with the finding recorded even when the answer is "not applicable".

- [ ] **Broken access control** - the Phase 09 matrix, plus IDOR attempts on every identifier, plus
      confirmation that enumeration is impossible because not-owned returns `not_found`
- [ ] **Security misconfiguration** - headers, CSP, CORS, cookie flags, disabled introspection, no debug
      surface, no default credential
- [ ] **Supply chain** - dependency review, lockfile integrity, actions pinned to SHAs, provenance
      attestation, container scan
- [ ] **Authentication failures** - session handling, MFA enforcement, brute-force limits, no user
      enumeration on sign-in or claim
- [ ] **Software and data integrity** - immutable image promotion by digest, signed tags, verified
      webhook signatures
- [ ] **Logging and monitoring failures** - every security-relevant event logged with a request ID, and
      no sensitive value in any log
- [ ] **Injection** - parameterised queries throughout, no dynamic SQL, CSV injection defused, Lexical
      output sanitised
- [ ] **Cryptographic failures** - TLS configuration, session sealing, token hashing, encrypted backups
- [ ] **SSRF** - no user-controlled outbound URL; the media fetch path allow-lists hosts
- [ ] **Mishandling exceptional conditions** - no stack trace in a response, fail-closed on
      authorisation, fail-open only where documented and alerted (rate limiting)
- [ ] Secret scan across the full history; `git ls-files` free of any `.env`
- [ ] `docs/security-review.md` recording each item, the evidence, and the disposition

### WP-14.6 Performance verification

- [ ] Lighthouse on a throttled mobile profile for the homepage, a service listing, a service detail, an
      article, and the enquiry form, with p75 LCP at or below 2.5s
- [ ] API latency under load with p95 below 800ms excluding provider latency
- [ ] `EXPLAIN` review of every list query, confirming index use and no sequential scan on a growing table
- [ ] Bundle budgets enforced per route
- [ ] Resource observation under staging load: CPU, memory, disk, and database connections recorded, with
      resizing recommended if a budget fails - which PRD 9.1 explicitly permits as an outcome
- [ ] Load test at several times the baseline of 5,000 monthly visits, with graceful degradation rather
      than collapse

### WP-14.7 Clean-clone verification

The literal text of QA-1101.

- [ ] Clone into an empty directory, install with `--frozen-lockfile`, start dependencies, migrate, seed,
      and run every required check
- [ ] Every failure reproducible locally with the documented command
- [ ] Total time from clone to green recorded

## Verification

```bash
git clone <local-repo> /tmp/cera-clean && cd /tmp/cera-clean
pnpm install --frozen-lockfile
docker compose -f compose.yaml -f infra/compose/compose.local.yaml up -d
pnpm migrate && pnpm seed
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e && pnpm test:a11y
pnpm audit --audit-level=moderate
```

## Exit gate

- [ ] QA-1101: every required check passes from a clean clone; failures reproduce locally; fixtures
      contain no real customer data
- [ ] QA-1102: automated checks pass and the manual keyboard, focus, screen-reader smoke, mobile, and
      slow-network checks are recorded in `docs/accessibility-report.md`
- [ ] Zero unresolved critical or high security findings (PRD Phase 4 exit condition)
- [ ] No flaky test; every suite passes three consecutive runs
- [ ] Performance budgets met, or resizing formally recommended with data
- [ ] `docs/security-review.md` complete with a disposition for every OWASP 2025 category
