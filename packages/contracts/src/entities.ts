import { z } from 'zod';

import {
  AuditTargetTypeSchema,
  ContentTypeSchema,
  CustomerStatusSchema,
  DeliveryStatusSchema,
  EnquirySourceSchema,
  IntegrationEventTypeSchema,
  IntegrationProviderSchema,
  InternalStatusSchema,
  OutboxStatusSchema,
  PublicationStatusSchema,
  ServiceStatusSchema,
} from './enums.ts';
import {
  EmailSchema,
  EnquiryReferenceSchema,
  PhoneSchema,
  Sha256HexSchema,
  SlugSchema,
  SubjectIdSchema,
  UtcTimestampSchema,
  Uuidv7Schema,
} from './primitives.ts';

/**
 * The platform's entities, as the single source of truth. `apps/api` derives its
 * route schemas from these, `apps/web` derives its client types, and fixtures are
 * generated from them - so a breaking change fails a build rather than a
 * production request.
 */

// ---------------------------------------------------------------------------
// Service - owned by Vendure, read-only downstream
// ---------------------------------------------------------------------------

export const ServiceCategorySchema = z.object({
  id: z.string().min(1),
  slug: SlugSchema,
  title: z.string().min(1).max(160),
});

export const ServiceSchema = z.object({
  /** Vendure's identifier. A string because Vendure IDs are opaque. */
  id: z.string().min(1),
  slug: SlugSchema,
  category: ServiceCategorySchema.nullable(),
  title: z.string().min(1).max(160),
  summary: z.string().max(320),
  description: z.string(),
  /**
   * Presentational text such as "From £250", never a number.
   *
   * This is a type-level guarantee that no payment path can form: an amount
   * cannot be summed, multiplied by a quantity, or passed to a payment provider
   * without someone first parsing a string, which is a visible and reviewable
   * act. PRD 3.2 puts payments out of scope, and this is how the schema holds
   * that line rather than relying on nobody adding a checkout.
   */
  displayPrice: z.string().max(80).nullable(),
  availabilityText: z.string().max(200).nullable(),
  enquiryEnabled: z.boolean(),
  mediaId: z.string().nullable(),
  status: ServiceStatusSchema,
  createdAt: UtcTimestampSchema,
  updatedAt: UtcTimestampSchema,
});
export type Service = z.infer<typeof ServiceSchema>;

// ---------------------------------------------------------------------------
// ContentDocument - owned by Payload
// ---------------------------------------------------------------------------

export const SeoSchema = z.object({
  /** 70 characters is roughly where Google truncates a title. */
  title: z.string().max(70).nullable(),
  description: z.string().max(180).nullable(),
  canonicalUrl: z.url().nullable(),
  ogImageId: z.string().nullable(),
  noIndex: z.boolean().default(false),
});

export const ContentDocumentSchema = z.object({
  id: z.string().min(1),
  type: ContentTypeSchema,
  slug: SlugSchema,
  title: z.string().min(1).max(200),
  excerpt: z.string().max(400).nullable(),
  /** Lexical AST. Structure is owned and validated by Payload, not re-modelled here. */
  body: z.unknown(),
  seo: SeoSchema,
  mediaIds: z.array(z.string()).max(50),
  status: PublicationStatusSchema,
  authorId: z.string().nullable(),
  approverId: z.string().nullable(),
  publishedAt: UtcTimestampSchema.nullable(),
  createdAt: UtcTimestampSchema,
  updatedAt: UtcTimestampSchema,
});
export type ContentDocument = z.infer<typeof ContentDocumentSchema>;

// ---------------------------------------------------------------------------
// Enquiry - owned by cera_app; the most sensitive record in the release
// ---------------------------------------------------------------------------

/**
 * What the public form may submit. Separate from `EnquirySchema` because a
 * client must not be able to set `internalStatus`, `ownerId`, `reference`, or
 * `consentAt`: each is assigned server-side. Accepting the full entity and
 * stripping fields afterwards is how mass-assignment bugs happen.
 */
export const EnquiryInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: EmailSchema,
  phone: PhoneSchema.nullable().optional(),
  serviceId: z.string().min(1).max(64),
  /**
   * 10 characters minimum rejects "hi" without rejecting a terse but genuine
   * enquiry. 2000 maximum bounds both the database row and the Zoho payload.
   */
  message: z.string().trim().min(10).max(2000),
  /**
   * Must be exactly `true`. `z.boolean()` would accept `false` and leave the
   * check to a later branch that someone could remove; a literal makes an
   * unconsented submission fail validation itself (PRD 10).
   */
  consent: z.literal(true),
  source: EnquirySourceSchema,
});
export type EnquiryInput = z.infer<typeof EnquiryInputSchema>;

