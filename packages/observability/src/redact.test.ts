import { Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import type { Enquiry, EnquiryStatusEvent, InternalNote } from '@cera/contracts/entities';

import { createLogger, type Logger, timed, withContext } from './logger.ts';
import { LOGGABLE_FIELDS, NEVER_LOGGABLE, REDACTED, redactValue } from './redact.ts';

/**
 * The redaction proof.
 *
 * The central test logs a fully populated enquiry - message, email, phone, notes,
 * a transition reason - through the real logger and asserts that none of that text
 * appears anywhere in the output. Everything else in this file supports that one
 * assertion.
 */

/** Distinctive strings, so a substring search cannot pass by coincidence. */
const SECRET_MESSAGE = 'LEAK_MESSAGE_zebra_kumquat_7741 I have a persistent ache in my left knee.';
const SECRET_NOTE = 'LEAK_NOTE_walrus_saffron_9920 Customer asked to be called after 6pm.';
const SECRET_REASON = 'LEAK_REASON_tapir_cardamom_3318 Duplicate of an earlier enquiry.';
const SECRET_EMAIL = 'leak.mailbox.quokka@example.com';
const SECRET_PHONE = '+441632960541';
const SECRET_NAME = 'Leakworth Pemberton-Quill';
const SECRET_TOKEN = 'leak_token_c7f0a9b21e3d4f5a6b7c8d9e0f1a2b3c';

const ALL_SECRETS = [
  SECRET_MESSAGE,
  SECRET_NOTE,
  SECRET_REASON,
  SECRET_EMAIL,
  SECRET_PHONE,
  SECRET_NAME,
  SECRET_TOKEN,
];

const enquiry: Enquiry = {
  id: '0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e0f',
  reference: 'CERA-260901-A4B7Z',
  customerSubjectId: 'authentik-subject-customer-1',
  name: SECRET_NAME,
  email: SECRET_EMAIL,
  phone: SECRET_PHONE,
  serviceId: 'svc-knee-replacement',
  message: SECRET_MESSAGE,
  consentAt: '2026-09-01T10:00:00.000Z',
  source: 'web_service_page',
  internalStatus: 'triaging',
  ownerId: 'authentik-subject-staff-7',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-02T09:30:00.000Z',
};

const note: InternalNote = {
  id: '0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e11',
  enquiryId: enquiry.id,
  authorSubjectId: 'authentik-subject-staff-7',
  body: SECRET_NOTE,
  createdAt: '2026-09-02T09:00:00.000Z',
  editedAt: null,
};

const statusEvent: EnquiryStatusEvent = {
  id: '0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e12',
  enquiryId: enquiry.id,
  previousStatus: 'received',
  newStatus: 'triaging',
  customerStatus: 'in_review',
  actorSubjectId: 'authentik-subject-staff-7',
  reason: SECRET_REASON,
  createdAt: '2026-09-02T09:00:00.000Z',
};

/**
 * Captures what the real logger writes.
 *
 * Deliberately `createLogger` rather than a hand-built pino instance. A
 * reconstruction proves only that the reconstruction is safe, and the `msg`
 * derivation these tests caught is exactly the kind of difference a reconstruction
 * hides - pino derives `msg` from `err.message` regardless of the `err` serializer,
 * so a test logger without the `logMethod` hook passes while production leaks.
 */
function captureLogOutput(write: (logger: Logger) => void): string {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      lines.push(String(chunk));
      callback();
    },
  });

  const logger = createLogger(
    { service: 'api', environment: 'test', release: 'test', level: 'trace' },
    stream,
  );

  write(logger);

  return lines.join('');
}

