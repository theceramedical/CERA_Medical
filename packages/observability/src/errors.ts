import { ApiError, type ErrorCode } from '@cera/contracts/errors';

/**
 * The domain error hierarchy, mapping onto the error envelope.
 *
 * These exist so business logic can throw something meaningful without knowing
 * about HTTP. A service that throws `new NotFoundError('enquiry')` does not need to
 * know it becomes a 404, and the one place that decides it does becomes 404 is
 * `@cera/contracts`.
 *
 * All of them carry an `internalDetail` that is logged and never serialised. That
 * split is the point: the operator needs "unique violation on
 * enquiries_reference_key, retrying" and the customer needs "something went wrong".
 */

/**
 * The base class. Extends `ApiError` rather than wrapping it, so a Fastify error
 * handler needs one `instanceof` check and cannot miss a subclass someone adds
 * later.
 */
export class DomainError extends ApiError {
  constructor(code: ErrorCode, options: { message?: string; internalDetail?: string } = {}) {
    super(code, options);
    this.name = new.target.name;
  }
}

/**
 * The record does not exist, or the caller may not see it.
 *
 * Deliberately one error for both. `not_found` and `forbidden` share wording and
 * this class is the reason there is no convenient way to return the latter for a
 * record the caller does not own: if "you may not see this enquiry" were
 * distinguishable from "no such enquiry", the reference space could be enumerated.
 *
 * `resource` goes to the log, never to the response.
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier?: string) {
    super('not_found', {
      internalDetail: `${resource} not found${identifier === undefined ? '' : `: ${identifier}`}`,
    });
  }
}

/** The caller is authenticated but lacks the role. Distinct from record ownership. */
export class ForbiddenError extends DomainError {
  constructor(internalDetail: string) {
    super('forbidden', { internalDetail });
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(internalDetail = 'no valid session') {
    super('unauthenticated', { internalDetail });
  }
}

/**
 * A concurrent change invalidated the request.
 *
 * Retryable by a human refreshing, not by a client looping - which is why the
 * envelope marks `conflict` non-retryable. An automatic retry of a stale write
 * would simply be stale again.
 */
export class ConflictError extends DomainError {
  constructor(internalDetail: string, message?: string) {
    super('conflict', { internalDetail, ...(message === undefined ? {} : { message }) });
  }
}

/**
 * The requested status transition is not permitted.
 *
 * Carries the allowed set for the log so an operator can see what the UI should
 * have offered. `allowed` is on the instance rather than in the message because the
 * API adds it to the response body, where it is genuinely useful to a staff client.
 */
export class InvalidTransitionError extends DomainError {
  readonly allowed: readonly string[];

  constructor(from: string, to: string, allowed: readonly string[]) {
    super('invalid_transition', {
      internalDetail: `transition ${from} -> ${to} is not allowed; allowed: ${allowed.join(', ')}`,
    });
    this.allowed = allowed;
  }
}

/**
 * An external provider failed in a way that may clear.
 *
 * `upstream_unavailable` is retryable, so this must be thrown only for genuinely
 * transient conditions - a timeout, a 502, a rate limit. Throwing it for a 401
 * would make the worker retry a credential problem until it dead-letters, hiding
 * an expired token behind a retry curve.
 */
export class UpstreamError extends DomainError {
  readonly provider: string;
  readonly errorClass: string;

  constructor(provider: string, errorClass: string, internalDetail: string) {
    super('upstream_unavailable', { internalDetail });
    this.provider = provider;
    this.errorClass = errorClass;
  }
}

/**
 * A provider failed permanently. Not retryable, so it dead-letters immediately
 * rather than consuming a retry budget that will never succeed.
 */
export class UpstreamPermanentError extends DomainError {
  readonly provider: string;
  readonly errorClass: string;

  constructor(provider: string, errorClass: string, internalDetail: string) {
    super('internal_error', { internalDetail });
    this.provider = provider;
    this.errorClass = errorClass;
  }
}

export class RateLimitedError extends DomainError {
  /** Seconds. Becomes the `Retry-After` header. */
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, internalDetail: string) {
    super('rate_limited', { internalDetail });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ConsentRequiredError extends DomainError {
  constructor(internalDetail = 'consent was not given') {
    super('consent_required', { internalDetail });
  }
}

/**
 * Classifies an unknown thrown value for the error handler.
 *
 * Anything that is not a `DomainError` or an `ApiError` is an `internal_error` with
 * a generic message. That is the safe default and the reason it exists: an
 * unexpected error's own message is the most common accidental disclosure - a
 * Postgres error quotes the failing row, a provider error echoes the request body,
 * and a filesystem error prints an internal path.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof Error) {
    return new ApiError('internal_error', {
      // Kept for the log, where the stack goes too. Never serialised.
      internalDetail: `${error.name}: ${error.message}`,
    });
  }

  return new ApiError('internal_error', { internalDetail: `non-error thrown: ${typeof error}` });
}

/**
 * Whether an error should be reported to GlitchTip.
 *
 * Expected outcomes are not incidents. A validation failure, a 404, a rejected
 * transition, and a rate limit are all the system working correctly, and reporting
 * them buries the one real exception in thousands of events - which is how an alert
 * channel becomes something nobody reads.
 */
export function isReportable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return true;

  const expected: ErrorCode[] = [
    'validation_failed',
    'unauthenticated',
    'forbidden',
    'not_found',
    'conflict',
    'invalid_transition',
    'consent_required',
    'rate_limited',
  ];

  return !expected.includes(error.code);
}

export { ApiError };
