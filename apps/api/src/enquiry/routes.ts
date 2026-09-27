import { ApiError } from '@cera/contracts/errors';

import { sendApiError, sendCode } from '../http.ts';

import { createEnquiryService } from './service.ts';

import type { FastifyPluginCallback } from 'fastify';

const DEFAULT_SERVICES = new Set([
  'general-health',
  'cardiology',
  'orthopaedics',
  'womens-health',
  'wellness-preventive-care',
]);

export const enquiryRoutes = (
  service = createEnquiryService({
    allowedServiceIds: DEFAULT_SERVICES,
    ipSalt: process.env.IP_HASH_SALT ?? 'local-only-not-a-secret',
  }),
): FastifyPluginCallback => {
  return (app, _options, done) => {
    app.post('/v1/enquiries', async (request, reply) => {
      try {
        const body = request.body;
        const header = request.headers['idempotency-key'];
        const result = await service.submit({
          body,
          ip: request.ip,
          idempotencyKey: typeof header === 'string' ? header : null,
          honeypot: recordField(body, 'company'),
          startedAt: recordField(body, 'startedAt'),
        });
        return reply.code(result.status).send(result.body);
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'internal_error');
      }
    });

    done();
  };
};

function recordField(body: unknown, key: string): string | null {
  if (body === null || typeof body !== 'object') return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}
