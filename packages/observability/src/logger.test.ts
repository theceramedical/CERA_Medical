import { Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { createLogger, timed, withContext } from './index.ts';

import type { Logger, LoggerConfig } from './index.ts';

/**
 * Asserts on the real logger's output rather than a reconstruction of its options.
 *
 * `redact.test.ts` covers what must never reach the output; this file covers what
 * must always be there. Both go through `createLogger`, because the two bugs this
 * module has had - pino deriving `msg` from `err.message`, and `formatters.log`
 * running before serializers - were both invisible to a hand-built logger.
 */
function captureLines(
  use: (logger: Logger) => void | Promise<void>,
  overrides: Partial<LoggerConfig> = {},
): Promise<Record<string, unknown>[]> {
  const lines: Record<string, unknown>[] = [];

  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      for (const line of chunk.toString('utf8').split('\n')) {
        if (line.trim() !== '') lines.push(JSON.parse(line) as Record<string, unknown>);
      }
      callback();
    },
  });

  const logger = createLogger(
    { service: 'api', environment: 'test', release: '1.4.2', level: 'debug', ...overrides },
    destination,
  );

  return Promise.resolve(use(logger)).then(() => lines);
}

/** Asserts the logger wrote exactly one line and hands it back. */
async function captureOneLine(
  use: (logger: Logger) => void | Promise<void>,
): Promise<Record<string, unknown>> {
  const lines = await captureLines(use);

  expect(lines).toHaveLength(1);

  return lines[0]!;
}

describe('createLogger base fields', () => {
  it('stamps every line with service, environment, and release', async () => {
    // Without the release, "errors started at 14:05" and "we deployed today" stay
    // two unconnected facts.
    const line = await captureOneLine((logger) => {
      logger.info({ event: 'enquiry.created' }, 'enquiry.created');
    });

    expect(line).toMatchObject({
      service: 'api',
      environment: 'test',
      release: '1.4.2',
      event: 'enquiry.created',
    });
  });

  it('writes the level as a label, not a number', async () => {
    const line = await captureOneLine((logger) => {
      logger.warn({ event: 'rate_limit.hit' }, 'rate_limit.hit');
    });

    expect(line.level).toBe('warn');
  });

  it('writes an ISO 8601 timestamp', async () => {
    // Read alongside Postgres timestamps and GlitchTip events during an incident,
    // none of which use epoch milliseconds.
    const line = await captureOneLine((logger) => {
      logger.info({ event: 'boot' }, 'boot');
    });

    expect(line.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('honours the level, so debug lines stay out of production', async () => {
    const lines = await captureLines(
      (logger) => {
        logger.debug({ event: 'cache.probe' }, 'cache.probe');
      },
      { environment: 'production', level: 'info' },
    );

    expect(lines).toHaveLength(0);
  });
});

describe('withContext', () => {
  it('binds the request ID to every line from the child', async () => {
    // The alternative is passing the request ID at each call site, and a caller who
    // has to remember it eventually will not - producing exactly the uncorrelatable
    // line that is needed most.
    const lines = await captureLines((logger) => {
      const scoped = withContext(logger, {
        requestId: '0b9c1d2e-3f40-7a1b-8c2d-3e4f5a6b7c8d',
        route: '/api/v1/enquiries',
        method: 'POST',
      });

      scoped.info({ event: 'first' }, 'first');
      scoped.info({ event: 'second' }, 'second');
    });

    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line.requestId).toBe('0b9c1d2e-3f40-7a1b-8c2d-3e4f5a6b7c8d');
    }
  });

  it('redacts context it does not recognise', async () => {
    const line = await captureOneLine((logger) => {
      // @ts-expect-error - deliberately passing a field outside OperationContext, as
      // a future caller widening the type without checking the allow-list would.
      withContext(logger, { requestId: 'req-1', customerEmail: 'a@b.test' }).info(
        { event: 'x' },
        'x',
      );
    });

    expect(JSON.stringify(line)).not.toContain('a@b.test');
  });
});

describe('timed', () => {
  it('logs one line with durationMs and returns the result', async () => {
    let returned: string | undefined;

    // One line, not a start and an end: a start with no matching end is
    // indistinguishable from a dropped line, which makes "did this finish"
    // unanswerable. `captureOneLine` asserts the count.
    const line = await captureOneLine(async (logger) => {
      returned = await timed(logger, 'erpnext.upsert', () => Promise.resolve('lead-99'));
    });

    expect(returned).toBe('lead-99');
    expect(line).toMatchObject({ event: 'erpnext.upsert', outcome: 'success', level: 'info' });
    expect(typeof line.durationMs).toBe('number');
  });

  it('rethrows on failure, so a failed delivery is not marked done', async () => {
    const line = await captureOneLine(async (logger) => {
      await expect(
        timed(logger, 'erpnext.upsert', () => Promise.reject(new Error('lead 4815 rejected'))),
      ).rejects.toThrow('lead 4815 rejected');
    });

    expect(line).toMatchObject({ event: 'erpnext.upsert', outcome: 'failure', level: 'error' });
  });

  it('does not put the upstream error message in msg', async () => {
    // The event name is passed as the message explicitly for this reason: pino
    // derives `msg` from `err.message`, and for a provider error that message is
    // the request it failed on.
    const line = await captureOneLine(async (logger) => {
      await expect(
        timed(logger, 'resend.send', () =>
          Promise.reject(new Error('smtp: recipient patient@example.test unknown')),
        ),
      ).rejects.toThrow();
    });

    expect(line.msg).toBe('resend.send');
    expect(JSON.stringify(line)).not.toContain('patient@example.test');
  });

  it('measures elapsed time at a tenth of a millisecond', async () => {
    const line = await captureOneLine(async (logger) => {
      await timed(logger, 'slow', () => new Promise((resolve) => setTimeout(resolve, 20)));
    });

    const durationMs = line.durationMs as number;

    expect(durationMs).toBeGreaterThanOrEqual(15);
    // Rounded rather than full nanosecond precision: a unique duration string per
    // call defeats aggregation in the log backend.
    expect(durationMs * 10).toBe(Math.round(durationMs * 10));
  });
});