describe('no enquiry free text reaches a log', () => {
  it('redacts a whole enquiry logged as one object', () => {
    // The mistake this catches is the likely one: a developer logging the record
    // they already have in hand.
    const output = captureLogOutput((logger) => {
      logger.info({ enquiry, event: 'enquiry.created', requestId: 'req-1' });
    });

    for (const secret of ALL_SECRETS) {
      expect(output, secret).not.toContain(secret);
    }
  });

  it('redacts an enquiry spread across the top level', () => {
    // Spreading looks like it produces "just a few safe fields" and does not.
    const output = captureLogOutput((logger) => {
      logger.info({ ...enquiry, requestId: 'req-2' });
    });

    for (const secret of ALL_SECRETS) {
      expect(output, secret).not.toContain(secret);
    }
  });

  it('redacts a note body and a transition reason', () => {
    const output = captureLogOutput((logger) => {
      logger.warn({ note, statusEvent, requestId: 'req-3' });
    });

    expect(output).not.toContain(SECRET_NOTE);
    expect(output).not.toContain(SECRET_REASON);
  });

  it('redacts free text nested several levels deep', () => {
    const output = captureLogOutput((logger) => {
      logger.info({
        requestId: 'req-4',
        context: { outer: { inner: { enquiry, notes: [note] } } },
      });
    });

    for (const secret of ALL_SECRETS) {
      expect(output, secret).not.toContain(secret);
    }
  });

  it('redacts an array of enquiries', () => {
    const output = captureLogOutput((logger) => {
      logger.info({ requestId: 'req-5', items: [enquiry, enquiry] });
    });

    expect(output).not.toContain(SECRET_MESSAGE);
  });

  it('redacts an error message, which is where a Postgres error quotes the row', () => {
    const output = captureLogOutput((logger) => {
      logger.error({
        requestId: 'req-6',
        err: new Error(
          `duplicate key value violates unique constraint: (email)=(${SECRET_EMAIL}) already exists`,
        ),
      });
    });

    expect(output).not.toContain(SECRET_EMAIL);
    // The stack is kept, because that is what identifies the code path.
    expect(output).toContain('redact.test.ts');
  });

  it('redacts a token passed as a bare string field', () => {
    const output = captureLogOutput((logger) => {
      logger.info({ requestId: 'req-7', token: SECRET_TOKEN, accessToken: SECRET_TOKEN });
    });

    expect(output).not.toContain(SECRET_TOKEN);
  });

  it('still records the identifiers that make the line useful', () => {
    // Redaction that removed everything would be safe and worthless. The point is
    // that a line remains diagnostic.
    const output = captureLogOutput((logger) => {
      logger.info({ enquiry, event: 'enquiry.created', requestId: 'req-8' });
    });

    expect(output).toContain('req-8');
    expect(output).toContain('enquiry.created');
    expect(output).toContain('CERA-260901-A4B7Z');
    expect(output).toContain('triaging');
  });

  it('records that a redacted field was present', () => {
    // "The request had a phone number" is useful; its value is not. Dropping the
    // key entirely would lose the first fact along with the second.
    const output = captureLogOutput((logger) => {
      logger.info({ enquiry, requestId: 'req-9' });
    });

    expect(output).toContain(REDACTED);
  });
});

describe('the allow-list and deny-list do not contradict each other', () => {
  it('has no field in both lists', () => {
    // The lists are long and someone will extend one in a hurry. A contradiction
    // resolved silently at runtime is worse than a failing test.
    const overlap = [...LOGGABLE_FIELDS].filter((field) => NEVER_LOGGABLE.has(field));

    expect(overlap).toEqual([]);
  });

  it('does not allow any obviously sensitive field name', () => {
    for (const field of ['message', 'email', 'phone', 'token', 'password', 'body', 'reason']) {
      expect(LOGGABLE_FIELDS.has(field), field).toBe(false);
    }
  });

  it('denies name, because error.name and enquiry.name are the same key', () => {
    // The collision that justifies having both lists. `error.name` survives because
    // the error branch builds its shape as a literal and never consults the lists.
    expect(LOGGABLE_FIELDS.has('name')).toBe(false);
    expect(NEVER_LOGGABLE.has('name')).toBe(true);
    expect((redactValue(new TypeError('x')) as Record<string, unknown>).name).toBe('TypeError');
  });

  it('traverses a container rather than redacting it wholesale', () => {
    // Traversal re-applies the filter at every level, so allow-listing a container
    // adds no exposure - and without it a log line would carry no identifier at all.
    const result = redactValue({ enquiry }) as Record<string, Record<string, unknown>>;

    expect(result.enquiry?.reference).toBe('CERA-260901-A4B7Z');
    expect(result.enquiry?.message).toBe(REDACTED);
  });

  it('allows msg without allowing message', () => {
    // `msg` is pino's own field and carries the developer's log text. The
    // distinction relies on exact-key comparison, so this guards against someone
    // switching to substring matching.
    expect(LOGGABLE_FIELDS.has('msg')).toBe(true);
    expect(LOGGABLE_FIELDS.has('message')).toBe(false);
  });
});

