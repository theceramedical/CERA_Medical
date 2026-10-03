import { randomUUID } from 'node:crypto';

/**
 * Request ID propagation.
 *
 * One identifier spans a whole enquiry lifecycle: the browser request, the API
 * transaction, the audit row written in that transaction, the outbox record, and
 * the worker's erpnext call hours later. Without that, answering "what happened to
 * this enquiry" means correlating by timestamp across five services, which is
 * guesswork.
 */

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * The shape an inbound request ID must match to be trusted.
 *
 * Bounded and restricted to characters that cannot break a log line. This is the
 * actual risk: a request ID is attacker-controlled and ends up inside a JSON log
 * field, a `Set-Cookie`-adjacent response header, and a GlitchTip tag. An
 * unvalidated value containing a newline forges a second log entry - log injection
 * - and one containing 10 kB of text inflates every line of a request until the
 * collector drops them.
 *
 * 12 to 128 characters accommodates a UUID, a W3C trace ID, and Caddy's own
 * generated ids, while rejecting a single character that would be useless for
 * correlation.
 */
const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{12,128}$/;

export function isSafeRequestId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_REQUEST_ID.test(value);
}

/**
 * Accepts an inbound request ID when it is safe, and generates one otherwise.
 *
 * Accepting a client-supplied id is a deliberate trade. It means a reverse proxy,
 * a load test, or a support engineer can correlate across systems, which is the
 * whole point. It also means two requests can share an id if a client sends a
 * fixed one - so the id is never used for authorisation, uniqueness, or as a
 * database key. It is a correlation hint, and that is all it is.
 */
export function resolveRequestId(inbound: unknown): string {
  return isSafeRequestId(inbound) ? inbound : randomUUID();
}

/**
 * Reads the request ID from a header bag, tolerating the shapes Node produces.
 *
 * Node gives `string | string[] | undefined` depending on whether a header
 * appeared more than once. A duplicated `X-Request-Id` is taken from the first
 * value: a proxy chain legitimately produces one, and preferring the last would
 * let a client override what the proxy assigned.
 */
export function requestIdFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): string {
  const raw = headers[REQUEST_ID_HEADER] ?? headers[REQUEST_ID_HEADER.toUpperCase()];
  const first = Array.isArray(raw) ? raw[0] : raw;

  return resolveRequestId(first);
}

/**
 * The context carried through an operation.
 *
 * `requestId` is required. A log line without one cannot be correlated, which
 * makes it nearly worthless during an incident, so the type refuses to let a
 * caller omit it rather than defaulting to `'unknown'`.
 */
export interface OperationContext {
  requestId: string;
  /** Present once authenticated. Never the email, which is not loggable. */
  subjectId?: string;
  route?: string;
  method?: string;
}

/**
 * Builds the outbox metadata that carries a request ID into the worker.
 *
 * Small on purpose, and the reason is the point of the whole module: without this,
 * a erpnext delivery that fails three hours after submission has no link back to the
 * request that created it, and the only way to connect them is to match on the
 * enquiry id and hope the logs were retained.
 */
export function outboxTraceContext(context: OperationContext): { requestId: string } {
  return { requestId: context.requestId };
}