export const EnquirySchema = z.object({
  id: Uuidv7Schema,
  /** Immutable once assigned. Quoted by customers, so it never changes. */
  reference: EnquiryReferenceSchema,
  /** Null until a verified customer claims the enquiry. */
  customerSubjectId: SubjectIdSchema.nullable(),
  name: z.string().min(2).max(120),
  email: EmailSchema,
  phone: PhoneSchema.nullable(),
  serviceId: z.string().min(1).max(64),
  /**
   * Never logged, never sent to GlitchTip, never placed in an alert subject or
   * body. It reaches Zoho's `Description` field and a staff UI, and nowhere else.
   */
  message: z.string().min(10).max(2000),
  /** Server clock at validated submission. Never inferred, never defaulted. */
  consentAt: UtcTimestampSchema,
  source: EnquirySourceSchema,
  /** Staff-only. Absent from every customer projection. */
  internalStatus: InternalStatusSchema,
  /** Staff-only. Absent from every customer projection. */
  ownerId: SubjectIdSchema.nullable(),
  createdAt: UtcTimestampSchema,
  updatedAt: UtcTimestampSchema,
});
export type Enquiry = z.infer<typeof EnquirySchema>;

/**
 * Fields that must never appear on an enquiry, asserted by a contract test.
 *
 * PRD 3.2 puts clinical data out of scope. Stating that as data - rather than as
 * prose in a document - means a well-meaning addition like "just a short medical
 * history field" fails a test instead of passing review. The absence of these
 * fields is the guarantee; this list is how it stays absent.
 */
export const PROHIBITED_ENQUIRY_FIELDS: readonly string[] = [
  'clinicalHistory',
  'medicalHistory',
  'diagnosis',
  'medication',
  'medications',
  'allergies',
  'symptoms',
  'treatment',
  'nhsNumber',
  'dateOfBirth',
  'attachments',
  'documents',
  'upload',
  'fileUrl',
  'insuranceNumber',
] as const;

// ---------------------------------------------------------------------------
// EnquiryStatusEvent - append-only
// ---------------------------------------------------------------------------

export const EnquiryStatusEventSchema = z.object({
  id: Uuidv7Schema,
  enquiryId: Uuidv7Schema,
  /** Null only for the creation event. */
  previousStatus: InternalStatusSchema.nullable(),
  newStatus: InternalStatusSchema,
  /** Stored, not derived at read time, so the timeline is stable if the mapping changes. */
  customerStatus: CustomerStatusSchema,
  /** Null for system transitions such as an automatic no-response closure. */
  actorSubjectId: SubjectIdSchema.nullable(),
  /** Staff-only free text. Never projected to a customer and never sent to Zoho. */
  reason: z.string().max(500).nullable(),
  createdAt: UtcTimestampSchema,
});
export type EnquiryStatusEvent = z.infer<typeof EnquiryStatusEventSchema>;

// ---------------------------------------------------------------------------
// InternalNote - staff-only
// ---------------------------------------------------------------------------

export const InternalNoteSchema = z.object({
  id: Uuidv7Schema,
  enquiryId: Uuidv7Schema,
  authorSubjectId: SubjectIdSchema,
  body: z.string().min(1).max(4000),
  createdAt: UtcTimestampSchema,
  editedAt: UtcTimestampSchema.nullable(),
});
export type InternalNote = z.infer<typeof InternalNoteSchema>;

// ---------------------------------------------------------------------------
// IntegrationDelivery - operations and administrators only
// ---------------------------------------------------------------------------

export const IntegrationDeliverySchema = z.object({
  id: Uuidv7Schema,
  enquiryId: Uuidv7Schema,
  provider: IntegrationProviderSchema,
  eventType: IntegrationEventTypeSchema,
  idempotencyKey: z.string().min(8).max(256),
  /** The provider's identifier once known, for example a Zoho lead id. */
  externalId: z.string().max(200).nullable(),
  attempt: z.number().int().min(0).max(100),
  status: DeliveryStatusSchema,
  responseCode: z.number().int().min(100).max(599).nullable(),
  /**
   * A classification such as `rate_limited` or `auth_failed`. Never a raw
   * provider body: provider errors routinely echo the request, which would put
   * the enquiry message into a table that operations staff can list.
   */
  errorClass: z.string().max(120).nullable(),
  createdAt: UtcTimestampSchema,
  updatedAt: UtcTimestampSchema,
});
export type IntegrationDelivery = z.infer<typeof IntegrationDeliverySchema>;

