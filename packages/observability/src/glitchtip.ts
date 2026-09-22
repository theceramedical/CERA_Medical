import * as Sentry from '@sentry/node';

import { isReportable } from './errors.ts';
import { REDACTED } from './redact.ts';

/**
 * GlitchTip integration, via the Sentry SDK.
 *
 * GlitchTip is Sentry-protocol compatible, so `@sentry/node` is the client. That
 * matters for one reason worth stating: GlitchTip does not implement Sentry's
 * server-side scrubbing, so `beforeSend` here is the only thing standing between an
 * exception and an enquiry message appearing in the error tracker. On Sentry it
 * would be defence in depth; here it is the defence.
 */

export interface GlitchTipConfig {
  /** Absent in development, which disables reporting rather than failing. */
  dsn?: string;
  environment: string;
  release: string;
  service: string;
  /**
   * Trace sample rate. Defaults to zero.
   *
   * Off by default because tracing carries request data - URLs with query strings,
   * database statements - and PRD 8 does not ask for distributed tracing. Turning it
   * on is a decision with a privacy review, not a default.
   */
  tracesSampleRate?: number;
}

/**
 * Header and cookie names dropped unconditionally.
 *
 * `beforeSend` receives the whole event including request context the SDK gathered
 * automatically, which is a different path from anything the logger sees - so the
 * allow-list in `redact.ts` does not apply and this needs its own handling.
 */
const STRIPPED_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
  'x-api-key',
  'x-csrf-token',
]);

/**
 * Query parameters that must not survive into a transaction name or URL.
 *
 * A claim token in a query string is the concrete case: it would be captured in the
 * event's URL and become a single-use credential sitting in the error tracker, long
 * enough to still be valid.
 */
const SENSITIVE_QUERY_KEYS = ['token', 'code', 'state', 'email', 'reference'];

export function initGlitchTip(config: GlitchTipConfig): boolean {
  if (config.dsn === undefined || config.dsn.length === 0) {
    // Not an error. Local development has no error tracker, and failing here would
    // mean the API cannot start without one.
    return false;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    /**
     * The single most important setting in this file.
     *
     * With `sendDefaultPii: true` the SDK attaches the request IP, cookies, and
     * user identity to every event automatically. PRD 8 forbids exactly that, and
     * no amount of `beforeSend` filtering is as reliable as not collecting it.
     */
    sendDefaultPii: false,
    tracesSampleRate: config.tracesSampleRate ?? 0,
    /**
     * `beforeSend` runs on every event, including ones the SDK captures on its own
     * from an unhandled rejection - which is the path that bypasses our error
     * handler entirely.
     */
    beforeSend: (event) => scrubEvent(event, config.service),
    beforeBreadcrumb: scrubBreadcrumb,
    /**
     * Expected outcomes are not incidents. Filtered here as well as in the error
     * handler, because `captureException` can be called from anywhere.
     */
    ignoreErrors: ['AbortError', 'ECONNRESET'],
  });

  return true;
}

/**
 * Reduces a breadcrumb to its category.
 *
 * Breadcrumbs are the quiet leak. The SDK records the events leading up to an
 * error, so a `console.log(enquiry)` left in during debugging is attached to an
 * unrelated exception an hour later - and nobody reviewing that exception expects
 * to find an enquiry in it. Console breadcrumbs are dropped entirely and everything
 * else keeps only its category, which is enough to see the shape of what happened
 * without carrying any of the content.
 *
 * Exported for the same reason as `scrubEvent`: it is the kind of function whose
 * correctness should be asserted directly, not inferred from a network call.
 */
export function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (breadcrumb.category === 'console') return null;

  const category = breadcrumb.category ?? 'unknown';

  return {
    category,
    ...(breadcrumb.level === undefined ? {} : { level: breadcrumb.level }),
    ...(breadcrumb.timestamp === undefined ? {} : { timestamp: breadcrumb.timestamp }),
    ...(breadcrumb.type === undefined ? {} : { type: breadcrumb.type }),
    message: REDACTED,
  };
}

/**
 * Strips everything from an event that is not needed to identify the code path.
 *
 * Exported so it can be tested directly. Testing it through a live SDK would mean
 * asserting against a network call, and this is the function whose correctness
 * matters most in the package.
 */
