import { SESSION_COOKIE_NAME } from '@cera/contracts/session';
import { REQUEST_ID_HEADER, resolveRequestId } from '@cera/observability/request-id';
import { NextResponse } from 'next/server';

import { resolveRedirect } from './lib/cms/redirects.ts';
import { buildCsp, STATIC_SECURITY_HEADERS } from './lib/security-headers.ts';

import type { NextRequest } from 'next/server';

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` and fixed it to the Node.js runtime, so this
 * file may use Node built-ins and must not export a route segment config.
 *
 * Three jobs, and one deliberate non-job.
 *
 * 1. **Request ID.** One identifier for the whole request, forwarded downstream and echoed to the
 *    client, so a user who reports a problem can quote a value that appears in the logs.
 * 2. **Security headers,** including a per-request CSP nonce.
 * 3. **Redirect ergonomics,** sending an unauthenticated visitor on a portal or staff URL to
 *    sign-in with a return path, rather than letting them load a shell that then fails.
 *
 * **It is not an authorisation boundary,** and nothing here should ever be mistaken for one. It
 * checks that a session cookie is *present*; it does not open the seal, verify the signature,
 * check expiry, or look at roles. A forged cookie of the right name passes this and is rejected by
 * `apps/api`, which is where the decision is made, per request, against the record being touched.
 * ADR-004 records why: Auth.js v5 carried GHSA-8fpg-xm3f-6cx3, a middleware fail-open, and the
 * lesson is not "write the check more carefully" but "do not put the check here at all".
 */

/**
 * Route prefixes that need a session before they are worth rendering.
 *
 * Prefix matching rather than a regex, because the failure mode of a regex here is a route that
 * silently stops matching after a rename - and the consequence of a missed match is only a worse
 * redirect experience, never an authorisation hole, precisely because of the note above.
 */
const AUTHENTICATED_PREFIXES = ['/account', '/staff'] as const;

/** Where an unauthenticated visitor is sent. Phase 09 implements the handler. */
const SIGN_IN_PATH = '/auth/sign-in';

/**
 * The parameter carrying where to return to after signing in.
 *
 * Validated on the way back out in Phase 09, not merely round-tripped: a `?next=` that accepts an
 * absolute URL is an open redirect, which is how a phishing link gets to wear our domain. Only a
 * path originating from this request is ever written into it here.
 */
const RETURN_TO_PARAM = 'next';

export function proxy(request: NextRequest): NextResponse {
  const requestId = resolveRequestId(request.headers.get(REQUEST_ID_HEADER));

  /**
   * `crypto.randomUUID()` rather than a counter or a timestamp. A CSP nonce has exactly one
   * requirement - that an attacker cannot predict it - and anything derived from the clock or from
   * request order fails that requirement while looking fine.
   */
  const nonce = crypto.randomUUID();

  const csp = buildCsp(nonce, {
    mediaOrigin: originOf(process.env.S3_PUBLIC_URL),
    apiOrigin: originOf(process.env.NEXT_PUBLIC_API_URL),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  /**
   * The CSP goes on the *request* as well as the response, and this is not redundant.
   *
   * It is how the nonce reaches the renderer: Next parses the incoming
   * `content-security-policy` header, extracts the nonce, and stamps it onto every script tag it
   * emits. Without this line the response policy is enforced against scripts that carry no nonce,
   * and the page loads with hydration blocked - which presents as a completely static site rather
   * than as an error.
   */
  requestHeaders.set('content-security-policy', csp);

  const response = redirectOrContinue(request, requestHeaders);

  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set('content-security-policy', csp);
  for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  return response;
}

/**
 * Either a redirect to sign-in, or the request passed through with its augmented headers.
 *
 * Split out so the header application above happens on exactly one object. Setting the security
 * headers on the pass-through branch and forgetting the redirect branch is the ordinary way this
 * kind of function ends up with an unprotected response, and the only redirect on this path is one
 * an unauthenticated visitor sees.
 */
function redirectOrContinue(request: NextRequest, requestHeaders: Headers): NextResponse {
  const pathname = normalisePath(request.nextUrl.pathname);

  const cmsRedirect = resolveRedirect(pathname, readConfiguredRedirects());
  if (cmsRedirect !== null) {
    const target = new URL(cmsRedirect.to, request.nextUrl.origin);
    return NextResponse.redirect(target, cmsRedirect.permanent ? 308 : 307);
  }

  const needsSession = AUTHENTICATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (needsSession && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const target = new URL(SIGN_IN_PATH, request.nextUrl.origin);
    target.searchParams.set(RETURN_TO_PARAM, `${pathname}${request.nextUrl.search}`);

    return NextResponse.redirect(target);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

/**
 * Collapses a run of leading slashes to one.
 *
 * Used for both the prefix match and the return target, so the two cannot disagree about what path
 * a request is for.
 *
 * `NextResponse.redirect` needs an absolute target, so the origin is used for the sign-in location
 * itself - but the value written into `?next=` must be a path, or Phase 09 has an open redirect and
 * a phishing link gets to wear this domain. A `startsWith('/')` check is not enough to guarantee
 * that: a request to `https://host//evil.test` has a `pathname` of `//evil.test`, which is a
 * *protocol-relative* reference. A browser resolving it as a redirect target inherits the current
 * scheme and reads the rest as a host, so it is an absolute URL wearing a path's clothing.
 *
 * Normalising before the prefix match matters for the same reason: `//account` would otherwise miss
 * the match, skip the redirect, and never reach this function at all - which is how the defence
 * ends up in the code and not in the path that needs it.
 */
function normalisePath(pathname: string): string {
  return pathname.replace(/^\/+/, '/');
}

/**
 * Static CMS redirects for the edge. Live Payload fetches belong in the
 * request path of `apps/web` pages, not in every asset match. A JSON env
 * blob keeps this file free of a network hop on each document request.
 */
function readConfiguredRedirects(): readonly { from: string; to: string; permanent: boolean }[] {
  const raw = process.env.CMS_REDIRECTS_JSON;
  if (raw === undefined || raw.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const redirects: { from: string; to: string; permanent: boolean }[] = [];
    for (const item of parsed) {
      if (item === null || typeof item !== 'object') continue;
      const record = item as Record<string, unknown>;
      if (typeof record.from !== 'string' || typeof record.to !== 'string') continue;
      redirects.push({
        from: record.from,
        to: record.to,
        permanent: record.permanent === false ? false : true,
      });
    }
    return redirects;
  } catch {
    return [];
  }
}

/**
 * Reduces a configured URL to its origin, for use in a CSP source list.
 *
 * Returns `undefined` rather than throwing on a malformed value. A bad `S3_PUBLIC_URL` should
 * produce a policy that is too strict - images fail visibly, in development, on the first page
 * load - not a request that 500s, and certainly not a policy with a fragment of a URL in it that
 * the browser silently drops along with the rest of the directive.
 */
function originOf(value: string | undefined): string | undefined {
  if (value === undefined || value.length === 0) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export const config = {
  /**
   * Everything except Next's own static output and the metadata files.
   *
   * Those are served straight from disk with no document to protect and no session to consider,
   * and matching them would run this function - and mint a nonce - for every image and font on
   * every page load. `_next/static` is immutable and fingerprinted; `_next/image` is the
   * optimiser, whose output is an image.
   */
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'],
};