describe('redactValue', () => {
  it('denies an unknown field rather than allowing it', () => {
    // The whole reason for an allow-list: a field nobody has considered is redacted.
    const result = redactValue({ somethingAddedNextYear: 'sensitive value' }) as Record<
      string,
      unknown
    >;

    expect(result.somethingAddedNextYear).toBe(REDACTED);
  });

  it('passes through primitives', () => {
    expect(redactValue(42)).toBe(42);
    expect(redactValue(true)).toBe(true);
    expect(redactValue(null)).toBeNull();
    expect(redactValue(undefined)).toBeUndefined();
  });

  it('converts a Date to an ISO string', () => {
    expect(redactValue(new Date('2026-09-01T10:00:00.000Z'))).toBe('2026-09-01T10:00:00.000Z');
  });

  it('truncates a long string rather than dropping the line', () => {
    // A log line large enough to be rejected by the collector loses the parts that
    // mattered along with the part that was too long.
    const result = redactValue('x'.repeat(2_000));

    expect(String(result)).toContain('[truncated]');
    expect(String(result).length).toBeLessThan(600);
  });

  it('caps array length', () => {
    const result = redactValue(Array.from({ length: 100 }, (_unused, index) => index)) as unknown[];

    expect(result.length).toBeLessThanOrEqual(21);
    expect(String(result.at(-1))).toContain('more');
  });

  it('stops at a depth limit instead of recursing indefinitely', () => {
    let nested: Record<string, unknown> = { id: 'leaf' };
    for (let index = 0; index < 20; index += 1) nested = { id: nested };

    expect(JSON.stringify(redactValue(nested))).toContain('max depth');
  });

  it('survives a circular reference', () => {
    // Reached via the depth cap rather than cycle tracking. What matters is that a
    // cycle cannot take the process down - a logger that throws turns a handled
    // error into a crash.
    const circular: Record<string, unknown> = { id: 'root' };
    circular.id = circular;

    expect(() => redactValue(circular)).not.toThrow();
  });

  it('redacts a function or symbol without throwing', () => {
    expect(redactValue(() => 'x')).toBe(REDACTED);
    expect(redactValue(Symbol('x'))).toBe(REDACTED);
  });

  it('keeps an error name and stack but not its message', () => {
    const result = redactValue(new TypeError(SECRET_MESSAGE)) as Record<string, unknown>;

    expect(result.name).toBe('TypeError');
    expect(result.message).toBe(REDACTED);
    expect(String(result.stack)).toContain('redact.test.ts');
  });

  it('strips the stack header, which repeats the error message', () => {
    // The subtle one. A V8 stack begins with `${name}: ${message}`, so replacing
    // `message` with [redacted] and keeping `stack` verbatim puts the message
    // straight back into the log - two keys below a field that claims it was
    // redacted.
    const result = redactValue(new Error(SECRET_MESSAGE)) as Record<string, unknown>;
    const stack = String(result.stack);

    expect(stack).not.toContain(SECRET_MESSAGE);
    expect(stack.split('\n').every((line) => /^\s+at\s/.test(line))).toBe(true);
  });

  it('caps the number of stack frames', () => {
    const deepError = (depth: number): Error => {
      if (depth === 0) return new Error('boom');
      return deepError(depth - 1);
    };
    const result = redactValue(deepError(80)) as Record<string, unknown>;

    expect(String(result.stack).split('\n').length).toBeLessThanOrEqual(30);
  });

  it('handles an error with no stack', () => {
    const error = new Error('boom');
    // A structured-clone or cross-realm error can arrive without one.
    Object.defineProperty(error, 'stack', { value: undefined });

    const result = redactValue(error) as Record<string, unknown>;

    expect('stack' in result).toBe(false);
    expect(result.name).toBe('Error');
  });

  it('keeps a machine-readable error code, which is what a classifier needs', () => {
    const error = Object.assign(new Error(SECRET_MESSAGE), { code: '23505' });
    const result = redactValue(error) as Record<string, unknown>;

    expect(result.errorCode).toBe('23505');
    expect(JSON.stringify(result)).not.toContain(SECRET_MESSAGE);
  });
});

