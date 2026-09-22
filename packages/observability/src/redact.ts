/**
 * Redaction by allow-list.
 *
 * This is the single most important decision in this package, and it is the
 * opposite of what most codebases do. A deny-list - "redact `password`, `token`,
 * `message`" - is correct on the day it is written and wrong the day someone adds
 * a field. That day is exactly when it matters: nobody remembers to update a
 * redaction list while adding `alternativePhone`, and the first sign of the
 * omission is a phone number sitting in a log aggregator.
 *
 * An allow-list fails in the safe direction. A new field is `[redacted]` until
 * someone deliberately adds it here, and the cost of forgetting is a slightly less
 * useful log line rather than a personal-data incident.
 *
 * PRD 8 and 10 require that enquiry free text, note bodies, transition reasons,
 * tokens, and credentials never reach a log or an error report. This module is
 * where that is true, and `redact.test.ts` is where it is proven by logging a
 * fully populated enquiry and asserting none of its text appears in the output.
 */

export const REDACTED = '[redacted]';

/**
 * Fields that may be logged, and why each is here.
 *
 * Every entry is either a machine identifier, an enumerated value, or a
 * measurement. None is free text, and none is a personal detail. The test for
 * this list is not "is it useful" but "would this be acceptable in a log retained
 * for 90 days and readable by anyone with aggregator access".
 */
/**
 * Keys whose *contents* are traversed rather than replaced wholesale.
 *
 * Allow-listing a container adds no exposure, because recursion re-applies the
 * same filter at every level: `{ enquiry }` yields the reference and the status and
 * redacts the message, the email, and the name. What it does add is usefulness, and
 * that matters more than it sounds. Redacting `{ enquiry }` to a bare
 * `"[redacted]"` produces a log line with no record identifier at all, and the
 * predictable response is that developers start hand-picking fields into the top
 * level - which is both more code and easier to get wrong than letting the
 * allow-list do it.
 *
 * Deliberately excluded: `payload`, `safeDiff`, `headers`, `query`, and `params`,
 * which are `unknown` by type and carry whatever a caller put in them. Those stay
 * on the deny-list, where a nested traversal cannot reach them.
 */
export const TRAVERSABLE_CONTAINERS: ReadonlySet<string> = new Set([
  'enquiry',
  'statusEvent',
  'delivery',
  'profile',
  'service',
  'content',
  'outboxRecord',
  'claimToken',
  'context',
  'items',
  'entries',
]);

export const LOGGABLE_FIELDS: ReadonlySet<string> = new Set([
  ...TRAVERSABLE_CONTAINERS,

  // Correlation. The point of structured logging.
  'requestId',
  'traceId',
  'spanId',
  'correlationId',

  // What happened, in closed vocabularies.
  'action',
  'event',
  'eventType',
  'status',
  'internalStatus',
  'customerStatus',
  'previousStatus',
  'newStatus',
  'provider',
  'source',
  'targetType',
  'aggregateType',
  'reasonCode',
  'errorClass',
  'errorCode',
  'outcome',
  'result',

  // Which record, by opaque identifier.
  //
  // `reference` is included deliberately and is the one judgement call here. It is
  // not personal data on its own, it is what a customer quotes when they call, and
  // without it a support conversation cannot be traced through the logs at all.
  // `email` and `name` are not included, so a reference in a log does not identify
  // a person without access to the database.
  'id',
  'enquiryId',
  'reference',
  'serviceId',
  'targetId',
  'deliveryId',
  'outboxId',
  'aggregateId',
  'subjectId',
  'actorSubjectId',
  'ownerId',
  'customerSubjectId',
  'authorSubjectId',
  'consumedBySubjectId',

  // Hashes, which are the point of hashing.
  'emailHash',
  'tokenHash',
  'ipHash',

  /**
   * The error itself. Allow-listed so `redactValue`'s `instanceof Error` branch
   * runs, which keeps the name and the stack - what identifies the code path - and
   * replaces the message, which is where a Postgres error quotes the failing row.
   * Redacting the key wholesale would discard the stack along with the message.
   */
  'err',
  'error',

  // Measurements and operational state.
  'durationMs',
  'attempt',
  'attempts',
  'count',
  'total',
  'limit',
  'statusCode',
  'responseCode',
  'method',
  'route',
  'service',
  'environment',
  'release',
  'version',
  'hostname',
  'pid',
  'lockedBy',
  'queue',
  'jobId',
  'level',
  'time',
  'msg',
  'type',

  /**
   * Timestamps. Useful and not personal on their own: the gap between `createdAt`
   * and a delivery attempt is how the outbox's latency is measured, and
   * `consentAt` appearing in a log is evidence that consent was recorded.
   */
  'createdAt',
  'updatedAt',
  'consentAt',
  'submittedAt',
  'availableAt',
  'expiresAt',
  'consumedAt',
  'occurredAt',
  'suppressedAt',
]);

