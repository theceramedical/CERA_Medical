import { describe, expect, it } from 'vitest';

import {
  AssignEnquiryRequestSchema,
  ClaimRequestResponseSchema,
  CreateEnquiryResponseSchema,
  ListDeliveriesQuerySchema,
  ListOpsEnquiriesQuerySchema,
  ListServicesQuerySchema,
  MyEnquiryParamsSchema,
  MyProfileResponseSchema,
  OPS_ENQUIRY_SORTS,
  ResendWebhookEventSchema,
  SearchQuerySchema,
  ServiceParamsSchema,
  TransitionEnquiryRequestSchema,
} from './api.ts';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.ts';

describe('every list endpoint is bounded', () => {
  it.each([
    ['services', ListServicesQuerySchema, {}],
    ['ops enquiries', ListOpsEnquiriesQuerySchema, {}],
    ['deliveries', ListDeliveriesQuerySchema, {}],
    ['search', SearchQuerySchema, { q: 'knee' }],
  ])('%s defaults to a bounded limit', (_label, schema, input) => {
    // "No unbounded database queries" is a performance budget, so it has to hold
    // for a caller that passes no limit at all, not only for one that misbehaves.
    const parsed = schema.parse(input) as { limit: number };

    expect(parsed.limit).toBe(DEFAULT_PAGE_SIZE);
  });

  it.each([
    ['services', ListServicesQuerySchema, {}],
    ['ops enquiries', ListOpsEnquiriesQuerySchema, {}],
    ['deliveries', ListDeliveriesQuerySchema, {}],
    ['search', SearchQuerySchema, { q: 'knee' }],
  ])('%s refuses to exceed the maximum', (_label, schema, input) => {
    expect(schema.safeParse({ ...input, limit: String(MAX_PAGE_SIZE + 1) }).success).toBe(false);
  });
});

describe('path parameters are validated, not trusted', () => {
  it.each([
    ['a path traversal attempt', '../../etc/passwd'],
    ['a SQL fragment', "knee' or 1=1--"],
    ['an uppercase slug', 'Knee-Surgery'],
    ['an empty string', ''],
  ])('rejects %s as a service slug', (_label, slug) => {
    expect(ServiceParamsSchema.safeParse({ slug }).success).toBe(false);
  });

  it('accepts a well-formed slug', () => {
    expect(ServiceParamsSchema.parse({ slug: 'knee-replacement' }).slug).toBe('knee-replacement');
  });

  it('requires a reference in the documented format, not any string', () => {
    expect(MyEnquiryParamsSchema.safeParse({ reference: 'CERA-260901-A4B7Z' }).success).toBe(true);
    expect(MyEnquiryParamsSchema.safeParse({ reference: 'anything' }).success).toBe(false);
  });
});

describe('sort is an enum, never a column name', () => {
  it('rejects an arbitrary sort value', () => {
    // A free-string sort interpolated into ORDER BY is the injection point that
    // parameterised queries do not cover.
    expect(
      ListOpsEnquiriesQuerySchema.safeParse({ sort: 'created_at; drop table enquiries' }).success,
    ).toBe(false);
    expect(ListOpsEnquiriesQuerySchema.safeParse({ sort: 'message' }).success).toBe(false);
  });

  it('accepts only the declared sorts', () => {
    for (const sort of OPS_ENQUIRY_SORTS) {
      expect(ListOpsEnquiriesQuerySchema.safeParse({ sort }).success, sort).toBe(true);
    }
  });
});

describe('search terms are bounded', () => {
  it('rejects a one-character term', () => {
    expect(SearchQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
  });

  it('rejects an oversized term, which would become an oversized LIKE pattern', () => {
    expect(SearchQuerySchema.safeParse({ q: 'a'.repeat(121) }).success).toBe(false);
  });
});

describe('enquiry creation response', () => {
  it('returns the reference and no other identifier', () => {
    // The confirmation page may be screenshotted or left open on a shared
    // machine, so the response carries nothing that is not already the
    // customer's to hold.
    expect(Object.keys(CreateEnquiryResponseSchema.shape).sort()).toEqual([
      'message',
      'reference',
      'submittedAt',
    ]);
  });
});

describe('claim request is not an existence oracle', () => {
  it('has a response shape that cannot vary by outcome', () => {
    // `accepted` is a literal true, so there is no representable body meaning
    // "that reference does not exist" - references are short enough to enumerate.
    const parsed = ClaimRequestResponseSchema.parse({
      accepted: true,
      message: 'Check your email.',
    });

    expect(parsed.accepted).toBe(true);
    expect(
      ClaimRequestResponseSchema.safeParse({ accepted: false, message: 'No such enquiry' }).success,
    ).toBe(false);
  });
});

describe('customer profile response', () => {
  it('exposes verification as a boolean, never contact metadata', () => {
    expect(Object.keys(MyProfileResponseSchema.shape).sort()).toEqual([
      'displayName',
      'email',
      'emailVerified',
      'phone',
    ]);
  });

  it('does not carry the subject id', () => {
    // The Authentik subject is the authorisation key. A client has no use for it
    // and publishing it invites someone to send it as a parameter.
    expect('subjectId' in MyProfileResponseSchema.shape).toBe(false);
  });
});

describe('transition request', () => {
  it('requires the expected current status', () => {
    // Without it, two staff acting on a stale view both write and the second
    // silently wins.
    expect(TransitionEnquiryRequestSchema.safeParse({ to: 'in_progress' }).success).toBe(false);
    expect(
      TransitionEnquiryRequestSchema.safeParse({
        to: 'in_progress',
        expectedCurrentStatus: 'triaging',
      }).success,
    ).toBe(true);
  });

  it('rejects a status outside the internal enum', () => {
    expect(
      TransitionEnquiryRequestSchema.safeParse({
        to: 'definitely_done',
        expectedCurrentStatus: 'triaging',
      }).success,
    ).toBe(false);
  });

  it('keeps reason optional, since most transitions need no explanation', () => {
    const parsed = TransitionEnquiryRequestSchema.parse({
      to: 'referred',
      expectedCurrentStatus: 'in_progress',
    });

    expect(parsed.reason).toBeUndefined();
  });
});

describe('assignment distinguishes "clear the owner" from "leave it alone"', () => {
  it('accepts an explicit null to unassign', () => {
    expect(AssignEnquiryRequestSchema.parse({ ownerId: null }).ownerId).toBeNull();
  });

  it('requires the key to be present', () => {
    // If the key were optional, an absent key and an explicit null would be
    // indistinguishable after JSON parsing, and they are different operations.
    expect(AssignEnquiryRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('Resend webhook body', () => {
  const event = {
    type: 'email.bounced',
    created_at: '2026-09-01T10:00:00.000Z',
    data: { email_id: 'abc', to: ['person@example.com'] },
  };

  it('parses a known event', () => {
    expect(ResendWebhookEventSchema.parse(event).type).toBe('email.bounced');
  });

  it('tolerates fields the provider adds later', () => {
    // Rejecting them would make Resend retry and eventually disable the
    // endpoint. Signature verification, not strictness, is what keeps this safe.
    const result = ResendWebhookEventSchema.safeParse({ ...event, tags: ['x'], region: 'eu' });

    expect(result.success).toBe(true);
    expect(result.success && 'tags' in result.data).toBe(false);
  });

  it('rejects an event type the platform does not handle', () => {
    expect(ResendWebhookEventSchema.safeParse({ ...event, type: 'email.opened' }).success).toBe(
      false,
    );
  });
});
