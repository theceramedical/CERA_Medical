import { randomUUID } from 'node:crypto';

import {
  generateEnquiryReference,
  INITIAL_INTERNAL_STATUS,
  toCustomerStatus,
  type EnquiryInput,
  type InternalStatus,
} from '@cera/contracts';

export interface StoredEnquiry {
  readonly id: string;
  readonly reference: string;
  readonly name: string;
  readonly email: string;
  readonly serviceId: string;
  readonly message: string;
  readonly fingerprint: string;
  readonly idempotencyKey: string | null;
  readonly createdAt: string;
  readonly consentAt: string;
  readonly internalStatus: InternalStatus;
  readonly ownerId: string | null;
  readonly notes: readonly string[];
  readonly version: number;
}

export interface StatusEventRow {
  readonly enquiryId: string;
  readonly previousStatus: InternalStatus | null;
  readonly newStatus: InternalStatus;
  readonly customerStatus: ReturnType<typeof toCustomerStatus>;
  readonly reason: string | null;
  readonly createdAt: string;
}

export interface AuditEventRow {
  readonly enquiryId: string;
  readonly action: string;
  readonly createdAt: string;
}

export interface OutboxRow {
  readonly enquiryId: string;
  readonly eventType: 'zoho.lead.upsert' | 'resend.customer.receipt' | 'resend.staff.alert';
}

export interface EnquiryWrite {
  readonly enquiry: StoredEnquiry;
  readonly statusEvent: StatusEventRow;
  readonly auditEvent: AuditEventRow;
  readonly outbox: readonly OutboxRow[];
}

export interface EnquiryStore {
  findByIdempotency(key: string): Promise<StoredEnquiry | null>;
  findByFingerprint(fingerprint: string): Promise<StoredEnquiry | null>;
  findById(id: string): Promise<StoredEnquiry | null>;
  insert(write: EnquiryWrite): Promise<void>;
  saveTransition(
    enquiry: StoredEnquiry,
    event: StatusEventRow,
    audit: AuditEventRow,
  ): Promise<boolean>;
  listStatusEvents(enquiryId: string): Promise<readonly StatusEventRow[]>;
}

export function memoryEnquiryStore(): EnquiryStore {
  const byId = new Map<string, StoredEnquiry>();
  const byIdempotency = new Map<string, StoredEnquiry>();
  const byFingerprint = new Map<string, StoredEnquiry>();
  const events = new Map<string, StatusEventRow[]>();

  return {
    findByIdempotency(key) {
      return Promise.resolve(byIdempotency.get(key) ?? null);
    },
    findByFingerprint(fingerprint) {
      return Promise.resolve(byFingerprint.get(fingerprint) ?? null);
    },
    findById(id) {
      return Promise.resolve(byId.get(id) ?? null);
    },
    insert(write) {
      const { enquiry } = write;
      byId.set(enquiry.id, enquiry);
      if (enquiry.idempotencyKey !== null) byIdempotency.set(enquiry.idempotencyKey, enquiry);
      byFingerprint.set(enquiry.fingerprint, enquiry);
      events.set(enquiry.id, [write.statusEvent]);
      return Promise.resolve();
    },
    saveTransition(enquiry, event, _audit) {
      const current = byId.get(enquiry.id);
      if (current?.version !== enquiry.version - 1) {
        return Promise.resolve(false);
      }
      byId.set(enquiry.id, enquiry);
      if (enquiry.idempotencyKey !== null) byIdempotency.set(enquiry.idempotencyKey, enquiry);
      byFingerprint.set(enquiry.fingerprint, enquiry);
      events.set(enquiry.id, [...(events.get(enquiry.id) ?? []), event]);
      return Promise.resolve(true);
    },
    listStatusEvents(enquiryId) {
      return Promise.resolve(events.get(enquiryId) ?? []);
    },
  };
}

export function newEnquiryRecord(
  input: EnquiryInput,
  fingerprint: string,
  idempotencyKey: string | null,
  now: Date = new Date(),
  status: InternalStatus = INITIAL_INTERNAL_STATUS,
): StoredEnquiry {
  const timestamp = now.toISOString();
  return {
    id: randomUUID(),
    reference: generateEnquiryReference(now),
    name: input.name,
    email: input.email,
    serviceId: input.serviceId,
    message: input.message,
    fingerprint,
    idempotencyKey,
    createdAt: timestamp,
    consentAt: timestamp,
    internalStatus: status,
    ownerId: null,
    notes: [],
    version: 1,
  };
}

export function writeForCreate(enquiry: StoredEnquiry): EnquiryWrite {
  return {
    enquiry,
    statusEvent: {
      enquiryId: enquiry.id,
      previousStatus: null,
      newStatus: enquiry.internalStatus,
      customerStatus: toCustomerStatus(enquiry.internalStatus),
      reason: null,
      createdAt: enquiry.createdAt,
    },
    auditEvent: {
      enquiryId: enquiry.id,
      action: 'enquiry.created',
      createdAt: enquiry.createdAt,
    },
    outbox: [
      { enquiryId: enquiry.id, eventType: 'zoho.lead.upsert' },
      { enquiryId: enquiry.id, eventType: 'resend.customer.receipt' },
      { enquiryId: enquiry.id, eventType: 'resend.staff.alert' },
    ],
  };
}
