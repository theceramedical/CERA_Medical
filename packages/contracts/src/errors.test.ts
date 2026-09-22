import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { EnquiryInputSchema } from './entities.ts';
import {
  ApiError,
  buildErrorEnvelope,
  DEFAULT_ERROR_MESSAGES,
  ErrorCodeSchema,
  ErrorEnvelopeSchema,
  fieldErrorsFromZod,
  HTTP_STATUS_BY_ERROR_CODE,
  httpStatusFor,
} from './errors.ts';

describe('error code table', () => {
  it('covers every code', () => {
    expect(Object.keys(HTTP_STATUS_BY_ERROR_CODE).sort()).toEqual(
      [...ErrorCodeSchema.options].sort(),
    );
    expect(Object.keys(DEFAULT_ERROR_MESSAGES).sort()).toEqual([...ErrorCodeSchema.options].sort());
  });

  it('marks exactly the transient conditions as retryable', () => {
    const retryable = Object.entries(HTTP_STATUS_BY_ERROR_CODE)
      .filter(([, value]) => value.retryable)
      .map(([code]) => code)
      .sort();

    // A retryable validation error would make clients hammer an endpoint that
    // will never accept the request; a non-retryable rate limit would make them
    // give up on a condition that clears in seconds.
    expect(retryable).toEqual(['internal_error', 'rate_limited', 'upstream_unavailable']);
  });

  it('maps 4xx to client errors and 5xx to server errors', () => {
    expect(httpStatusFor('validation_failed')).toBe(400);
    expect(httpStatusFor('rate_limited')).toBe(429);
    expect(httpStatusFor('upstream_unavailable')).toBe(502);
    expect(httpStatusFor('internal_error')).toBe(500);
  });
});

describe('not_found and forbidden are indistinguishable', () => {
  it('uses identical wording', () => {
    // The API must not be an existence oracle: an enquiry belonging to another
    // customer returns not_found, and a different message would defeat that even
    // with a matching status code.
    expect(DEFAULT_ERROR_MESSAGES.not_found).toBe(DEFAULT_ERROR_MESSAGES.forbidden);
  });

  it('produces bodies that differ only by code', () => {
    const notFound = buildErrorEnvelope({ code: 'not_found', requestId: 'req-1' });
    const forbidden = buildErrorEnvelope({ code: 'forbidden', requestId: 'req-1' });

    expect(notFound.error.message).toBe(forbidden.error.message);
    expect(notFound.error.retryable).toBe(forbidden.error.retryable);
  });
});

