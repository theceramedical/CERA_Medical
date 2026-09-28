import { createHmac, timingSafeEqual } from 'node:crypto';

import { ApiError } from '@cera/contracts/errors';

import { sendApiError, sendCode } from '../http.ts';

import type { FastifyPluginCallback } from 'fastify';

export type DeliveryLattice = 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained';

const RANK: Record<DeliveryLattice, number> = {
  queued: 0,
  sent: 1,
  delivered: 2,
  bounced: 3,
  complained: 3,
};

export function advanceDelivery(current: DeliveryLattice, next: DeliveryLattice): DeliveryLattice {
  if (current === 'bounced' || current === 'complained') return current;
  return RANK[next] >= RANK[current] ? next : current;
}

export function verifySvix(
  secret: string,
  id: string,
  timestamp: string,
  rawBody: string,
  signature: string,
): boolean {
  const payload = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(payload).digest('base64');
  const given = signature.replace(/^v1,/, '');
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

export const resendWebhookRoutes = (secret: string): FastifyPluginCallback => {
  return (app, _opts, done) => {
    app.post('/v1/webhooks/resend', async (request, reply) => {
      try {
        const raw =
          typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? {});
        const id = String(request.headers['svix-id'] ?? '');
        const timestamp = String(request.headers['svix-timestamp'] ?? '');
        const signature = String(request.headers['svix-signature'] ?? '');
        if (!verifySvix(secret, id, timestamp, raw, signature)) {
          throw new ApiError('unauthenticated');
        }
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });
    done();
  };
};
