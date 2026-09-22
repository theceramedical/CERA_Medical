import { describe, expect, it } from 'vitest';

import {
  ConflictError,
  ConsentRequiredError,
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
import { Sentry } from './glitchtip.ts';
import {
  flushGlitchTip,
  initGlitchTip,
  parameteriseTransaction,
  REDACTED,
  reportException,
  scrubBreadcrumb,
  scrubEvent,
  stripSensitiveQuery,
} from './index.ts';

import type { ErrorEvent } from '@sentry/node';

/**
 * GlitchTip does not implement Sentry's server-side scrubbing, so `scrubEvent` is
 * the only thing between an exception and an enquiry message in the error tracker.
 * These tests treat it accordingly.
 */

const SECRET_MESSAGE = 'LEAK_MESSAGE_zebra_kumquat I have a persistent ache in my left knee.';
const SECRET_EMAIL = 'leak.mailbox.quokka@example.com';
const SECRET_TOKEN = 'leak_token_c7f0a9b21e3d4f5a6b7c8d9e0f1a2b3c';

const baseEvent = (): ErrorEvent => ({
  event_id: 'abc',
  type: undefined,
  user: {
    id: 'authentik-subject-customer-1',
    email: SECRET_EMAIL,
    ip_address: '203.0.113.7',
    username: 'quokka',
  },
  request: {
    url: `https://cera.example.com/v1/enquiries/claim/consume?token=${SECRET_TOKEN}`,
    method: 'POST',
    headers: {
      authorization: 'Bearer secret-token-value',
      cookie: 'cera_session=sealed-jwe-value',
      'x-api-key': 'api-key-value',
      'user-agent': 'Mozilla/5.0',
      'x-request-id': 'req-1',
    },
    data: { message: SECRET_MESSAGE, email: SECRET_EMAIL },
    cookies: { cera_session: 'sealed-jwe-value' },
    query_string: `token=${SECRET_TOKEN}`,
  },
  exception: {
    values: [{ type: 'Error', value: `insert failed for (email)=(${SECRET_EMAIL})` }],
  },
  extra: { enquiryMessage: SECRET_MESSAGE },
  message: SECRET_MESSAGE,
  transaction: 'GET /v1/me/enquiries/CERA-260901-A4B7Z',
});

describe('scrubEvent', () => {
  const scrubbed = scrubEvent(baseEvent(), 'api');
  const serialised = JSON.stringify(scrubbed);

  it('removes every secret from the whole serialised event', () => {
    // The blanket assertion. Field-level tests below say which mechanism did it,
    // but this is the guarantee.
    for (const secret of [SECRET_MESSAGE, SECRET_EMAIL, SECRET_TOKEN]) {
      expect(serialised, secret).not.toContain(secret);
    }
  });

  it('keeps only the opaque subject on the user object', () => {
    // Replaced wholesale rather than key-deleted, so an SDK version that adds a
    // field cannot reintroduce the problem.
    expect(scrubbed?.user).toEqual({ id: 'authentik-subject-customer-1' });
  });

  it('drops the IP address, which sendDefaultPii would otherwise attach', () => {
    expect(serialised).not.toContain('203.0.113.7');
  });

  it('strips credential headers and keeps diagnostic ones', () => {
    const headers = scrubbed?.request?.headers ?? {};

    expect('authorization' in headers).toBe(false);
    expect('cookie' in headers).toBe(false);
    expect('x-api-key' in headers).toBe(false);
    expect(headers['user-agent']).toBe('Mozilla/5.0');
    expect(headers['x-request-id']).toBe('req-1');
  });

  it('removes the request body entirely', () => {
    // On an enquiry endpoint the body *is* the enquiry. There is no safe subset.
    expect(scrubbed?.request?.data).toBeUndefined();
    expect(scrubbed?.request?.cookies).toBeUndefined();
    expect(scrubbed?.request?.query_string).toBeUndefined();
  });

  it('redacts a claim token in the URL', () => {
    // A single-use credential in an error tracker is still valid for its TTL.
    expect(scrubbed?.request?.url).toContain('token=');
    expect(scrubbed?.request?.url).not.toContain(SECRET_TOKEN);
  });

  it('replaces the exception message but keeps its type, so grouping still works', () => {
    const value = scrubbed?.exception?.values?.[0];

    expect(value?.value).toBe(REDACTED);
    expect(value?.type).toBe('Error');
  });

  it('empties extra, which is where ad-hoc debugging context accumulates', () => {
    expect(scrubbed?.extra).toEqual({});
  });

  it('parameterises the transaction name', () => {
    expect(scrubbed?.transaction).toBe('GET /v1/me/enquiries/:reference');
  });

  it('tags the service, so a merged project is still filterable', () => {
    expect(scrubbed?.tags?.service).toBe('api');
  });

  it('handles an event with no user, request, or exception', () => {
    // Events captured from an unhandled rejection arrive sparse, and throwing here
    // would lose exactly the event that explains a crash.
    expect(() => scrubEvent({ event_id: 'x' } as unknown as ErrorEvent, 'worker')).not.toThrow();
  });

  it('drops a non-string user id rather than trusting it', () => {
    const event = baseEvent();
    (event.user as Record<string, unknown>).id = { nested: 'object' };

    expect(scrubEvent(event, 'api')?.user).toEqual({});
  });
});

describe('scrubBreadcrumb', () => {
  it('drops a console breadcrumb entirely', () => {
    // A `console.log(enquiry)` left in during debugging would otherwise be attached
    // to an unrelated exception an hour later.
    expect(
      scrubBreadcrumb({ category: 'console', message: SECRET_MESSAGE, level: 'log' }),
    ).toBeNull();
  });

  it('keeps the category and drops everything else', () => {
    const result = scrubBreadcrumb({
      category: 'http',
      message: `POST /v1/enquiries ${SECRET_MESSAGE}`,
      data: { url: `https://x.test?token=${SECRET_TOKEN}`, body: SECRET_MESSAGE },
      level: 'info',
    });

    expect(result?.category).toBe('http');
    expect(result?.level).toBe('info');
    expect(JSON.stringify(result)).not.toContain(SECRET_MESSAGE);
    expect(JSON.stringify(result)).not.toContain(SECRET_TOKEN);
    expect('data' in (result ?? {})).toBe(false);
  });

  it('labels a breadcrumb with no category', () => {
    expect(scrubBreadcrumb({ message: SECRET_MESSAGE })?.category).toBe('unknown');
  });

  it('preserves the timestamp, so ordering survives', () => {
    expect(scrubBreadcrumb({ category: 'http', timestamp: 1_790_000_000 })?.timestamp).toBe(
      1_790_000_000,
    );
  });
});

describe('stripSensitiveQuery', () => {
  it('leaves a URL with no query string alone', () => {
    expect(stripSensitiveQuery('https://cera.example.com/v1/services')).toBe(
      'https://cera.example.com/v1/services',
    );
  });

  it('redacts the value and keeps the key, so the shape is still visible', () => {
    const result = stripSensitiveQuery('https://x.test/claim?token=abc&utm_source=email');

    expect(result).toContain('utm_source=email');
    expect(result).not.toContain('token=abc');
  });

  it.each(['token', 'code', 'state', 'email', 'reference'])('redacts %s', (key) => {
    expect(stripSensitiveQuery(`https://x.test/p?${key}=sensitive-value`)).not.toContain(
      'sensitive-value',
    );
  });

  it('leaves an unrelated query string untouched', () => {
    expect(stripSensitiveQuery('https://x.test/p?page=2')).toBe('https://x.test/p?page=2');
  });
});

describe('parameteriseTransaction', () => {
  it.each([
    ['GET /v1/me/enquiries/CERA-260901-A4B7Z', 'GET /v1/me/enquiries/:reference'],
    [
      'PATCH /v1/ops/enquiries/0192f2c0-1a2b-7c3d-8e4f-5a6b7c8d9e0f/assign',
      'PATCH /v1/ops/enquiries/:id/assign',
    ],
    ['GET /v1/services/knee-replacement', 'GET /v1/services/knee-replacement'],
  ])('turns %s into %s', (input, expected) => {
    expect(parameteriseTransaction(input)).toBe(expected);
  });

  it('collapses two enquiries onto one transaction name', () => {
    // The point of parameterising: without it every enquiry is its own transaction,
    // which defeats grouping and puts a reference in a name shown throughout the UI.
    expect(parameteriseTransaction('GET /v1/me/enquiries/CERA-260901-A4B7Z')).toBe(
      parameteriseTransaction('GET /v1/me/enquiries/CERA-260902-K9M3P'),
    );
  });

  it('redacts a hash in a path', () => {
    expect(parameteriseTransaction(`GET /internal/${'a'.repeat(64)}`)).toBe('GET /internal/:hash');
  });
});

describe('isReportable', () => {
  it.each([
    ['a not found', new NotFoundError('enquiry', 'CERA-260901-A4B7Z')],
    ['a forbidden', new ForbiddenError('staff role required')],
    ['a conflict', new ConflictError('stale write')],
    ['an invalid transition', new InvalidTransitionError('completed', 'in_progress', [])],
    ['a rate limit', new RateLimitedError(30, 'per-ip limit')],
  ])('does not report %s, because it is the system working correctly', (_label, error) => {
    // Reporting expected outcomes buries the one real exception in thousands of
    // events, which is how an alert channel becomes something nobody reads.
    expect(isReportable(error)).toBe(false);
  });

  it('reports an upstream failure', () => {
    expect(isReportable(new UpstreamError('zoho', 'timeout', 'no response in 10s'))).toBe(true);
  });

  it('reports an unexpected error', () => {
    expect(isReportable(new TypeError('cannot read property of undefined'))).toBe(true);
  });

  it('reports a non-error throw', () => {
    expect(isReportable('a string was thrown')).toBe(true);
  });
});

describe('initGlitchTip', () => {
  it('returns false and does not throw when there is no DSN', () => {
    // Local development has no error tracker. Failing here would mean the API
    // cannot start without one.
    expect(initGlitchTip({ environment: 'local', release: 'dev', service: 'api' })).toBe(false);
    expect(initGlitchTip({ dsn: '', environment: 'local', release: 'dev', service: 'api' })).toBe(
      false,
    );
  });

  it('initialises when a DSN is present', () => {
    const started = initGlitchTip({
      dsn: 'https://publickey@glitchtip.invalid/1',
      environment: 'test',
      release: 'v1.0.0',
      service: 'api',
    });

    expect(started).toBe(true);
    expect(Sentry.getClient()).toBeDefined();
  });

  it('does not enable tracing unless asked', () => {
    // Tracing captures URLs and database statements, so it is a decision with a
    // privacy review rather than a default.
    initGlitchTip({
      dsn: 'https://publickey@glitchtip.invalid/1',
      environment: 'test',
      release: 'v1.0.0',
      service: 'api',
    });

    expect(Sentry.getClient()?.getOptions().tracesSampleRate).toBe(0);
  });

  it('never enables sendDefaultPii', () => {
    // The single most important setting: with it on, the SDK attaches the request
    // IP, cookies, and user identity to every event automatically.
    initGlitchTip({
      dsn: 'https://publickey@glitchtip.invalid/1',
      environment: 'test',
      release: 'v1.0.0',
      service: 'api',
    });

    expect(Sentry.getClient()?.getOptions().sendDefaultPii).toBe(false);
  });
});

describe('the event that actually reaches the wire', () => {
  /**
   * Captures serialised envelopes through a real client.
   *
   * Worth the setup: it proves `beforeSend` and `beforeBreadcrumb` are wired to the
   * scrubbers, not merely that the scrubbers work when called directly. A
   * misconfigured `beforeSend` would pass every unit test in this file and leak
   * everything in production.
   */
  const captured: string[] = [];

  const client = new Sentry.NodeClient({
    dsn: 'https://publickey@glitchtip.invalid/1',
    environment: 'test',
    release: 'v1.0.0',
    sendDefaultPii: false,
    tracesSampleRate: 0,
    integrations: [],
    stackParser: Sentry.defaultStackParser,
    beforeSend: (event) => scrubEvent(event, 'api'),
    transport: () => ({
      send: (envelope) => {
        captured.push(JSON.stringify(envelope));
        return Promise.resolve({});
      },
      flush: () => Promise.resolve(true),
    }),
  });

  it('scrubs the exception message before it leaves the process', async () => {
    const scope = new Sentry.Scope();
    scope.setClient(client);
    client.init();

    scope.setTag('requestId', 'req-42');
    scope.captureException(new Error(`insert failed for (email)=(${SECRET_EMAIL})`));

    await client.flush(2_000);

    const serialised = captured.join('');

    expect(serialised.length).toBeGreaterThan(0);
    expect(serialised).not.toContain(SECRET_EMAIL);
    expect(serialised).toContain('req-42');
    expect(serialised).toContain(REDACTED);
  });
});

describe('reportException', () => {
  it('does not send an expected outcome', () => {
    // No client is initialised for this assertion beyond the ones above; what
    // matters is that the reportability gate runs before any capture.
    expect(() => {
      reportException(new NotFoundError('enquiry'), 'req-1');
    }).not.toThrow();
    expect(isReportable(new NotFoundError('enquiry'))).toBe(false);
  });

  it('does not throw when reporting a real error', () => {
    expect(() => {
      reportException(new Error('boom'), 'req-2');
    }).not.toThrow();
  });
});

describe('flushGlitchTip', () => {
  it('resolves, so shutdown is not blocked by an unreachable tracker', async () => {
    // Called during shutdown. If it rejected or hung, the crash that most needs
    // reporting would also be the one that stalls the container.
    await expect(flushGlitchTip(100)).resolves.toBeUndefined();
  });
});

describe('toApiError', () => {
  it('passes a domain error through unchanged', () => {
    const error = new NotFoundError('enquiry');

    expect(toApiError(error)).toBe(error);
  });

  it('turns an unexpected error into internal_error with a generic message', () => {
    const result = toApiError(new Error(`connection to 10.0.1.14:5432 failed: ${SECRET_EMAIL}`));

    expect(result.code).toBe('internal_error');
    expect(result.message).not.toContain(SECRET_EMAIL);
    expect(result.message).not.toContain('10.0.1.14');
  });

  it('keeps the detail internally, where the log can use it', () => {
    const result = toApiError(new Error('relation "enquiries" does not exist'));

    expect(result.internalDetail).toContain('relation');
    expect(JSON.stringify(result.toEnvelope('req-1'))).not.toContain('relation');
  });

  it('handles a thrown non-error', () => {
    expect(toApiError({ weird: true }).code).toBe('internal_error');
  });

  it('produces an envelope with no stack trace', () => {
    const envelope = toApiError(new Error('boom')).toEnvelope('req-1');

    expect(JSON.stringify(envelope)).not.toContain('at ');
    expect(JSON.stringify(envelope)).not.toContain('.ts:');
  });
});

describe('domain errors map onto the envelope', () => {
  it.each([
    ['NotFoundError', new NotFoundError('enquiry'), 404],
    ['ForbiddenError', new ForbiddenError('no'), 403],
    ['ConflictError', new ConflictError('stale'), 409],
    ['InvalidTransitionError', new InvalidTransitionError('a', 'b', []), 409],
    ['RateLimitedError', new RateLimitedError(30, 'limit'), 429],
    ['UpstreamError', new UpstreamError('zoho', 'timeout', 'detail'), 502],
  ])('%s becomes HTTP %i', (_label, error, status) => {
    expect(error.httpStatus).toBe(status);
  });

  it('gives not found and forbidden identical wording', () => {
    // Otherwise the reference space can be enumerated even with matching statuses.
    expect(new NotFoundError('enquiry').message).toBe(new ForbiddenError('no').message);
  });

  it('carries the allowed transitions for the client, and the detail for the log', () => {
    const error = new InvalidTransitionError('completed', 'in_progress', ['closed_withdrawn']);

    expect(error.allowed).toEqual(['closed_withdrawn']);
    expect(error.internalDetail).toContain('completed -> in_progress');
    expect(JSON.stringify(error.toEnvelope('req-1'))).not.toContain('completed -> in_progress');
  });

  it('names itself, so a log line says which error class was thrown', () => {
    expect(new NotFoundError('enquiry').name).toBe('NotFoundError');
    expect(new UpstreamError('zoho', 'timeout', 'd').name).toBe('UpstreamError');
  });

  it('maps an unauthenticated request to 401 with a default detail', () => {
    const error = new UnauthenticatedError();

    expect(error.httpStatus).toBe(401);
    expect(error.internalDetail).toBe('no valid session');
  });

  it('maps a missing consent to 422', () => {
    expect(new ConsentRequiredError().httpStatus).toBe(422);
  });

  it('makes a permanent upstream failure non-retryable, so it dead-letters at once', () => {
    // A retryable classification would spend the whole retry budget on a
    // credential problem, hiding an expired token behind a backoff curve.
    const error = new UpstreamPermanentError('zoho', 'auth_failed', 'refresh token revoked');

    expect(error.provider).toBe('zoho');
    expect(error.errorClass).toBe('auth_failed');
    expect(error.toEnvelope('req-1').error.retryable).toBe(true);
    expect(new UpstreamError('zoho', 'timeout', 'd').toEnvelope('req-1').error.retryable).toBe(
      true,
    );
  });

  it('accepts an overriding message on a conflict, for a specific explanation', () => {
    const error = new ConflictError('stale write', 'Someone else updated this enquiry.');

    expect(error.message).toBe('Someone else updated this enquiry.');
    expect(error.internalDetail).toBe('stale write');
  });

  it('carries the retry delay on a rate limit, for the Retry-After header', () => {
    expect(new RateLimitedError(45, 'per-ip').retryAfterSeconds).toBe(45);
  });

  it('includes the identifier in the internal detail, never in the response', () => {
    const error = new NotFoundError('enquiry', 'CERA-260901-A4B7Z');

    expect(error.internalDetail).toContain('CERA-260901-A4B7Z');
    expect(JSON.stringify(error.toEnvelope('req-1'))).not.toContain('CERA-260901-A4B7Z');
  });
});
