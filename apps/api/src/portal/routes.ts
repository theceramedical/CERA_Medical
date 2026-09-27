import { ApiError } from '@cera/contracts/errors';

import { authorize } from '../auth/authorize.ts';
import { sendApiError, sendCode } from '../http.ts';

import {
  consumeClaimToken,
  emailHashOf,
  issueClaimToken,
  projectPortalEnquiry,
  type PortalStore,
} from './store.ts';

import type { SessionClaims } from '../auth/session.ts';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';

export interface PortalRoutesOptions {
  readonly store: PortalStore;
  readonly readSession: (request: FastifyRequest) => Promise<SessionClaims | null>;
}

export const portalRoutes = (options: PortalRoutesOptions): FastifyPluginCallback => {
  return (app, _opts, done) => {
    const guarded = async (request: FastifyRequest) => {
      const session = await options.readSession(request);
      const decision = authorize({ method: request.method, path: request.url.split('?')[0] ?? request.url, session });
      if (!decision.ok) throw decision.error;
      return decision.session;
    };

    app.get('/v1/me/profile', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const profile = options.store.getProfile(session.sub) ?? {
          subjectId: session.sub,
          displayName: session.email.split('@')[0] ?? 'Customer',
          phone: null,
          email: session.email,
        };
        return reply.send({ displayName: profile.displayName, phone: profile.phone, email: profile.email });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.patch('/v1/me/profile', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const body = request.body as { displayName?: string; phone?: string | null };
        const current = options.store.getProfile(session.sub) ?? {
          subjectId: session.sub,
          displayName: session.email.split('@')[0] ?? 'Customer',
          phone: null,
          email: session.email,
        };
        const next = {
          ...current,
          displayName: typeof body.displayName === 'string' ? body.displayName : current.displayName,
          phone: body.phone === undefined ? current.phone : body.phone,
        };
        options.store.putProfile(next);
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
        const items = options.store.listForSubject(session.sub).map(projectPortalEnquiry);
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
        const enquiry = options.store.getForSubject(session.sub, reference);
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
        const issued = options.store.findUnclaimedByEmailHash(hash).map((enquiry) => ({
          reference: enquiry.reference,
          token: issueClaimToken(options.store, enquiry),
        }));
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
        const ok = consumeClaimToken(options.store, token, session.sub, emailHashOf(session.email));
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