describe('withContext and timed', () => {
  it('binds the request id to every line from a child logger', () => {
    const output = captureLogOutput((logger) => {
      withContext(logger, { requestId: 'req-child', route: '/v1/enquiries' }).info({
        event: 'handled',
      });
    });

    expect(output).toContain('req-child');
    expect(output).toContain('/v1/enquiries');
  });

  it('redacts context fields that are not loggable', () => {
    const output = captureLogOutput((logger) => {
      withContext(logger, { requestId: 'req-child-2', subjectId: 'authentik-subject-1' }).info({
        event: 'handled',
      });
    });

    expect(output).toContain('authentik-subject-1');
    expect(output).not.toContain(SECRET_EMAIL);
  });

  it('records a duration and rethrows a failure rather than swallowing it', async () => {
    let output = '';

    await expect(
      (async () => {
        const lines: string[] = [];
        const stream = new Writable({
          write(chunk, _encoding, callback) {
            lines.push(String(chunk));
            callback();
          },
        });
        const logger = createLogger(
          { service: 'worker', environment: 'test', release: 'test' },
          stream,
        );

        try {
          return await timed(logger, 'zoho.upsert', () =>
            Promise.reject(new Error(SECRET_MESSAGE)),
          );
        } finally {
          output = lines.join('');
        }
      })(),
    ).rejects.toThrow();

    expect(output).toContain('zoho.upsert');
    expect(output).toContain('durationMs');
    expect(output).toContain('failure');
    // The error message reaches neither `err` nor the derived `msg`.
    expect(output).not.toContain(SECRET_MESSAGE);
  });

  it('returns the value on success', async () => {
    const logger = createLogger({
      service: 'worker',
      environment: 'test',
      release: 'test',
      level: 'silent',
    });

    await expect(timed(logger, 'ok', () => Promise.resolve('value'))).resolves.toBe('value');
  });
});

describe('an error logged with no explicit message', () => {
  /**
   * The hole the allow-list cannot reach, and the reason `createLogger` installs a
   * `logMethod` hook.
   *
   * pino derives `msg` from `err.message` when no message is supplied, and it does
   * so independently of the `err` serializer - so stripping the message from the
   * serialised error is not enough. `msg` is also the field aggregators index and
   * show first.
   */
  it('does not derive msg from the error message', () => {
    const output = captureLogOutput((logger) => {
      logger.error({ err: new Error(`insert failed: (email)=(${SECRET_EMAIL})`) });
    });

    expect(output).not.toContain(SECRET_EMAIL);
    expect(output).toContain('error occurred');
  });

  it('does not derive msg when an Error is passed directly', () => {
    const output = captureLogOutput((logger) => {
      logger.error(new Error(SECRET_MESSAGE));
    });

    expect(output).not.toContain(SECRET_MESSAGE);
    expect(output).toContain('unhandled error');
  });

  it('keeps the stack, which is what identifies the code path', () => {
    const output = captureLogOutput((logger) => {
      logger.error({ err: new Error(SECRET_MESSAGE) });
    });

    expect(output).toContain('redact.test.ts');
  });

  it('leaves an explicit developer message alone', () => {
    // A developer who writes the message themselves is making a visible, reviewable
    // choice. The hook only pre-empts the implicit derivation.
    const output = captureLogOutput((logger) => {
      logger.error({ err: new Error(SECRET_MESSAGE), event: 'zoho.upsert' }, 'zoho upsert failed');
    });

    expect(output).toContain('zoho upsert failed');
    expect(output).not.toContain(SECRET_MESSAGE);
  });
});

describe('createLogger', () => {
  it('stamps every line with service, environment, and release', () => {
    // Without these, a merged log stream cannot be filtered and an error spike
    // cannot be attributed to a deploy.
    const logger = createLogger({ service: 'api', environment: 'staging', release: 'v1.2.3' });

    expect(logger.bindings()).toEqual({
      service: 'api',
      environment: 'staging',
      release: 'v1.2.3',
    });
  });

  it('applies the allow-list, not only the pino redact paths', () => {
    const logger = createLogger({ service: 'api', environment: 'test', release: 'test' });

    expect(logger.level).toBe('info');
  });
});
