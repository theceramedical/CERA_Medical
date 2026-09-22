import { z } from 'zod';

/**
 * The error envelope. Every non-2xx response from `apps/api` uses it, without
 * exception, so a client has exactly one shape to handle.
 */

export const ErrorCodeSchema = z.enum([
  'validation_failed',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conflict',
  'invalid_transition',
  'consent_required',
  'rate_limited',
  'upstream_unavailable',
  'internal_error',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const FieldErrorSchema = z.object({
  /** Dot path into the submitted body, for example `email` or `contact.phone`. */
  path: z.string().max(200),
  /** Stable machine-readable reason, for example `invalid_email`. */
  code: z.string().max(80),
  /** Safe to display directly to the person who submitted the form. */
  message: z.string().max(300),
});
export type FieldError = z.infer<typeof FieldErrorSchema>;

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    /**
     * Safe for display. Never contains SQL, a stack trace, a connection string,
     * an internal hostname, or a provider response body - provider errors
     * frequently echo the request, which would leak the enquiry message.
     */
    message: z.string().max(500),
    /**
     * Whether retrying the identical request could succeed. Clients use this to
     * decide between a retry and surfacing the error, so it must not be guessed
     * per call site: `HTTP_STATUS_BY_ERROR_CODE` below is the single mapping.
     */
    retryable: z.boolean(),
    fieldErrors: z.array(FieldErrorSchema).max(50).optional(),
  }),
  /** Correlates this response with structured logs and the GlitchTip event. */
  requestId: z.string().min(1).max(100),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * HTTP status and retryability per code, in one place.
 *
 * Centralised because inconsistency here is a real bug: a `rate_limited`
 * returned as non-retryable makes clients give up on a condition that clears in
 * seconds, and a `validation_failed` marked retryable makes them hammer an
 * endpoint that will never accept the request.
 */
export const HTTP_STATUS_BY_ERROR_CODE = {
  validation_failed: { status: 400, retryable: false },
  unauthenticated: { status: 401, retryable: false },
  forbidden: { status: 403, retryable: false },
  not_found: { status: 404, retryable: false },
  conflict: { status: 409, retryable: false },
  invalid_transition: { status: 409, retryable: false },
  consent_required: { status: 422, retryable: false },
  rate_limited: { status: 429, retryable: true },
  upstream_unavailable: { status: 502, retryable: true },
  internal_error: { status: 500, retryable: true },
} as const satisfies Record<ErrorCode, { status: number; retryable: boolean }>;

/**
 * Default messages.
 *
 * `not_found` and `forbidden` share identical wording on purpose. For a record
 * the caller does not own, the API returns `not_found`, so it cannot be used to
 * discover which enquiry references exist. Distinguishable messages would defeat
 * that even with matching status codes.
 */
export const DEFAULT_ERROR_MESSAGES = {
  validation_failed: 'Some of the information provided is not valid. Please check and try again.',
  unauthenticated: 'Please sign in to continue.',
  forbidden: 'We could not find what you were looking for.',
  not_found: 'We could not find what you were looking for.',
  conflict: 'That change could not be applied because the record has since changed.',
  invalid_transition: 'That status change is not allowed from the current status.',
  consent_required: 'Please confirm you agree to be contacted before submitting.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  upstream_unavailable:
    'A service we rely on is temporarily unavailable. Please try again shortly.',
  internal_error: 'Something went wrong on our side. Please try again.',
} as const satisfies Record<ErrorCode, string>;

export interface BuildErrorOptions {
  code: ErrorCode;
  requestId: string;
  /** Overrides the default. Must already be safe to display. */
  message?: string;
  fieldErrors?: FieldError[];
}

/**
 * Builds an envelope with the correct retryability for the code.
 *
 * `retryable` is derived rather than accepted as a parameter, so it cannot be
 * set inconsistently at a call site.
 */
export function buildErrorEnvelope(options: BuildErrorOptions): ErrorEnvelope {
  const { code, requestId, message, fieldErrors } = options;

  return {
    error: {
      code,
      message: message ?? DEFAULT_ERROR_MESSAGES[code],
      retryable: HTTP_STATUS_BY_ERROR_CODE[code].retryable,
      ...(fieldErrors !== undefined && fieldErrors.length > 0 ? { fieldErrors } : {}),
    },
    requestId,
  };
}

export function httpStatusFor(code: ErrorCode): number {
  return HTTP_STATUS_BY_ERROR_CODE[code].status;
}

/**
 * Converts a Zod failure into field errors.
 *
 * Only `path`, a stable code, and Zod's own message are carried across. The
 * offending value is deliberately dropped: including it would echo the submitted
 * enquiry message back through an error response and into any client-side log.
 */
export function fieldErrorsFromZod(error: z.ZodError): FieldError[] {
  return error.issues.slice(0, 50).map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

/**
 * An error carrying an envelope code, thrown inside a request and translated by
 * the error handler. Extends `Error` so stack traces still work in development,
 * while the client only ever receives `toEnvelope()`.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors?: FieldError[];
  /** Server-side only. Logged, never serialised to the client. */
  readonly internalDetail?: string;

  constructor(
    code: ErrorCode,
    options: { message?: string; fieldErrors?: FieldError[]; internalDetail?: string } = {},
  ) {
    super(options.message ?? DEFAULT_ERROR_MESSAGES[code]);
    this.name = 'ApiError';
    this.code = code;
    if (options.fieldErrors !== undefined) this.fieldErrors = options.fieldErrors;
    if (options.internalDetail !== undefined) this.internalDetail = options.internalDetail;
  }

  get httpStatus(): number {
    return HTTP_STATUS_BY_ERROR_CODE[this.code].status;
  }

  toEnvelope(requestId: string): ErrorEnvelope {
    return buildErrorEnvelope({
      code: this.code,
      requestId,
      message: this.message,
      ...(this.fieldErrors !== undefined ? { fieldErrors: this.fieldErrors } : {}),
    });
  }
}
