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
 * adds a field, it appears in the customer response and the Zoho payload with no
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
    serviceId: enquiry.serviceId,
    message: enquiry.message,
    consentAt: enquiry.consentAt,
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
// Zoho CRM payload
// ---------------------------------------------------------------------------

/**
 * Zoho requires `Company` on a Lead even for an individual enquirer, so a
 * constant is sent rather than inventing a value from the person's name.
 */
export const ZOHO_COMPANY_PLACEHOLDER = 'Individual enquiry';

export const ZohoLeadPayloadSchema = z.object({
  Last_Name: z.string().min(1).max(120),
  First_Name: z.string().max(120).optional(),
  Email: EmailSchema,
  Phone: z.string().max(24).optional(),
  Company: z.string().min(1),
  Lead_Source: z.string().min(1).max(100),
  /** The enquiry message. The only free text that leaves the platform. */
  Description: z.string().max(2000),
  /** The enquiry reference, used for deduplication. See ADR-006. */
  External_Lead_ID: z.string().min(1),
  CERA_Service: z.string().max(160),
  /** Customer vocabulary, never internal. Zoho users are not CERA staff. */
  CERA_Status: z.string().max(40),
});
export type ZohoLeadPayload = z.infer<typeof ZohoLeadPayloadSchema>;

/**
 * Splits a full name into Zoho's required `Last_Name` and optional `First_Name`.
 *
 * Zoho makes `Last_Name` mandatory, so a single-word name becomes the last name
 * rather than being rejected or padded with a placeholder. For multi-word names
 * the final token is treated as the surname - imperfect for names that do not
 * follow that convention, but it is Zoho's data model, and the full name is
 * preserved in the enquiry record regardless.
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
 * note, no audit trail, and no enquiry UUID. Zoho is a sales tool used by people
 * who are not necessarily CERA staff, so it receives the customer's own data and
 * the customer-facing status, and nothing about how CERA is handling the
 * enquiry internally.
 */
export function toZohoLeadPayload(
  enquiry: Enquiry,
  service: Pick<Service, 'title'>,
): ZohoLeadPayload {
  const { firstName, lastName } = splitName(enquiry.name);
  const customerStatus = toCustomerStatus(enquiry.internalStatus);

  return {
    Last_Name: lastName,
    ...(firstName !== undefined ? { First_Name: firstName } : {}),
    Email: enquiry.email,
    ...(enquiry.phone !== null ? { Phone: enquiry.phone } : {}),
    Company: ZOHO_COMPANY_PLACEHOLDER,
    Lead_Source: zohoLeadSource(enquiry.source),
    Description: enquiry.message,
    External_Lead_ID: enquiry.reference,
    CERA_Service: service.title,
    CERA_Status: customerStatus,
  };
}

function zohoLeadSource(source: Enquiry['source']): string {
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
