import { z } from 'zod';

import { type Enquiry, type EnquiryStatusEvent, EnquirySchema, type Service } from './entities.ts';
import { CustomerStatusSchema, DeliveryStatusSchema } from './enums.ts';
import { EmailSchema, UtcTimestampSchema } from './primitives.ts';
import { buildCustomerTimeline, customerStatusLabel, toCustomerStatus } from './status.ts';

/**
 * Three views of the same enquiry, each built by a function that names every
 * field it copies.
 *
 * None uses object spread, and that is the entire design. `{ ...enquiry }`
 * silently includes whatever is added to the entity later - so the day someone
 * adds a field, it appears in the customer response and the CRM payload with no
 * code change, no review, and no test failure. Naming fields explicitly means a
 * new field is invisible until someone decides to expose it.
 */

// ---------------------------------------------------------------------------
// Customer projection
// ---------------------------------------------------------------------------

export const CustomerTimelineEntrySchema = z.object({
  status: CustomerStatusSchema,
  label: z.string(),
  at: UtcTimestampSchema,
});

/**
 * What the owning, email-verified customer sees.
 *
 * Absent by design: `id`, `internalStatus`, `ownerId`, `message`, `email`,
 * `phone`, internal notes, transition reasons, and every CRM field. The customer
 * already knows what they wrote; echoing it back adds no value and widens the
 * surface on which it can leak.
 *
 * The reference, not the UUID, is the identifier. It is the value the customer
 * can quote to staff, and it keeps internal row ids out of client code.
 */
export const CustomerEnquirySchema = z.object({
  reference: z.string(),
  serviceTitle: z.string(),
  submittedAt: UtcTimestampSchema,
  status: CustomerStatusSchema,
  statusLabel: z.string(),
  updatedAt: UtcTimestampSchema,
  timeline: z.array(CustomerTimelineEntrySchema),
});
export type CustomerEnquiry = z.infer<typeof CustomerEnquirySchema>;

export function toCustomerEnquiry(
  enquiry: Enquiry,
  serviceTitle: string,
  statusEvents: readonly Pick<EnquiryStatusEvent, 'newStatus' | 'createdAt'>[],
): CustomerEnquiry {
  const status = toCustomerStatus(enquiry.internalStatus);

  return {
    reference: enquiry.reference,
    serviceTitle,
    submittedAt: enquiry.createdAt,
    status,
    statusLabel: customerStatusLabel(status),
    updatedAt: enquiry.updatedAt,
    timeline: buildCustomerTimeline(statusEvents),
  };
}

// ---------------------------------------------------------------------------
// Staff projection
// ---------------------------------------------------------------------------

/**
 * The operations queue and detail view. Carries the full entity because staff
 * are the intended audience for `internalStatus`, `ownerId`, and `message`.
 *
 * Built by extending `EnquirySchema` rather than restating fields: unlike the
 * customer projection, a new enquiry field being visible to staff is the correct
 * default, so inheritance is right here and wrong there.
 */
export const StaffEnquirySchema = EnquirySchema.extend({
  serviceTitle: z.string(),
  ownerDisplayName: z.string().nullable(),
  noteCount: z.number().int().min(0),
  lastIntegrationStatus: DeliveryStatusSchema.nullable(),
});
export type StaffEnquiry = z.infer<typeof StaffEnquirySchema>;

export function toStaffEnquiry(
  enquiry: Enquiry,
  extra: {
    serviceTitle: string;
    ownerDisplayName: string | null;
    noteCount: number;
    lastIntegrationStatus: StaffEnquiry['lastIntegrationStatus'];
  },
): StaffEnquiry {
  return {
    id: enquiry.id,
    reference: enquiry.reference,
    customerSubjectId: enquiry.customerSubjectId,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone,
    institution: enquiry.institution,
    country: enquiry.country,
    serviceId: enquiry.serviceId,
    message: enquiry.message,
    consentAt: enquiry.consentAt,
    consentVersion: enquiry.consentVersion ?? 'legacy-unknown',
    sequencingDataConsent: enquiry.sequencingDataConsent ?? false,
    samplesCompoundsConsent: enquiry.samplesCompoundsConsent ?? false,
    healthDataConsent: enquiry.healthDataConsent ?? false,
    updatesOptIn: enquiry.updatesOptIn ?? false,
    source: enquiry.source,
    internalStatus: enquiry.internalStatus,
    ownerId: enquiry.ownerId,
    createdAt: enquiry.createdAt,
    updatedAt: enquiry.updatedAt,
    serviceTitle: extra.serviceTitle,
    ownerDisplayName: extra.ownerDisplayName,
    noteCount: extra.noteCount,
    lastIntegrationStatus: extra.lastIntegrationStatus,
  };
}

