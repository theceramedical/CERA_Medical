import 'server-only';

import {
  CreateEnquiryResponseSchema,
  EnquiryInputSchema,
  requiredServiceSpecificConsent,
  type CreateEnquiryResponse,
  type EnquiryInput,
} from '@cera/contracts';

/** Validate locally, but acknowledge receipt only after the API commits it. */

const ALLOWED = new Set([
  'preclinical-studies',
  'molecular-research',
  'metagenomic-data-analysis',
  'biomedical-omics-data-analysis',
  'evidence-synthesis-technical-reports',
  'research-collaboration',
  'other-enquiry',
]);

export interface EnquirySubmitInput {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
  readonly honeypot: string | null;
  readonly startedAt: string | null;
}

export interface EnquirySubmitResult {
  readonly ok: boolean;
  readonly status: number;
  readonly body?: CreateEnquiryResponse;
  readonly message: string;
  readonly retryable: boolean;
  readonly fieldErrors: readonly { path: string; message: string }[];
}

export async function submitEnquiry(input: EnquirySubmitInput): Promise<EnquirySubmitResult> {
  const local = evaluateLocal(input);
  if (!local.ok) return local;

  const api = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (api !== undefined && api.length > 0) {
    try {
      const response = await fetch(`${api.replace(/\/$/, '')}/v1/enquiries`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(input.idempotencyKey !== null ? { 'idempotency-key': input.idempotencyKey } : {}),
        },
        body: JSON.stringify({
          ...(input.body as object),
          company: input.honeypot ?? '',
          startedAt: input.startedAt,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(1500),
      });
      const payload = (await response.json()) as {
        reference?: string;
        submittedAt?: string;
        message?: string;
        error?: {
          message?: string;
          retryable?: boolean;
          fieldErrors?: { path: string; message: string }[];
        };
      };
      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          body: CreateEnquiryResponseSchema.parse(payload),
          message: payload.message ?? 'Submitted.',
          retryable: false,
          fieldErrors: [],
        };
      }
      return {
        ok: false,
        status: response.status,
        message: payload.error?.message ?? 'Please check the form and try again.',
        retryable: payload.error?.retryable === true,
        fieldErrors: payload.error?.fieldErrors ?? [],
      };
    } catch {
      // A failed or ambiguous request must not acknowledge receipt.
    }
  }

  return {
    ok: false,
    status: 503,
    message: 'We could not confirm receipt. Please try again; your details have been kept.',
    retryable: true,
    fieldErrors: [],
  };
}

function evaluateLocal(input: EnquirySubmitInput): EnquirySubmitResult {
  if (input.honeypot !== null && input.honeypot.length > 0) {
    return {
      ok: false,
      status: 400,
      message: 'Some of the information provided is not valid. Please check and try again.',
      retryable: false,
      fieldErrors: [],
    };
  }

  if (input.startedAt !== null) {
    const started = Date.parse(input.startedAt);
    if (!Number.isNaN(started) && Date.now() - started < 2_000) {
      return {
        ok: false,
        status: 429,
        message: 'Too many requests. Please wait a moment and try again.',
        retryable: true,
        fieldErrors: [],
      };
    }
  }

  const parsed = EnquiryInputSchema.safeParse(input.body);
  if (!parsed.success) {
    const consent = parsed.error.issues.some((issue) => issue.path[0] === 'consent');
    return {
      ok: false,
      status: consent ? 422 : 400,
      message: consent
        ? 'Please confirm you agree to be contacted before submitting.'
        : 'Some of the information provided is not valid. Please check and try again.',
      retryable: false,
      fieldErrors: parsed.error.issues.slice(0, 50).map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  const body: EnquiryInput = parsed.data;
  if (!ALLOWED.has(body.serviceId)) {
    return {
      ok: false,
      status: 400,
      message: 'That service is not accepting enquiries.',
      retryable: false,
      fieldErrors: [{ path: 'serviceId', message: 'That service is not accepting enquiries.' }],
    };
  }

  const serviceConsent = requiredServiceSpecificConsent(body.serviceId);
  if (serviceConsent !== null && body[serviceConsent] !== true) {
    return {
      ok: false,
      status: 422,
      message: 'Please accept the service-specific data and materials consent.',
      retryable: false,
      fieldErrors: [
        {
          path: serviceConsent,
          message: 'Please accept this consent to submit your enquiry.',
        },
      ],
    };
  }

  return { ok: true, status: 200, message: '', retryable: false, fieldErrors: [] };
}
