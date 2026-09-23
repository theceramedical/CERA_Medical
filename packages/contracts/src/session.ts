/**
 * The names of the cookies the session layer uses.
 *
 * Only the names live here, deliberately. The sealed payload, its expiry rules, and the
 * verification are Phase 09's and belong next to the OIDC code - but the *names* are needed by
 * three places that are built at different times and must not disagree: `apps/web`'s proxy does
 * a presence check for redirect ergonomics, `apps/api` reads the cookie to authorise a request,
 * and Phase 09 issues and clears it. A string duplicated across those three is a bug that
 * presents as "logged in, but every page redirects to sign-in", which points at none of them.
 *
 * See ADR-004 for why the session is a sealed cookie rather than a database row.
 */

/**
 * The `__Host-` prefix is a browser-enforced constraint, not a naming convention.
 *
 * A cookie so named is only accepted if it is `Secure`, has `Path=/`, and has **no** `Domain`
 * attribute. That last part is the reason to use it: without it, a subdomain - including one
 * served by a different application, or by an attacker who obtains a subdomain - can set a
 * cookie that the browser sends to this origin and that this origin cannot distinguish from its
 * own. Session fixation via a sibling subdomain is the concrete attack, and the prefix is the
 * only defence that does not depend on us getting every `Domain` attribute right forever.
 *
 * It requires `Secure`, which means HTTPS - or `localhost`, which every current browser treats
 * as a secure context precisely so this is testable in development.
 */
export const SESSION_COOKIE_NAME = '__Host-cera_session';

/**
 * The OIDC handshake cookies: PKCE verifier, `state`, and `nonce`.
 *
 * Separate from the session because their lifetime is one redirect, and because they must be
 * deleted the moment the callback consumes them - a `state` that outlives its single use is a
 * replayable value, which ADR-004 requires a named test for.
 */
export const OIDC_STATE_COOKIE_NAME = '__Host-cera_oidc_state';

/**
 * Every cookie this platform sets. Exported as a list so a test can assert the set, and so the
 * sign-out path can clear all of them without a second hand-maintained array.
 */
export const ALL_SESSION_COOKIE_NAMES = [SESSION_COOKIE_NAME, OIDC_STATE_COOKIE_NAME] as const;

export type SessionCookieName = (typeof ALL_SESSION_COOKIE_NAMES)[number];