// ---------------------------------------------------------------------------
// CRM payload
// ---------------------------------------------------------------------------

export const CrmLeadPayloadSchema = z.object({
  lastName: z.string().min(1).max(120),
  firstName: z.string().max(120).optional(),
  email: EmailSchema,
  phone: z.string().max(24).optional(),
  company: z.string().min(1).max(160).optional(),
  source: z.string().min(1).max(100),
  /** The enquiry message. The only free text that leaves the platform. */
  description: z.string().max(2000),
  /** The enquiry reference, used for deduplication. See ADR-006. */
  externalReference: z.string().min(1),
  service: z.string().max(160),
  /** Customer vocabulary, never internal. CRM users are not CERA staff. */
  customerStatus: z.string().max(40),
  country: z.string().max(80).optional(),
});
export type CrmLeadPayload = z.infer<typeof CrmLeadPayloadSchema>;

/**
 * Splits a full name into the lead's required surname and optional given name.
 *
 * A single-word name becomes the surname rather than being rejected or padded
 * with a placeholder. For multi-word names the final token is treated as the
 * surname. The full name remains preserved in the enquiry record regardless.
 */
export function splitName(fullName: string): { firstName?: string; lastName: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length <= 1) {
    return { lastName: parts[0] ?? fullName.trim() };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) ?? '',
  };
}

/**
 * Builds the CRM payload.
 *
 * Note what is not here: no internal status, no owner identity, no internal
 * note, no audit trail, and no enquiry UUID. CRM users are not necessarily CERA
 * staff, so the integration receives only the customer's own data and
 * the customer-facing status, and nothing about how CERA is handling the
 * enquiry internally.
 */
export function toCrmLeadPayload(
  enquiry: Enquiry,
  service: Pick<Service, 'title'>,
): CrmLeadPayload {
  const { firstName, lastName } = splitName(enquiry.name);
  const customerStatus = toCustomerStatus(enquiry.internalStatus);

  return {
    lastName,
    ...(firstName !== undefined ? { firstName } : {}),
    email: enquiry.email,
    ...(enquiry.phone !== null ? { phone: enquiry.phone } : {}),
    ...(enquiry.institution !== null && enquiry.institution !== undefined
      ? { company: enquiry.institution }
      : {}),
    source: crmLeadSource(enquiry.source),
    description: enquiry.message,
    externalReference: enquiry.reference,
    service: service.title,
    customerStatus,
    ...(enquiry.country !== null && enquiry.country !== undefined
      ? { country: enquiry.country }
      : {}),
  };
}

function crmLeadSource(source: Enquiry['source']): string {
  switch (source) {
    case 'web_service_page':
      return 'Website - Service Page';
    case 'web_contact_page':
      return 'Website - Contact Page';
    case 'web_general':
      return 'Website';
  }
}

// ---------------------------------------------------------------------------
// Public service projection
// ---------------------------------------------------------------------------

/**
 * The public service shape. Drops `createdAt` and `updatedAt`, which reveal
 * editing activity without serving a visitor, and `status`, since the public
 * list contains active services only and returning the field would invite a
 * client to filter on it instead.
 */
export const PublicServiceSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  category: z.object({ slug: z.string(), title: z.string() }).nullable(),
  displayPrice: z.string().nullable(),
  availabilityText: z.string().nullable(),
  enquiryEnabled: z.boolean(),
  mediaId: z.string().nullable(),
});
export type PublicService = z.infer<typeof PublicServiceSchema>;

export function toPublicService(service: Service): PublicService {
  return {
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    description: service.description,
    category:
      service.category === null
        ? null
        : { slug: service.category.slug, title: service.category.title },
    displayPrice: service.displayPrice,
    availabilityText: service.availabilityText,
    enquiryEnabled: service.enquiryEnabled,
    mediaId: service.mediaId,
  };
}