export function scrubEvent(event: Sentry.ErrorEvent, service: string): Sentry.ErrorEvent | null {
  /**
   * The user object is removed entirely rather than trimmed.
   *
   * The SDK populates `email`, `ip_address`, and `username`, and the only field
   * this platform may report is the opaque subject. Replacing the object rather
   * than deleting keys means a future SDK version adding a field does not
   * reintroduce the problem.
   */
  if (event.user !== undefined) {
    const subjectId = typeof event.user.id === 'string' ? event.user.id : undefined;
    event.user = subjectId === undefined ? {} : { id: subjectId };
  }

  if (event.request !== undefined) {
    const request = event.request;

    if (request.headers !== undefined) {
      request.headers = Object.fromEntries(
        Object.entries(request.headers).filter(([key]) => !STRIPPED_HEADERS.has(key.toLowerCase())),
      );
    }

    // A request body on an enquiry endpoint *is* the enquiry. There is no version
    // of this that is safe to keep.
    delete request.data;
    delete request.cookies;

    if (typeof request.url === 'string') request.url = stripSensitiveQuery(request.url);
    if (request.query_string !== undefined) delete request.query_string;
  }

  /**
   * Exception messages are replaced, stacks are kept.
   *
   * The stack identifies the code path, which is what an error tracker is for. The
   * message is where a Postgres error quotes the failing row and a provider error
   * echoes the request. Keeping `type` means events still group correctly.
   */
  if (event.exception?.values !== undefined) {
    for (const value of event.exception.values) {
      value.value = REDACTED;
    }
  }

  if (event.extra !== undefined) event.extra = {};
  if (typeof event.message === 'string') event.message = REDACTED;

  /**
   * Parameterised transaction names.
   *
   * `/v1/me/enquiries/CERA-260901-A4B7Z` would create a distinct transaction per
   * enquiry, which both defeats grouping and puts a reference into a name that is
   * displayed everywhere in the UI.
   */
  if (typeof event.transaction === 'string') {
    event.transaction = parameteriseTransaction(event.transaction);
  }

  event.tags = { ...event.tags, service };

  // Always returns the event. Deciding *whether* to report belongs to
  // `reportException` and `ignoreErrors`, which see the error itself rather than a
  // serialised event whose message this function has just replaced.
  return event;
}

/** Replaces the value of any sensitive query parameter, keeping the key. */
export function stripSensitiveQuery(url: string): string {
  const separator = url.indexOf('?');
  if (separator === -1) return url;

  const [path, queryString] = [url.slice(0, separator), url.slice(separator + 1)];
  const params = new URLSearchParams(queryString);
  let changed = false;

  for (const key of SENSITIVE_QUERY_KEYS) {
    if (params.has(key)) {
      params.set(key, REDACTED);
      changed = true;
    }
  }

  return changed ? `${path}?${params.toString()}` : url;
}

/**
 * Replaces identifiers in a path with their parameter names.
 *
 * Order matters: the reference pattern is applied before the generic alphanumeric
 * one, because `CERA-260901-A4B7Z` would otherwise be partially matched by the
 * broader rule and produce an inconsistent name.
 */
export function parameteriseTransaction(transaction: string): string {
  return transaction
    .replace(/CERA-\d{6}-[0-9A-HJKMNP-TV-Z]{5}/g, ':reference')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, ':id')
    .replace(/\b[0-9a-f]{64}\b/gi, ':hash');
}

/**
 * Reports an exception, with the request ID as the correlation tag.
 *
 * The request ID is the only identifier attached. It is what ties the GlitchTip
 * event to the log line and the audit row, and it is not personal data - so it is
 * both the most useful and the safest thing to send.
 */
export function reportException(error: unknown, requestId: string): void {
  if (!isReportable(error)) return;

  Sentry.withScope((scope) => {
    scope.setTag('requestId', requestId);
    Sentry.captureException(error);
  });
}

export async function flushGlitchTip(timeoutMs = 2_000): Promise<void> {
  /**
   * Called during shutdown. Without it, the exception that caused a crash is the
   * one most likely to be lost, because the process exits before the SDK's
   * background send completes - so the event that would explain the outage never
   * arrives.
   */
  await Sentry.flush(timeoutMs);
}

export { Sentry };
