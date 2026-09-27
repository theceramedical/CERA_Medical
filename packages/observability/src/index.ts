/**
 * `@cera/observability` - structured logging, request IDs, and error reporting.
 *
 * The guarantee this package exists to provide: enquiry free text, note bodies,
 * transition reasons, tokens, and credentials never reach a log line or an error
 * report. Redaction is by allow-list, so a field added to an entity later is
 * `[redacted]` until someone deliberately permits it.
 */

export { createLogger, type Logger, type LoggerConfig, timed, withContext } from './logger.ts';

export {
  LOGGABLE_FIELDS,
  NEVER_LOGGABLE,
  REDACTED,
  redactBindings,
  redactValue,
} from './redact.ts';

export { safeDiff } from './safe-diff.ts';

export {
  isSafeRequestId,
  type OperationContext,
  outboxTraceContext,
  REQUEST_ID_HEADER,
  requestIdFromHeaders,
  resolveRequestId,
} from './request-id.ts';

export {
  ApiError,
  ConflictError,
  ConsentRequiredError,
  DomainError,
  ForbiddenError,
  InvalidTransitionError,
  isReportable,
  NotFoundError,
  RateLimitedError,
  toApiError,
  UnauthenticatedError,
  UpstreamError,
  UpstreamPermanentError,
} from './errors.ts';

export {
  flushGlitchTip,
  type GlitchTipConfig,
  initGlitchTip,
  parameteriseTransaction,
  reportException,
  scrubBreadcrumb,
  scrubEvent,
  stripSensitiveQuery,
} from './glitchtip.ts';