// ---------------------------------------------------------------------------
// CustomerProfile - keyed by the Authentik subject
// ---------------------------------------------------------------------------

export const CustomerProfileSchema = z.object({
  subjectId: SubjectIdSchema,
  /** Changed only through Authentik: it is the key that governs enquiry claiming. */
  email: EmailSchema,
  displayName: z.string().min(1).max(120),
  phone: PhoneSchema.nullable(),
  /** Must be non-null before any claim succeeds. */
  emailVerifiedAt: UtcTimestampSchema.nullable(),
  createdAt: UtcTimestampSchema,
  updatedAt: UtcTimestampSchema,
});
export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

/** The only profile fields a customer may change. */
export const CustomerProfileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  phone: PhoneSchema.nullable().optional(),
});
export type CustomerProfileUpdate = z.infer<typeof CustomerProfileUpdateSchema>;

// ---------------------------------------------------------------------------
// AuditEvent - append-only
// ---------------------------------------------------------------------------

/**
 * A field-level diff whose values have passed the redactor.
 *
 * Free-text fields are recorded as `{ changed: true }` rather than by value, so
 * the audit table never becomes a second copy of enquiry messages and note
 * bodies that outlives the retention policy applied to the originals.
 */
export const SafeDiffSchema = z.record(
  z.string().max(80),
  z.union([
    z.object({ from: z.unknown(), to: z.unknown() }),
    z.object({ changed: z.literal(true) }),
  ]),
);
export type SafeDiff = z.infer<typeof SafeDiffSchema>;

export const AuditEventSchema = z.object({
  id: Uuidv7Schema,
  /** Null for system actions. */
  actorSubjectId: SubjectIdSchema.nullable(),
  /** Dotted action name, for example `enquiry.status.changed`. */
  action: z.string().min(1).max(80),
  targetType: AuditTargetTypeSchema,
  targetId: z.string().min(1).max(200),
  safeDiff: SafeDiffSchema.nullable(),
  /** Ties the change to the request that made it, and to the logs. */
  requestId: z.string().min(1).max(100),
  createdAt: UtcTimestampSchema,
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ---------------------------------------------------------------------------
// EnquiryClaimToken - single-use, short-lived
// ---------------------------------------------------------------------------

export const CLAIM_TOKEN_TTL_MINUTES = 30;

export const EnquiryClaimTokenSchema = z.object({
  id: Uuidv7Schema,
  enquiryId: Uuidv7Schema,
  /** SHA-256 of the normalised email. The address is never stored on this row. */
  emailHash: Sha256HexSchema,
  /** SHA-256 of the token. The token exists only in the email that was sent. */
  tokenHash: Sha256HexSchema,
  expiresAt: UtcTimestampSchema,
  consumedAt: UtcTimestampSchema.nullable(),
  consumedBySubjectId: SubjectIdSchema.nullable(),
  createdAt: UtcTimestampSchema,
});
export type EnquiryClaimToken = z.infer<typeof EnquiryClaimTokenSchema>;

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

export const OutboxRecordSchema = z.object({
  id: Uuidv7Schema,
  aggregateType: z.literal('enquiry'),
  aggregateId: Uuidv7Schema,
  eventType: z.string().min(1).max(100),
  /**
   * Minimised. Carries identifiers, not full records, so the worker re-reads
   * current state at send time - a payload snapshot would send stale data after
   * a retry, and would duplicate personal data into a second table.
   */
  payload: z.unknown(),
  availableAt: UtcTimestampSchema,
  attempts: z.number().int().min(0).max(100),
  lockedAt: UtcTimestampSchema.nullable(),
  /** Which worker holds the claim, so a stale lock can be attributed and reaped. */
  lockedBy: z.string().max(120).nullable(),
  status: OutboxStatusSchema,
  /** Truncated classification only, never a provider body. */
  lastError: z.string().max(200).nullable(),
  createdAt: UtcTimestampSchema,
});
export type OutboxRecord = z.infer<typeof OutboxRecordSchema>;
