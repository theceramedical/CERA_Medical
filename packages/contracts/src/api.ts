import { z } from 'zod';

import {
  CustomerProfileSchema,
  CustomerProfileUpdateSchema,
  EnquiryInputSchema,
  EnquiryStatusEventSchema,
  IntegrationDeliverySchema,
  InternalNoteSchema,
} from './entities.ts';
import {
  ContentTypeSchema,
  DeliveryStatusSchema,
  IntegrationProviderSchema,
  InternalStatusSchema,
} from './enums.ts';
import { PageSchema, PaginationQuerySchema } from './pagination.ts';
import { EnquiryReferenceSchema, SlugSchema, SubjectIdSchema, Uuidv7Schema } from './primitives.ts';
import { CustomerEnquirySchema, PublicServiceSchema, StaffEnquirySchema } from './projections.ts';

/**
 * Request and response schemas for every endpoint in the API surface.
 *
 * These exist so `apps/api` and `apps/web` cannot disagree. The API validates
 * with the request schema and the web client parses with the response schema, so
 * a field renamed on one side fails to compile on the other instead of arriving
 * as `undefined` in a rendered page.
 *
 * Path parameters are schemas too. An unvalidated `:slug` reaches a query builder
 * and an unvalidated `:id` reaches a UUID column, and both are worth rejecting at
 * the edge rather than in a database error handler.
 */

// ---------------------------------------------------------------------------
// Public: services, content, search
// ---------------------------------------------------------------------------

export const ListServicesQuerySchema = PaginationQuerySchema.extend({
  category: SlugSchema.optional(),
  /** Lets the enquiry form list only services that accept one. */
  enquiryEnabled: z.stringbool().optional(),
});
export type ListServicesQuery = z.infer<typeof ListServicesQuerySchema>;

export const ListServicesResponseSchema = PageSchema(PublicServiceSchema);

export const ServiceParamsSchema = z.object({ slug: SlugSchema });
export const ContentParamsSchema = z.object({ type: ContentTypeSchema, slug: SlugSchema });

/**
 * The published content response.
 *
 * `body` is `unknown` for the same reason it is on the entity: the Lexical AST is
 * owned by Payload, and re-modelling it here would mean this package needs a
 * change every time an editor is given a new block.
 */
export const ContentResponseSchema = z.object({
  type: ContentTypeSchema,
  slug: SlugSchema,
  title: z.string(),
  excerpt: z.string().nullable(),
  body: z.unknown(),
  publishedAt: z.string(),
  seo: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    canonicalUrl: z.string().nullable(),
    noIndex: z.boolean(),
  }),
});

