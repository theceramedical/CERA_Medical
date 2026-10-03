import { randomBytes } from 'node:crypto';

import { hashToken } from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';
import { z } from 'zod';

import { authorize } from '../auth/authorize.ts';
import { sendApiError, sendCode, sendZodError } from '../http.ts';

import { emailHashOf, projectPortalEnquiry, type PortalStore } from './store.ts';

import type { SessionClaims } from '../auth/session.ts';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';

export interface PortalRoutesOptions {
  readonly store: PortalStore;
  readonly readSession: (request: FastifyRequest) => Promise<SessionClaims | null>;
}

const ProfilePatchSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter your name.').max(120, 'Name is too long.'),
  phone: z
    .string()
    .trim()
    .max(32, 'Phone number is too long.')
    .regex(/^[0-9+() .-]*$/, 'Enter a valid phone number.')
    .nullable()
    .optional(),
});

export const portalRoutes = (options: PortalRoutesOptions): FastifyPluginCallback => {
  return (app, _opts, done) => {
    const guarded = async (request: FastifyRequest) => {
      const session = await options.readSession(request);
      const decision = authorize({
        method: request.method,
        path: request.url.split('?')[0] ?? request.url,
        session,
      });
      if (!decision.ok) throw decision.error;
      return decision.session;
    };

    app.get('/v1/me/profile', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const profile = (await options.store.getProfile(session.sub)) ?? {
          subjectId: session.sub,
          displayName: session.email.split('@')[0] ?? 'Customer',
          phone: null,
          email: session.email,
        };
        return reply.send({
          displayName: profile.displayName,
          phone: profile.phone,
          email: profile.email,
        });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.patch('/v1/me/profile', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const parsed = ProfilePatchSchema.safeParse(request.body);
        if (!parsed.success) return sendZodError(request, reply, parsed.error);
        const body = parsed.data;
        const current = (await options.store.getProfile(session.sub)) ?? {
          subjectId: session.sub,
          displayName: session.email.split('@')[0] ?? 'Customer',
          phone: null,
          email: session.email,
        };
        const next = {
          ...current,
          displayName: body.displayName,
          phone: body.phone === undefined || body.phone === '' ? null : body.phone,
        };
        await options.store.putProfile(next);
        return reply.send({ displayName: next.displayName, phone: next.phone, email: next.email });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.get('/v1/me/enquiries', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const items = (await options.store.listForSubject(session.sub)).map(projectPortalEnquiry);
        return reply.send({ items });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.get('/v1/me/enquiries/:reference', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const { reference } = request.params as { reference: string };
        const enquiry = await options.store.getForSubject(session.sub, reference);
        if (enquiry === null) throw new ApiError('not_found');
        return reply.send(projectPortalEnquiry(enquiry));
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.post('/v1/enquiries/claim/request', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const hash = emailHashOf(session.email);
        const enquiries = await options.store.findUnclaimedByEmailHash(hash);
        // Issue once to the verified address through the durable delivery outbox.
        for (const enquiry of enquiries) {
          const token = randomBytes(32).toString('base64url');
          await options.store.issueClaim?.(
            {
              hash: hashToken(token),
              emailHash: hash,
              enquiryId: enquiry.id,
              expiresAt: Date.now() + 30 * 60 * 1000,
              consumedAt: null,
              consumedBy: null,
            },
            token,
          );
        }
        const issued = enquiries;
        return reply.send({ issued: issued.length });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.post('/v1/enquiries/claim/consume', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const body = request.body as { token?: string };
        const token = typeof body.token === 'string' ? body.token : '';
        const ok = await options.store.consumeToken?.(
          token,
          session.sub,
          emailHashOf(session.email),
        );
        if (!ok) throw new ApiError('not_found');
        return reply.send({ claimed: true });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    done();
  };
};
