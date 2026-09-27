import {
  type ApiError,
  buildErrorEnvelope,
  fieldErrorsFromZod,
  httpStatusFor,
} from '@cera/contracts/errors';
import { type ZodError } from 'zod';

import type { FastifyReply, FastifyRequest } from 'fastify';

export function requestIdOf(request: FastifyRequest): string {
  const header = request.headers['x-request-id'];
  if (typeof header === 'string' && header.length > 0) return header;
  return 'unknown';
}

export function sendApiError(request: FastifyRequest, reply: FastifyReply, error: ApiError): void {
  void reply.code(error.httpStatus).send(error.toEnvelope(requestIdOf(request)));
}

export function sendZodError(request: FastifyRequest, reply: FastifyReply, error: ZodError): void {
  const envelope = buildErrorEnvelope({
    code: 'validation_failed',
    requestId: requestIdOf(request),
    fieldErrors: fieldErrorsFromZod(error),
  });
  void reply.code(httpStatusFor('validation_failed')).send(envelope);
}

export function sendCode(
  request: FastifyRequest,
  reply: FastifyReply,
  code: Parameters<typeof buildErrorEnvelope>[0]['code'],
): void {
  void reply.code(httpStatusFor(code)).send(buildErrorEnvelope({ code, requestId: requestIdOf(request) }));
}
