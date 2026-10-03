import { pino, type Logger, type LoggerOptions } from 'pino';

import { redactBindings } from './redact.ts';

import type { OperationContext } from './request-id.ts';
import type { Writable } from 'node:stream';

/**
 * The platform logger: JSON to stdout, one line per event, allow-list redacted.
 *
 * Stdout rather than a file or a direct network transport. The container runtime
 * collects stdout, so there is no log file to rotate, no buffer to lose on
 * SIGKILL, and no dependency on a collector being reachable at boot - a logger
 * that cannot start because the aggregator is down takes the service with it.
 */

export interface LoggerConfig {
  /** Which service emitted the line. Every line carries it; otherwise a merged stream is unreadable. */
  service: string;
  environment: string;
  /**
   * The deployed version, so a spike can be attributed to a release.
   *
   * Without it, "errors started at 14:05" and "we deployed at some point today"
   * are two separate facts nobody connects.
   */
  release: string;
  level?: string;
  /** Human-readable output for local development only. */
  pretty?: boolean;
}

/**
 * Keys pino itself populates from a request or response object.
 *
 * `redact` here is pino's own mechanism and is a deny-list, which contradicts the
 * rest of this module - deliberately. It is a second layer over the framework's
 * automatic request serialisers, which run before any of our code sees the object.
 * The allow-list in `redact.ts` governs everything the application logs
 * explicitly; this covers what pino adds on its own.
 */
const PINO_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'req.headers["proxy-authorization"]',
  'req.body',
  'req.query',
  'res.headers["set-cookie"]',
  'err.message',
];

/**
 * @param destination Overrides stdout. Exists so the redaction tests can assert on
 *   what the *real* logger writes. A test that reconstructs the pino options by
 *   hand proves only that the reconstruction is safe, and the `msg` derivation this
 *   module guards against was found precisely because a hand-built logger behaved
 *   differently from this one.
 */
export function createLogger(config: LoggerConfig, destination?: Writable): Logger {
  const options: LoggerOptions = {
    level: config.level ?? 'info',
    base: {
      service: config.service,
      environment: config.environment,
      release: config.release,
    },
    /**
     * ISO 8601 rather than pino's default epoch milliseconds.
     *
     * Slightly larger lines, and worth it: during an incident, logs are read
     * alongside Postgres timestamps, GlitchTip events, and a deploy record, none
     * of which use epoch millis. Converting in your head is a step that gets
     * skipped and then mis-remembered.
     */
    timestamp: pino.stdTimeFunctions.isoTime,
    /**
     * Every explicitly-logged object passes the allow-list.
     *
     * This is the hook that makes redaction unavoidable rather than a convention.
     * A developer calling `log.info({ enquiry })` cannot bypass it, because there
     * is no code path from a call site to the output that does not go through
     * here.
     */
    formatters: {
      log: redactBindings,
      /** `level: "info"` reads better in an aggregator than `level: 30`. */
      level: (label) => ({ level: label }),
    },
    redact: { paths: PINO_REDACT_PATHS, censor: '[redacted]' },
    /**
     * Deliberately no `serializers.err`.
     *
     * pino runs `formatters.log` *before* its serializers, so by the time an `err`
     * serializer would see the value, `redactBindings` has already reshaped it -
     * and a serializer would then receive a plain object and report `NonError`,
     * discarding the stack. Error shaping therefore lives in `redactValue`'s
     * `instanceof Error` branch, which keeps the name and stack and replaces the
     * message. One place, and it is the place that already runs.
     */
    /**
     * Closes the one hole the `formatters.log` allow-list cannot reach.
     *
     * pino derives `msg` from `err.message` whenever an `err` is logged without an
     * explicit message, and it does so *independently of the `err` serializer* -
     * so stripping the message above is not enough. `logger.error({ err })` on a
     * Postgres unique violation therefore writes the conflicting row into `msg`,
     * which is the field every aggregator indexes and displays first.
     *
     * Verified behaviour, not a precaution: with the serializer above in place,
     * `logger.error({ err: new Error('secret') })` emits
     * `"err":{"name":"Error","stack":"..."},"msg":"secret"`.
     *
     * Supplying an explicit message pre-empts the derivation. A developer who
     * writes `log.error({ err }, err.message)` still leaks, and that is acceptable:
     * it is a visible, reviewable act rather than a default.
     */
    hooks: {
      logMethod(args, method) {
        const [first] = args;

        if (first instanceof Error) {
          // `logger.error(error)` - reshape so the serializer applies at all.
          return method.call(this, { err: first }, 'unhandled error');
        }

        if (args.length === 1 && typeof first === 'object' && first !== null && 'err' in first) {
          return method.call(this, first, 'error occurred');
        }

        return method.apply(this, args);
      },
    },
    ...(config.pretty === true
      ? { transport: { target: 'pino-pretty', options: { colorize: true, singleLine: false } } }
      : {}),
  };

  return destination === undefined ? pino(options) : pino(options, destination);
}

/**
 * A child logger bound to one operation.
 *
 * Preferred over passing the request ID to every call. A caller that has to
 * remember it will eventually not, and a log line without a request ID cannot be
 * correlated - which is when it is needed most.
 */
export function withContext(logger: Logger, context: OperationContext): Logger {
  return logger.child(redactBindings({ ...context }));
}

/**
 * Times an operation and logs the outcome once, with `durationMs`.
 *
 * One line per operation rather than a start line and an end line. Two lines
 * double the volume and, more importantly, a start line with no matching end is
 * indistinguishable from a collector dropping the second - so "did this finish"
 * becomes unanswerable exactly when it matters.
 */
export async function timed<T>(
  logger: Logger,
  event: string,
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = process.hrtime.bigint();

  try {
    const result = await operation();

    logger.info({ event, outcome: 'success', durationMs: elapsedMs(startedAt) }, event);

    return result;
  } catch (error) {
    /**
     * Logged and rethrown, not swallowed.
     *
     * The caller decides what an error means; this only records that it happened
     * and how long it took. Swallowing here would turn a failed erpnext delivery into
     * a silent success and leave the outbox row marked done.
     */
    // The event name is passed as the message explicitly. Without it pino derives
    // `msg` from `err.message`, which for a provider or database error is the
    // request it failed on.
    logger.error(
      { event, outcome: 'failure', durationMs: elapsedMs(startedAt), err: error },
      event,
    );

    throw error;
  }
}

function elapsedMs(startedAt: bigint): number {
  // Rounded to a tenth of a millisecond. Full nanosecond precision makes every
  // duration a unique string, which defeats aggregation in the log backend.
  return Math.round(Number(process.hrtime.bigint() - startedAt) / 100_000) / 10;
}

export type { Logger };
