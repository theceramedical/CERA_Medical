# ADR-004: OIDC relying party built on `openid-client` v6

**Status:** Accepted
**Date:** 2026-09-21

## Context

PRD 7 (Identity) requires Authentik as the OIDC provider with separate clients per environment, MFA
for administrators and release approvers, short sessions for privileged interfaces, and reachable
discovery, JWKS, token, and callback routes for server-to-server authentication. AUTH-502 requires
automated proof that each role reaches only its approved routes, records, and actions.

Verified state of the Next.js authentication ecosystem in September 2026:

- **Auth.js / NextAuth v5 is still beta** at `5.0.0-beta.32`. `next-auth@latest` resolves to the v4
  line. Security maintenance moved to the Better Auth team, who recommend Better Auth for new
  projects while continuing to patch Auth.js.
- Auth.js v5 carried **GHSA-8fpg-xm3f-6cx3**, a middleware fail-open advisory fixed in beta.32. The
  failure mode is exactly the one PRD 1.2 forbids: a route that appears protected but is not.
- **Better Auth** offers a `genericOAuth` plugin and manages its own session tables.
- **`openid-client` v6** is a certified OpenID Connect relying-party library with no framework
  coupling.

Authentik owns credentials, TOTP enrolment, and MFA enforcement in all three options. What is being
chosen is only the relying-party and session layer.

## Decision

Build the relying party on **`openid-client` v6** with **`jose`** for cookie sealing.

1. **Authorization Code with PKCE**, `state` and `nonce` generated per attempt and held in
   short-lived httpOnly cookies. The ID token is verified against Authentik's JWKS with issuer,
   audience, expiry, and nonce checks.
2. **Session as a sealed cookie.** `{ sub, email, emailVerified, roles, iat, exp, absoluteExp }`
   encrypted as a JWE with a rotating symmetric key, `httpOnly`, `Secure`, `SameSite=Lax`,
   host-prefixed. No session lookup on the hot path; revocation is handled by a short idle lifetime
   plus a server-side deny list keyed by `sub` for forced logout.
3. **Role source.** Authentik groups surfaced through an OAuth2 Scope Mapping on a `groups` scope,
   mapped to the seven PRD roles by an exhaustive table in `packages/contracts`.
4. **Authorisation is per request in `apps/api`.** `proxy.ts` performs a cheap presence check for
   redirect ergonomics only and is never the authorisation decision.
5. **Two session policies.** Customers 12h idle / 7d absolute. Staff and administrators 60m idle / 8h
   absolute, with `acr`/`amr` inspected so a session that did not satisfy MFA cannot reach a staff
   route.
6. **Back-channel logout** via Authentik's end-session endpoint, clearing the local cookie first.

Better Auth `genericOAuth` is the documented fallback if this layer proves to be a schedule risk;
switching means replacing one module behind the same `getSession()` interface.

## Consequences

- No dependency on a beta release for the control that gates every protected route.
- Roughly 250 lines of session code we own and test, versus a framework we would still have to test.
  The cryptography is `jose`; the protocol is `openid-client`. Neither is hand-rolled.
- Stateless sessions mean no session table and no read on every request, at the cost of revocation
  being eventual rather than instant. The short idle lifetimes and the deny list bound that window,
  which is the standard trade and is acceptable because Authentik can terminate the upstream session
  immediately.
- `CustomerProfile` stays the single identity record keyed by Authentik `sub`, with no parallel user
  table imposed by an auth framework - which keeps the CUS-601 claim logic simple to reason about.
- Session handling must be tested directly: tamper, expiry, absolute expiry, replayed `state`,
  mismatched `nonce`, missing MFA, and role escalation each get a named test in Phase 09.

## Alternatives considered

**Auth.js v5 (`next-auth@beta`).** Fastest to write and well understood. Rejected: beta churn plus a
fail-open advisory in the precise control PRD 1.2 makes non-negotiable, and its maintainers now point
new projects elsewhere.

**Auth.js v4 stable.** Rejected: not App-Router-first, and adopting a line already in maintenance at
the start of a new build is a migration scheduled for later.

**Better Auth `genericOAuth`.** A strong option and the recorded fallback. Not chosen as primary
because it introduces its own schema and session tables into `cera_app`, adding migration surface and
a second concept of "user" next to `CustomerProfile`, for capability we do not need.

**Authentik forward-auth proxy outpost.** Rejected: it authenticates at the edge but does not give
`apps/api` the per-record ownership decision, so the hard part remains unsolved while a component is
added.
