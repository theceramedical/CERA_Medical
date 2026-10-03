import type { CrmLeadPayload } from './projections.ts';

/**
 * Swappable provider ports. Drivers are selected by environment variable alone
 * (ADR-006, ADR-007): fake for unit tests, local for Mailpit/SeaweedFS, live
 * for ERPNext/Resend/R2.
 */

export interface CrmUpsertResult {
  readonly externalId: string;
  readonly responseCode: number;
}

export interface CrmPort {
  upsertLead(payload: CrmLeadPayload, idempotencyKey: string): Promise<CrmUpsertResult>;
}

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  readonly idempotencyKey: string;
}

export interface EmailPort {
  send(message: EmailMessage): Promise<{ id: string }>;
}

export interface StoragePort {
  put(key: string, body: Uint8Array, contentType: string): Promise<{ url: string }>;
  delete(key: string): Promise<void>;
}
