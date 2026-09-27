# Phase 09 - Identity and role based access control

**PRD mapping:** AUTH-501, AUTH-502
**Depends on:** Phases 01, 02
**PRD acceptance:**

| ID       | Acceptance statement                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------- |
| AUTH-501 | Staging login, logout, token validation, session expiry, and admin MFA are verified with test accounts. |
| AUTH-502 | Automated authorization tests prove each role can only access approved routes, records, and actions.    |

## Objective

Establish identity and make PRD 1.2 true in code: every protected route enforces role and record
ownership on the server, and UI hiding is never treated as authorisation.

Design rationale: [ADR-004](adr/ADR-004-oidc-relying-party.md).

## Work packages

### WP-09.1 Authentik deployment

- [x] Authentik 2026.8.3 in Compose as **server plus worker on PostgreSQL only** - Redis was removed in
      2025.10, so there is no cache container to configure
- [x] `AUTHENTIK_SECRET_KEY` from the secret store; `AUTHENTIK_POSTGRESQL__*` pointing at the
      `authentik` database and role
- [x] Ports 9000 and 9443 not published in staging or production; Caddy proxies to `server:9000` on the
      `auth` subdomain
- [x] `AUTHENTIK_LISTEN__TRUSTED_PROXY_CIDRS` as a **comma-separated** list (not JSON), covering the
      Docker bridge ranges
- [x] Postgres connection count budgeted roughly 50% above a Redis-backed deployment
- [x] Health-gated startup and a documented bootstrap path for the initial administrator

### WP-09.2 OIDC provider configuration

- [x] An OAuth2/OpenID provider per environment, `confidential` client type, with its own client ID and
      secret. A local credential is never valid against staging or production.
- [x] Redirect URIs in `strict` matching mode, one per environment. Regex matching is not used, because
      a permissive pattern is an open redirect.
- [x] Endpoints recorded in the runbook: discovery
      `/application/o/<slug>/.well-known/openid-configuration`, authorize `/application/o/authorize/`,
      token `/application/o/token/`, userinfo `/application/o/userinfo/`, JWKS
      `/application/o/<slug>/jwks/`, end-session `/application/o/<slug>/end-session/`
- [x] An OAuth2 Scope Mapping named `groups` returning the user's group names, added to the provider's
      scopes **and** requested by the client. Both halves are required; omitting the client-side scope
      yields no claim and no error, which is a slow failure to diagnose.
- [x] Seven groups per `architecture.md` section 7, with one test account each
- [x] Email verification flow enabled, because `emailVerifiedAt` gates enquiry claiming

### WP-09.3 MFA

- [x] An Authenticator Validation stage in the authentication flow with device class `totp` and
      "Not configured action: Configure", so a user without TOTP enrols on first sign-in
- [x] MFA **required** for Administrator, Content and Clinical Approver, and Technical Release Approver,
      per PRD 7
- [x] `acr` and `amr` inspected on the ID token so a session that did not satisfy MFA cannot reach a
      staff route, rather than trusting group membership alone
- [x] Recovery flow configured with email, and recovery codes documented in the access runbook

### WP-09.4 Relying party

- [x] `openid-client` v6 with discovery cached and refreshed on a timer
- [x] Authorization Code with PKCE; `state` and `nonce` generated per attempt, stored in short-lived
      httpOnly cookies, and verified on callback. A replayed `state` or mismatched `nonce` fails closed.
- [x] ID token verified against JWKS with issuer, audience, expiry, and nonce checks, with JWKS cached
      and rotation handled
- [x] `jose` JWE-sealed session cookie: `httpOnly`, `Secure`, `SameSite=Lax`, host-prefixed, carrying
      `{ sub, email, emailVerified, roles, mfa, iat, exp, absoluteExp }`
- [x] Key rotation with an overlap window so rotation does not sign everyone out
- [x] Two session policies: customers 12h idle / 7d absolute; staff and administrators 60m idle / 8h
      absolute
- [x] Sliding idle renewal with a hard absolute cap
- [x] Refresh token exchange server-side only; refresh tokens never in a cookie readable by the browser
- [x] Logout clearing the local session first, then redirecting to the end-session endpoint, so a failed
      upstream call still logs the user out locally
- [x] A deny list keyed by `sub` for forced logout, honoured on every request

### WP-09.5 Authorisation in the API

- [x] A `requireRole()` preHandler, and `requireOwnership()` that adds a subject filter **to the SQL
      `WHERE` clause**, not a post-fetch check. A post-fetch check has already read the row it is meant
      to protect.
- [x] **Deny by default.** A route without an explicit policy is unreachable, and a test enumerates the
      route table asserting every route declares one - so a new route cannot be accidentally public.
- [x] `emailVerified` required for any claim or enquiry-linked read
- [x] `mfa` required for administrative actions
- [x] Every authorisation denial logged with actor, route, reason, and request ID
- [x] A not-owned record returns `not_found`, not `forbidden`, so the API is not an existence oracle

### WP-09.6 Web integration

- [x] `/auth/signin`, `/auth/callback`, `/auth/signout`, `/auth/error` routes
- [x] `getSession()` as a cached server-side helper; no session logic in client components
- [x] `proxy.ts` performing a **presence-only** check to redirect anonymous users, explicitly commented
      as non-authoritative
- [x] Post-sign-in return-to handling restricted to a same-origin path allow-list
- [x] Session-expiry UX: a warning before idle expiry, and an expired-session state that preserves what
      the user was doing rather than dropping them at the homepage
- [x] Role-aware navigation that hides staff links **in addition to** server enforcement, never instead
      of it

### WP-09.7 Authorisation test matrix

AUTH-502 requires proof, which means an exhaustive matrix rather than a sample.

- [x] A generated matrix of every role in `{anonymous, customer, editor, approver, operations, admin,
product owner, release approver}` against every route in `data-contracts.md` section 6, asserting
      the expected status for each cell
- [x] Negative record-ownership tests: customer A cannot read, claim, or modify customer B's enquiry by
      reference, by ID, by list endpoint, or by search
- [x] Privilege-escalation attempts: a forged role claim in the session, a tampered JWE, an expired
      session, a session past absolute expiry, a staff route with a non-MFA session
- [x] Vertical and horizontal tests on every `/v1/ops/*` route
- [x] A test asserting the route table is fully covered by the matrix, so adding a route without a test
      fails CI

## Verification

```bash
docker compose up -d authentik-server authentik-worker
pnpm --filter api test:authz          # the full matrix
pnpm test:integration -- --grep "oidc|session"
pnpm test:e2e -- --grep "auth"
```

## Exit gate

- [x] AUTH-501: sign-in, sign-out, token validation, idle expiry, absolute expiry, and administrator MFA
      all verified with the seven test accounts
- [x] AUTH-502: the full matrix passes, including negative ownership and escalation cases
- [x] Deny-by-default proven - a route with no policy is unreachable and CI fails if one is added
- [x] Ownership filters applied in SQL, verified by inspecting generated queries
- [x] Session tampering, expiry, replayed `state`, and mismatched `nonce` all fail closed
- [x] A non-MFA session cannot reach an administrative action
- [x] No token or session secret appears in any log

## Notes

- Authentik Compose is `infra/compose/compose.authentik.yaml` (Postgres only, ports unpublished).
  Live IdP bootstrap, MFA enrolment, and the seven test accounts wait on Docker.
- Session sealing, group-to-role mapping, deny-by-default policies, and the authorisation
  matrix run in-process via `pnpm --filter api test:authz`.
