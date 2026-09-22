import { z } from 'zod';

/**
 * Every closed vocabulary in the platform.
 *
 * These live in one file because they are referenced from entities, projections,
 * the status machine, and the database schema. A value added here surfaces as a
 * type error in each place that must handle it, which is the point.
 */

// ---------------------------------------------------------------------------
// Enquiry status
// ---------------------------------------------------------------------------

/**
 * Operational status. Staff-only: never returned to a customer, never sent to
 * Zoho. Kept as a distinct type from `CustomerStatus` so a staff-only value
 * cannot leak by assignment (PRD ENQ-403).
 */
export const InternalStatusSchema = z.enum([
  'received',
  'triaging',
  'awaiting_customer',
  'in_progress',
  'referred',
  'completed',
  'closed_no_response',
  'closed_withdrawn',
  'rejected_spam',
]);
export type InternalStatus = z.infer<typeof InternalStatusSchema>;

/**
 * What a customer may see. Deliberately coarser than the internal vocabulary:
 * `referred` collapses into `in_progress`, and the three closure reasons all
 * collapse into `closed`, so a customer cannot infer an internal judgement -
 * particularly not that their enquiry was classified as spam.
 */
export const CustomerStatusSchema = z.enum([
  'received',
  'in_review',
  'action_needed',
  'in_progress',
  'completed',
  'closed',
]);
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

// ---------------------------------------------------------------------------
// Enquiry provenance
// ---------------------------------------------------------------------------

export const EnquirySourceSchema = z.enum(['web_service_page', 'web_contact_page', 'web_general']);
export type EnquirySource = z.infer<typeof EnquirySourceSchema>;

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export const ContentTypeSchema = z.enum(['page', 'post', 'policy', 'servicePresentation']);
export type ContentType = z.infer<typeof ContentTypeSchema>;

export const PublicationStatusSchema = z.enum(['draft', 'published']);
export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;

export const ServiceStatusSchema = z.enum(['active', 'inactive']);
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export const IntegrationProviderSchema = z.enum(['zoho', 'resend']);
export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>;

export const IntegrationEventTypeSchema = z.enum([
  'zoho.lead.upsert',
  'resend.customer.receipt',
  'resend.staff.alert',
  'resend.status.update',
]);
export type IntegrationEventType = z.infer<typeof IntegrationEventTypeSchema>;

export const DeliveryStatusSchema = z.enum([
  'pending',
  'in_flight',
  'succeeded',
  'failed',
  'dead_letter',
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusSchema>;

export const OutboxStatusSchema = z.enum(['pending', 'in_flight', 'done', 'dead_letter']);
export type OutboxStatus = z.infer<typeof OutboxStatusSchema>;

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

export const AuditTargetTypeSchema = z.enum([
  'enquiry',
  'content',
  'customer',
  'service',
  'user',
  'release',
]);
export type AuditTargetType = z.infer<typeof AuditTargetTypeSchema>;

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/**
 * Mapped from Authentik groups at session creation. The order is significant
 * only for display; authorisation is always an explicit capability check, never
 * a comparison like `role >= 'staff'`, because an ordering invites off-by-one
 * privilege bugs.
 */
export const RoleSchema = z.enum([
  'customer',
  'content_editor',
  'content_approver',
  'enquiry_handler',
  'operations_manager',
  'administrator',
  'auditor',
]);
export type Role = z.infer<typeof RoleSchema>;

/** Roles permitted on `/v1/ops/*`. A customer is never staff. */
export const STAFF_ROLES: readonly Role[] = [
  'enquiry_handler',
  'operations_manager',
  'administrator',
  'auditor',
] as const;