export const SearchQuerySchema = PaginationQuerySchema.extend({
  /**
   * Bounded at 120 characters. An unbounded search term becomes an unbounded
   * `ILIKE` pattern, which is a cheap way to make the database do expensive work.
   */
  q: z.string().trim().min(2).max(120),
  type: z.enum(['service', 'article', 'page', 'policy']).optional(),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SearchHitSchema = z.object({
  kind: z.enum(['service', 'content']),
  type: z.string(),
  slug: SlugSchema,
  title: z.string(),
  excerpt: z.string().nullable(),
});
export type SearchHit = z.infer<typeof SearchHitSchema>;

export const SearchResponseSchema = PageSchema(SearchHitSchema);

// ---------------------------------------------------------------------------
// Public: enquiry creation
// ---------------------------------------------------------------------------

export const CreateEnquiryRequestSchema = EnquiryInputSchema;

/**
 * What creation returns.
 *
 * The reference and nothing else that identifies the record. No row id, no
 * internal status, and no echo of the submitted message: the response is rendered
 * on a confirmation page that may be screenshotted, shared, or left open on a
 * shared machine.
 */
export const CreateEnquiryResponseSchema = z.object({
  reference: EnquiryReferenceSchema,
  submittedAt: z.string(),
  /** Customer-facing copy about what happens next, so the web app holds no policy. */
  message: z.string(),
});
export type CreateEnquiryResponse = z.infer<typeof CreateEnquiryResponseSchema>;

// ---------------------------------------------------------------------------
// Customer: claiming
// ---------------------------------------------------------------------------

export const ClaimRequestSchema = z.object({ reference: EnquiryReferenceSchema });

/**
 * Claim request always succeeds from the caller's point of view.
 *
 * It returns the same body whether the reference exists, is already claimed, or
 * belongs to a different email. Reporting the difference would turn this endpoint
 * into an oracle for "does reference X exist", and references are short enough to
 * guess at scale. Whether an email is actually sent is decided server-side.
 */
export const ClaimRequestResponseSchema = z.object({
  accepted: z.literal(true),
  message: z.string(),
});

export const ClaimConsumeRequestSchema = z.object({
  /** The raw token from the email. Only its SHA-256 is ever stored. */
  token: z.string().min(32).max(256),
});

export const ClaimConsumeResponseSchema = z.object({
  reference: EnquiryReferenceSchema,
});

// ---------------------------------------------------------------------------
// Customer: profile and own enquiries
// ---------------------------------------------------------------------------

/**
 * The profile a customer sees.
 *
 * Omits `createdAt` and `updatedAt`, which describe our record-keeping rather
 * than anything the customer needs, and exposes `emailVerified` as a boolean
 * instead of the timestamp: the UI only ever branches on whether verification
 * happened.
 */
export const MyProfileResponseSchema = CustomerProfileSchema.pick({
  email: true,
  displayName: true,
  phone: true,
}).extend({
  emailVerified: z.boolean(),
});
export type MyProfileResponse = z.infer<typeof MyProfileResponseSchema>;

export const UpdateMyProfileRequestSchema = CustomerProfileUpdateSchema;

export const ListMyEnquiriesQuerySchema = PaginationQuerySchema;
export const ListMyEnquiriesResponseSchema = PageSchema(CustomerEnquirySchema);

/** A customer addresses their own enquiry by reference; the row id is never exposed. */
export const MyEnquiryParamsSchema = z.object({ reference: EnquiryReferenceSchema });

// ---------------------------------------------------------------------------
// Staff: queue and detail
// ---------------------------------------------------------------------------

export const OPS_ENQUIRY_SORTS = ['created_at', 'updated_at'] as const;

/**
 * Queue filters.
 *
 * `sort` is an enum, not a column name, because a free-string sort parameter
 * interpolated into `ORDER BY` is the classic injection point that parameterised
 * queries do not cover. `unassigned` is a separate flag rather than
 * `ownerId=null`, so "nobody has picked this up" is expressible without
 * overloading the meaning of an absent parameter.
 */
export const ListOpsEnquiriesQuerySchema = PaginationQuerySchema.extend({
  status: InternalStatusSchema.optional(),
  ownerId: SubjectIdSchema.optional(),
  unassigned: z.stringbool().optional(),
  serviceId: z.string().max(64).optional(),
  q: z.string().trim().min(2).max(120).optional(),
  sort: z.enum(OPS_ENQUIRY_SORTS).default('created_at'),
});
export type ListOpsEnquiriesQuery = z.infer<typeof ListOpsEnquiriesQuerySchema>;

export const ListOpsEnquiriesResponseSchema = PageSchema(StaffEnquirySchema);

export const OpsEnquiryParamsSchema = z.object({ id: Uuidv7Schema });

/**
 * Assignment.
 *
 * `null` unassigns, which is why the field is nullable rather than optional: an
 * absent key and an explicit null would otherwise be indistinguishable after
 * JSON parsing, and "leave the owner alone" and "clear the owner" are different
 * operations on a work queue.
 */
export const AssignEnquiryRequestSchema = z.object({
  ownerId: SubjectIdSchema.nullable(),
});

export const TransitionEnquiryRequestSchema = z.object({
  to: InternalStatusSchema,
  /** Staff-only. Recorded on the status event, never shown to a customer. */
  reason: z.string().trim().max(500).optional(),
  /**
   * The status the client believed was current, for optimistic concurrency.
   *
   * Required, not optional. Two people working the same queue will otherwise
   * both act on a stale view and the second write silently wins; with this the
   * API returns `conflict` and the UI can refresh. Cheaper and clearer than row
   * locking for a human-paced workflow.
   */
  expectedCurrentStatus: InternalStatusSchema,
});
export type TransitionEnquiryRequest = z.infer<typeof TransitionEnquiryRequestSchema>;

export const TransitionEnquiryResponseSchema = z.object({
  internalStatus: InternalStatusSchema,
  allowedNext: z.array(InternalStatusSchema),
});

export const ListNotesResponseSchema = PageSchema(InternalNoteSchema);

export const CreateNoteRequestSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const ListAuditQuerySchema = PaginationQuerySchema;

/**
 * Audit history as staff see it.
 *
 * `safeDiff` only - the raw before-and-after is never assembled for display,
 * because for an enquiry that would reconstruct the message and note bodies that
 * the diff deliberately reduces to `{ changed: true }`.
 */
export const AuditEntrySchema = z.object({
  action: z.string(),
  actorDisplayName: z.string().nullable(),
  safeDiff: z.unknown().nullable(),
  requestId: z.string(),
  createdAt: z.string(),
});

export const ListAuditResponseSchema = PageSchema(AuditEntrySchema);

export const ListStatusEventsResponseSchema = PageSchema(EnquiryStatusEventSchema);

// ---------------------------------------------------------------------------
// Staff and admin: integration deliveries
// ---------------------------------------------------------------------------

export const ListDeliveriesQuerySchema = PaginationQuerySchema.extend({
  status: DeliveryStatusSchema.optional(),
  provider: IntegrationProviderSchema.optional(),
  /** The dead-letter view, which is the reason this endpoint exists. */
  deadLetteredOnly: z.stringbool().optional(),
});
export type ListDeliveriesQuery = z.infer<typeof ListDeliveriesQuerySchema>;

/**
 * Deliveries as operations see them.
 *
 * Carries `enquiryReference` rather than `enquiryId` so the list links to an
 * enquiry without publishing row ids, and keeps `errorClass` as the only error
 * detail: a raw provider body would put the enquiry message into a screen that
 * every staff member can list and filter.
 */
export const DeliveryListItemSchema = IntegrationDeliverySchema.omit({
  enquiryId: true,
}).extend({
  enquiryReference: EnquiryReferenceSchema,
});

export const ListDeliveriesResponseSchema = PageSchema(DeliveryListItemSchema);

export const RetryDeliveryParamsSchema = z.object({ id: Uuidv7Schema });

export const RetryDeliveryResponseSchema = z.object({
  /** The delivery is queued, not sent. Retry enqueues work for the worker. */
  status: z.literal('pending'),
  attempt: z.number().int().min(0),
});

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/**
 * The Resend delivery event body.
 *
 * Only the fields the platform acts on are modelled, and unknown keys are
 * dropped rather than rejected: a provider adding a field to its payload must not
 * start failing our webhook, which would make Resend retry and eventually
 * disable the endpoint. Signature verification, not schema strictness, is what
 * makes this endpoint safe.
 */
export const ResendWebhookEventSchema = z.object({
  type: z.enum([
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.bounced',
    'email.complained',
  ]),
  created_at: z.string(),
  data: z.object({
    email_id: z.string(),
    to: z.array(z.string()),
  }),
});
export type ResendWebhookEvent = z.infer<typeof ResendWebhookEventSchema>;

/**
 * Webhooks acknowledge with 200 and an empty object.
 *
 * Deliberately uninformative. A webhook response body is not read by a human and
 * anything descriptive in it is visible to whoever can reach the endpoint, which
 * is the public internet.
 */
export const WebhookAckResponseSchema = z.object({});