describe('buildErrorEnvelope', () => {
  it('derives retryability rather than accepting it', () => {
    expect(buildErrorEnvelope({ code: 'rate_limited', requestId: 'r' }).error.retryable).toBe(true);
    expect(buildErrorEnvelope({ code: 'forbidden', requestId: 'r' }).error.retryable).toBe(false);
  });

  it('always carries the request id', () => {
    expect(buildErrorEnvelope({ code: 'internal_error', requestId: 'req-abc' }).requestId).toBe(
      'req-abc',
    );
  });

  it('omits fieldErrors entirely when there are none', () => {
    const envelope = buildErrorEnvelope({
      code: 'internal_error',
      requestId: 'r',
      fieldErrors: [],
    });

    expect('fieldErrors' in envelope.error).toBe(false);
  });

  it('produces a body that validates against its own schema', () => {
    const envelope = buildErrorEnvelope({
      code: 'validation_failed',
      requestId: 'req-1',
      fieldErrors: [
        { path: 'email', code: 'invalid_email', message: 'Enter a valid email address' },
      ],
    });

    expect(ErrorEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });
});

describe('fieldErrorsFromZod', () => {
  it('reports every invalid field at once', () => {
    // One error per request would turn filling in a form into a guessing game.
    const result = EnquiryInputSchema.safeParse({
      name: 'A',
      email: 'not-an-email',
      serviceId: '',
      message: 'short',
      consent: false,
      source: 'web_general',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const fieldErrors = fieldErrorsFromZod(result.error);
    const paths = fieldErrors.map((error) => error.path).sort();

    expect(paths).toEqual(['consent', 'email', 'message', 'name', 'serviceId']);
  });

  it('does not echo the submitted value', () => {
    // Including the value would put the enquiry message into an error response
    // and from there into any client-side log.
    const secret = 'my private medical concern about a recurring issue';
    const result = EnquiryInputSchema.safeParse({
      name: 'Alex Morgan',
      email: 'bad',
      serviceId: 'svc-1',
      message: secret,
      consent: true,
      source: 'web_general',
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(JSON.stringify(fieldErrorsFromZod(result.error))).not.toContain(secret);
  });

  it('caps the number of field errors', () => {
    const schema = z.object(
      Object.fromEntries(
        Array.from({ length: 80 }, (_unused, index) => [`field${index}`, z.string()]),
      ),
    );
    const result = schema.safeParse({});

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(fieldErrorsFromZod(result.error).length).toBeLessThanOrEqual(50);
  });
});

describe('consent handling', () => {
  it('rejects a submission where consent is false', () => {
    // Consent is a literal true rather than a boolean, so an unconsented
    // submission fails validation itself instead of relying on a later branch
    // that could be removed (PRD 10).
    const result = EnquiryInputSchema.safeParse({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      serviceId: 'svc-1',
      message: 'I would like to ask about availability for an assessment.',
      consent: false,
      source: 'web_general',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a submission with consent absent', () => {
    const result = EnquiryInputSchema.safeParse({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      serviceId: 'svc-1',
      message: 'I would like to ask about availability for an assessment.',
      source: 'web_general',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a complete, consented submission', () => {
    const result = EnquiryInputSchema.safeParse({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '+441632960001',
      serviceId: 'svc-1',
      message: 'I would like to ask about availability for an assessment.',
      consent: true,
      source: 'web_service_page',
    });

    expect(result.success).toBe(true);
  });
});

describe('EnquiryInputSchema field control', () => {
  it('does not accept a client-supplied internal status, owner, or reference', () => {
    // Accepting the full entity and stripping fields afterwards is how
    // mass-assignment bugs happen. These simply are not in the input schema.
    const inputKeys = Object.keys(EnquiryInputSchema.shape);

    expect(inputKeys).not.toContain('internalStatus');
    expect(inputKeys).not.toContain('ownerId');
    expect(inputKeys).not.toContain('reference');
    expect(inputKeys).not.toContain('consentAt');
    expect(inputKeys).not.toContain('customerSubjectId');
  });
});

describe('ApiError', () => {
  it('carries the right status and serialises to an envelope', () => {
    const error = new ApiError('invalid_transition', {
      message: 'Cannot move a completed enquiry back to in progress.',
    });

    expect(error.httpStatus).toBe(409);
    expect(error.toEnvelope('req-9')).toEqual({
      error: {
        code: 'invalid_transition',
        message: 'Cannot move a completed enquiry back to in progress.',
        retryable: false,
      },
      requestId: 'req-9',
    });
  });

  it('keeps internalDetail out of the serialised envelope', () => {
    const error = new ApiError('internal_error', {
      internalDetail: 'pg: duplicate key value violates unique constraint "enquiry_reference_key"',
    });

    const serialised = JSON.stringify(error.toEnvelope('req-9'));

    expect(serialised).not.toContain('duplicate key');
    expect(serialised).not.toContain('enquiry_reference_key');
    expect(error.internalDetail).toContain('duplicate key');
  });

  it('falls back to the safe default message', () => {
    expect(new ApiError('forbidden').message).toBe(DEFAULT_ERROR_MESSAGES.forbidden);
  });

  it('carries field errors through to the envelope', () => {
    // The validation path constructs an ApiError from Zod output, so the field
    // errors have to survive the round trip or the form loses its inline
    // messages and shows only the summary.
    const fieldErrors = [
      { path: 'email', code: 'invalid_email', message: 'Enter a valid email address.' },
    ];
    const error = new ApiError('validation_failed', { fieldErrors });

    expect(error.fieldErrors).toEqual(fieldErrors);

    const envelope = error.toEnvelope('req-9');

    expect(envelope.error.fieldErrors).toEqual(fieldErrors);
    // Proves the round trip produces a body the client contract accepts.
    expect(ErrorEnvelopeSchema.safeParse(envelope).success).toBe(true);
  });

  it('remains a real Error, so stack traces still work', () => {
    const error = new ApiError('not_found');

    expect(error).toBeInstanceOf(Error);
    expect(error.stack).toBeDefined();
  });
});
