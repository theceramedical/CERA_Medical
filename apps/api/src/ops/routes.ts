import { allowedTransitionsFrom, toStaffEnquiry, type InternalStatus } from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import { authorize } from '../auth/authorize.ts';
import { assertTransition } from '../enquiry/status.ts';
import { sendApiError, sendCode } from '../http.ts';

import type { SessionClaims } from '../auth/session.ts';
import type { PortalEnquiry, PortalStore } from '../portal/store.ts';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';

export interface OpsRoutesOptions {
  readonly store: PortalStore;
  readonly readSession: (request: FastifyRequest) => Promise<SessionClaims | null>;
}

export const opsRoutes = (options: OpsRoutesOptions): FastifyPluginCallback => {
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

    app.get('/v1/ops/enquiries', async (request, reply) => {
      try {
        await guarded(request);
        const items = options.store.listAll().map((enquiry) => staffView(enquiry));
        return reply.send({ items });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.get('/v1/ops/enquiries/:id', async (request, reply) => {
      try {
        await guarded(request);
        const enquiry = options.store.getById((request.params as { id: string }).id);
        if (enquiry === null) throw new ApiError('not_found');
        return reply.send({
          ...staffView(enquiry),
          permittedNext: allowedTransitionsFrom(enquiry.internalStatus),
        });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.patch('/v1/ops/enquiries/:id/assign', async (request, reply) => {
      try {
        const session = await guarded(request);
        if (session === null) throw new ApiError('unauthenticated');
        const enquiry = options.store.getById((request.params as { id: string }).id);
        if (enquiry === null) throw new ApiError('not_found');
        const body = request.body as { ownerId?: string | null };
        options.store.putEnquiry({ ...enquiry, ownerId: body.ownerId ?? session.sub });
        return reply.send({ assigned: true });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.post('/v1/ops/enquiries/:id/transition', async (request, reply) => {
      try {
        await guarded(request);
        const enquiry = options.store.getById((request.params as { id: string }).id);
        if (enquiry === null) throw new ApiError('not_found');
        const body = request.body as { status?: InternalStatus };
        if (body.status === undefined) throw new ApiError('validation_failed');
        assertTransition(enquiry.internalStatus, body.status);
        options.store.putEnquiry({
          ...enquiry,
          internalStatus: body.status,
          updatedAt: new Date().toISOString(),
        });
        return reply.send({ status: body.status });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.get('/v1/ops/enquiries/:id/notes', async (request, reply) => {
      try {
        await guarded(request);
        const enquiry = options.store.getById((request.params as { id: string }).id);
        if (enquiry === null) throw new ApiError('not_found');
        return reply.send({ items: enquiry.notes });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.post('/v1/ops/enquiries/:id/notes', async (request, reply) => {
      try {
        await guarded(request);
        const enquiry = options.store.getById((request.params as { id: string }).id);
        if (enquiry === null) throw new ApiError('not_found');
        const body = request.body as { body?: string };
        if (typeof body.body !== 'string' || body.body.length === 0) {
          throw new ApiError('validation_failed');
        }
        options.store.putEnquiry({ ...enquiry, notes: [...enquiry.notes, body.body] });
        return reply.send({ recorded: true });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.get('/v1/ops/enquiries/:id/audit', async (request, reply) => {
      try {
        await guarded(request);
        const enquiry = options.store.getById((request.params as { id: string }).id);
        if (enquiry === null) throw new ApiError('not_found');
        return reply.send({
          items: [{ action: 'enquiry.created', at: enquiry.createdAt, actor: null }],
        });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.get('/v1/ops/deliveries', async (request, reply) => {
      try {
        await guarded(request);
        return reply.send({ items: [] });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    app.post('/v1/ops/deliveries/:id/retry', async (request, reply) => {
      try {
        await guarded(request);
        return reply.send({ queued: true });
      } catch (error) {
        if (error instanceof ApiError) return sendApiError(request, reply, error);
        sendCode(request, reply, 'internal_error');
      }
    });

    done();
  };
};

function staffView(enquiry: PortalEnquiry) {
  return toStaffEnquiry(
    {
      id: '01900000-0000-7000-8000-000000000001',
      reference: enquiry.reference,
      customerSubjectId: enquiry.customerSubjectId,
      name: 'Customer',
      email: enquiry.email,
      phone: null,
      serviceId: 'cardiology',
      message: enquiry.message,
      consentAt: enquiry.createdAt,
      source: 'web_general',
      internalStatus: enquiry.internalStatus,
      ownerId: enquiry.ownerId,
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt,
    },
    {
      serviceTitle: enquiry.serviceTitle,
      ownerDisplayName: enquiry.ownerId,
      noteCount: enquiry.notes.length,
      lastIntegrationStatus: null,
    },
  );
}
