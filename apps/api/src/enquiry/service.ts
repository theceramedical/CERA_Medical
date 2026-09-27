import {
  CreateEnquiryResponseSchema,
  EnquiryInputSchema,
  toCustomerEnquiry,
  toCustomerStatus,
  type Enquiry,
  type EnquiryInput,
  type InternalStatus,
} from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import { contentFingerprint, hashIp, normaliseEnquiry } from './normalise.ts';
import { allowOrFailOpen, memoryRateLimiter, type RateLimiter } from './rate-limit.ts';
import { looksLikeSpam } from './spam.ts';
import { assertTransition } from './status.ts';
import {
  memoryEnquiryStore,
  newEnquiryRecord,
  writeForCreate,
  type EnquiryStore,
  type StoredEnquiry,
} from './store.ts';

export interface EnquiryServiceOptions {
  readonly store?: EnquiryStore;
  readonly limiter?: RateLimiter;
  readonly allowedServiceIds: ReadonlySet<string>;
  readonly ipSalt: string;
  readonly now?: () => Date;
  readonly onRateLimitStoreFailure?: (error: unknown) => void;
}

export interface SubmitEnquiryRequest {
  readonly body: unknown;
  readonly ip: string;
  readonly idempotencyKey: string | null;
  readonly honeypot: string | null;
  readonly startedAt: string | null;
}

export function createEnquiryService(options: EnquiryServiceOptions) {
  const store = options.store ?? memoryEnquiryStore();
  const limiter = options.limiter ?? memoryRateLimiter();
  const now = options.now ?? (() => new Date());
  const onRateLimitStoreFailure =
    options.onRateLimitStoreFailure ??
    ((_error: unknown) => {
      /* fail-open alert hook */
    });

  return {
    async submit(request: SubmitEnquiryRequest) {
      if (request.honeypot !== null && request.honeypot.length > 0) {
        throw new ApiError('validation_failed', { internalDetail: 'honeypot' });
      }

      if (request.startedAt !== null) {
        const started = Date.parse(request.startedAt);
        if (!Number.isNaN(started) && now().getTime() - started < 2_000) {
          throw new ApiError('rate_limited', { internalDetail: 'too_fast' });
        }
      }

      const ipHash = hashIp(request.ip, options.ipSalt);
      const minute = await allowOrFailOpen(limiter, `ip:${ipHash}:m`, 8, 60_000, onRateLimitStoreFailure);
      const hour = await allowOrFailOpen(limiter, `ip:${ipHash}:h`, 40, 3_600_000, onRateLimitStoreFailure);
      if (minute.limited || hour.limited) {
        throw new ApiError('rate_limited');
      }

      const parsed = EnquiryInputSchema.safeParse(request.body);
      if (!parsed.success) {
        if (parsed.error.issues.some((issue) => issue.path[0] === 'consent')) {
          throw new ApiError('consent_required');
        }
        throw new ApiError('validation_failed', {
          fieldErrors: parsed.error.issues.slice(0, 50).map((issue) => ({
            path: issue.path.join('.'),
            code: issue.code,
            message: issue.message,
          })),
        });
      }

      const input: EnquiryInput = normaliseEnquiry(parsed.data);
      if (!options.allowedServiceIds.has(input.serviceId)) {
        throw new ApiError('validation_failed', {
          fieldErrors: [
            {
              path: 'serviceId',
              code: 'unknown_service',
              message: 'That service is not accepting enquiries.',
            },
          ],
        });
      }

      const emailHour = await allowOrFailOpen(
        limiter,
        `email:${input.email}:h`,
        6,
        3_600_000,
        onRateLimitStoreFailure,
      );
      if (emailHour.limited) {
        throw new ApiError('rate_limited');
      }

      if (request.idempotencyKey !== null) {
        const existing = await store.findByIdempotency(request.idempotencyKey);
        if (existing !== null) {
          return { status: 200 as const, body: responseOf(existing.reference) };
        }
      }

      const fingerprint = contentFingerprint(input);
      const duplicate = await store.findByFingerprint(fingerprint);
      if (duplicate !== null) {
        return { status: 200 as const, body: responseOf(duplicate.reference) };
      }

      const initialStatus: InternalStatus = looksLikeSpam(input.message)
        ? 'rejected_spam'
        : 'received';
      const record = newEnquiryRecord(input, fingerprint, request.idempotencyKey, now(), initialStatus);
      await store.insert(writeForCreate(record));

      return { status: 201 as const, body: responseOf(record.reference), enquiry: record };
    },

    async transition(enquiryId: string, to: InternalStatus) {
      const current = await store.findById(enquiryId);
      if (current === null) {
        throw new ApiError('not_found');
      }
      const result = assertTransition(current.internalStatus, to);
      const timestamp = now().toISOString();
      const next: StoredEnquiry = { ...current, internalStatus: to, version: current.version + 1 };
      const saved = await store.saveTransition(
        next,
        {
          enquiryId: current.id,
          previousStatus: current.internalStatus,
          newStatus: to,
          customerStatus: result.customerStatus,
          reason: null,
          createdAt: timestamp,
        },
        { enquiryId: current.id, action: 'enquiry.transitioned', createdAt: timestamp },
      );
      if (!saved) {
        throw new ApiError('conflict');
      }
      return next;
    },

    async customerView(enquiryId: string, serviceTitle: string) {
      const current = await store.findById(enquiryId);
      if (current === null) {
        throw new ApiError('not_found');
      }
      const events = await store.listStatusEvents(enquiryId);
      return toCustomerEnquiry(toEnquiryEntity(current), serviceTitle, events);
    },
  };
}

function responseOf(reference: string) {
  return CreateEnquiryResponseSchema.parse({
    reference,
    submittedAt: new Date().toISOString(),
    message: 'We have received your enquiry and will email you a confirmation shortly.',
  });
}

function toEnquiryEntity(record: StoredEnquiry): Enquiry {
  return {
    id: '01900000-0000-7000-8000-000000000001',
    reference: record.reference,
    customerSubjectId: null,
    name: record.name,
    email: record.email,
    phone: null,
    serviceId: record.serviceId,
    message: record.message,
    consentAt: record.consentAt,
    source: 'web_general',
    internalStatus: record.internalStatus,
    ownerId: record.ownerId,
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
  };
}

export function customerStatusOf(status: InternalStatus) {
  return toCustomerStatus(status);
}