/**
 * Keys that must never be logged even if a future edit adds them to the
 * allow-list.
 *
 * Belt and braces, and the reason is human rather than technical: the allow-list
 * is a long list that someone will one day extend in a hurry, and `message` looks
 * innocuous next to `msg`. A key in both lists is denied, and a test asserts the
 * two do not intersect so the contradiction is caught at build time rather than
 * silently resolved.
 */
export const NEVER_LOGGABLE: ReadonlySet<string> = new Set([
  /**
   * `name` is the collision that proves why both lists exist.
   *
   * `error.name` is a class name and entirely safe; `enquiry.name` is the
   * customer's name. One key, two meanings, and the safe-looking one is the reason
   * it would get allow-listed. Denying it costs nothing, because `redactValue`
   * builds its error shape as an object literal and never routes `error.name`
   * through this check.
   */
  'name',
  'message',
  'body',
  'reason',
  'note',
  'notes',
  'email',
  'phone',
  'displayName',
  'firstName',
  'lastName',
  'address',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'password',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'setCookie',
  'sessionId',
  'ip',
  'ipAddress',
  'payload',
  'safeDiff',
  'query',
  'params',
  'headers',
]);

const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 20;
const MAX_STRING_LENGTH = 512;

/**
 * `msg` is pino's own field and carries the log message the developer wrote, not
 * data from a record. It is allow-listed above, so it must not be matched against
 * `message` in the deny-list - hence exact-key comparison throughout rather than
 * substring matching.
 */
const isLoggable = (key: string): boolean => !NEVER_LOGGABLE.has(key) && LOGGABLE_FIELDS.has(key);

/**
 * Reduces an arbitrary value to something safe to log.
 *
 * Objects are filtered key by key. Anything not on the allow-list becomes
 * `[redacted]` rather than being dropped, because the *presence* of a field is
 * useful diagnostic information - "the request had a phone number and it was
 * rejected" - while its value is not.
 */
export function redactValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;

  if (depth >= MAX_DEPTH) {
    // A depth cap rather than cycle detection alone: a deeply nested structure can
    // produce a log line large enough to be dropped by the collector, which loses
    // the whole event including the parts that mattered.
    return '[truncated: max depth]';
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH
      ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`
      : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value;
  }

  if (value instanceof Date) return value.toISOString();

  if (value instanceof Error) {
    /**
     * Errors are reshaped rather than serialised.
     *
     * An error's `message` frequently contains exactly what must not be logged: a
     * Postgres error echoes the failing row, and a provider error echoes the
     * request body. The name and the call frames are kept because they identify the
     * code path; the message is not.
     */
    const stack = safeStack(value);

    return {
      name: value.name,
      message: REDACTED,
      ...(stack === undefined ? {} : { stack }),
      ...(hasSafeCode(value) ? { errorCode: value.code } : {}),
    };
  }

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => redactValue(item, depth + 1));
    return value.length > MAX_ARRAY_ITEMS
      ? [...items, `[truncated: ${String(value.length - MAX_ARRAY_ITEMS)} more]`]
      : items;
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      output[key] = isLoggable(key) ? redactValue(entry, depth + 1) : REDACTED;
    }

    return output;
  }

  // Functions, symbols, and anything else: the type is diagnostic, the value is not.
  return REDACTED;
}

function hasSafeCode(error: Error): error is Error & { code: string } {
  return typeof (error as { code?: unknown }).code === 'string';
}

/** Frames kept. Enough to identify the path without producing a line the collector drops. */
const MAX_STACK_FRAMES = 30;

/**
 * Returns only the call frames of a stack trace.
 *
 * The header line must go, and this is easy to miss: a V8 stack begins with
 * `${error.name}: ${error.message}`, so replacing `message` with `[redacted]` and
 * then keeping `stack` verbatim puts the message straight back into the log. That
 * defeats the entire point of redacting it, and it does so invisibly - the field
 * says `[redacted]` two keys above.
 *
 * Frames are retained because they are what an error log is actually for, and they
 * contain file paths and function names rather than data.
 */
function safeStack(error: Error): string | undefined {
  if (typeof error.stack !== 'string') return undefined;

  const frames = error.stack
    .split('\n')
    .filter((line) => /^\s+at\s/.test(line))
    .slice(0, MAX_STACK_FRAMES);

  return frames.length > 0 ? frames.join('\n') : undefined;
}

/**
 * Redacts a log binding object.
 *
 * The top level is filtered on the same allow-list as any nested object. There is
 * deliberately no "trusted top level": `logger.info({ message: enquiry.message })`
 * is the single most likely way an enquiry leaks into a log, and exempting the
 * top level would permit exactly that.
 */
export function redactBindings(bindings: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(bindings)) {
    output[key] = isLoggable(key) ? redactValue(value, 1) : REDACTED;
  }

  return output;
}
