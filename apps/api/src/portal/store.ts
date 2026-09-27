import { createHash, randomBytes } from 'node:crypto';

import {
  hashToken,
  toCustomerEnquiry,
  type CustomerEnquiry,
  type CustomerStatus,
  type InternalStatus,
} from '@cera/contracts';

export interface PortalEnquiry {
  readonly id: string;
  readonly reference: string;
  readonly email: string;
  readonly emailHash: string;
  readonly serviceTitle: string;
  readonly message: string;
  readonly internalStatus: InternalStatus;
  readonly ownerId: string | null;
  readonly notes: readonly string[];
  readonly customerSubjectId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ClaimToken {
  readonly hash: string;
  readonly emailHash: string;
  readonly enquiryId: string;
  readonly expiresAt: number;
  consumedAt: string | null;
  consumedBy: string | null;
}

export interface PortalProfile {
  readonly subjectId: string;
  displayName: string;
  phone: string | null;
  readonly email: string;
}

export interface PortalStore {
  listAll(): PortalEnquiry[];
  getById(id: string): PortalEnquiry | null;
  listForSubject(subjectId: string): PortalEnquiry[];
  getForSubject(subjectId: string, reference: string): PortalEnquiry | null;
  findUnclaimedByEmailHash(emailHash: string): PortalEnquiry[];
  claim(enquiryId: string, subjectId: string): boolean;
  putEnquiry(enquiry: PortalEnquiry): void;
  putToken(token: ClaimToken): void;
  findToken(hash: string): ClaimToken | null;
  getProfile(subjectId: string): PortalProfile | null;
  putProfile(profile: PortalProfile): void;
}

export function memoryPortalStore(): PortalStore {
  const enquiries = new Map<string, PortalEnquiry>();
  const tokens = new Map<string, ClaimToken>();
  const profiles = new Map<string, PortalProfile>();

  return {
    listAll() {
      return [...enquiries.values()];
    },
    getById(id) {
      return enquiries.get(id) ?? null;
    },
    listForSubject(subjectId) {
      return [...enquiries.values()].filter((enquiry) => enquiry.customerSubjectId === subjectId);
    },
    getForSubject(subjectId, reference) {
      return (
        [...enquiries.values()].find(
          (enquiry) => enquiry.reference === reference && enquiry.customerSubjectId === subjectId,
        ) ?? null
      );
    },
    findUnclaimedByEmailHash(emailHash) {
      return [...enquiries.values()].filter(
        (enquiry) => enquiry.emailHash === emailHash && enquiry.customerSubjectId === null,
      );
    },
    claim(enquiryId, subjectId) {
      const enquiry = enquiries.get(enquiryId);
      if (enquiry?.customerSubjectId !== null) return false;
      enquiries.set(enquiryId, { ...enquiry, customerSubjectId: subjectId });
      return true;
    },
    putEnquiry(enquiry) {
      enquiries.set(enquiry.id, enquiry);
    },
    putToken(token) {
      tokens.set(token.hash, token);
    },
    findToken(hash) {
      return tokens.get(hash) ?? null;
    },
    getProfile(subjectId) {
      return profiles.get(subjectId) ?? null;
    },
    putProfile(profile) {
      profiles.set(profile.subjectId, profile);
    },
  };
}

export function emailHashOf(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export function issueClaimToken(store: PortalStore, enquiry: PortalEnquiry, now = Date.now()): string {
  const token = randomBytes(32).toString('base64url');
  store.putToken({
    hash: hashToken(token),
    emailHash: enquiry.emailHash,
    enquiryId: enquiry.id,
    expiresAt: now + 30 * 60 * 1000,
    consumedAt: null,
    consumedBy: null,
  });
  return token;
}

export function consumeClaimToken(
  store: PortalStore,
  token: string,
  subjectId: string,
  subjectEmailHash: string,
  now = Date.now(),
): boolean {
  const record = store.findToken(hashToken(token));
  if (record === null) return false;
  if (record.consumedAt !== null) return false;
  if (record.expiresAt <= now) return false;
  if (record.emailHash !== subjectEmailHash) return false;
  const claimed = store.claim(record.enquiryId, subjectId);
  if (!claimed) return false;
  record.consumedAt = new Date(now).toISOString();
  record.consumedBy = subjectId;
  return true;
}

export function projectPortalEnquiry(enquiry: PortalEnquiry): CustomerEnquiry {
  return toCustomerEnquiry(
    {
      id: '01900000-0000-7000-8000-000000000001',
      reference: enquiry.reference,
      customerSubjectId: enquiry.customerSubjectId,
      name: 'Customer',
      email: enquiry.email,
      phone: null,
      serviceId: 'cardiology',
      message: enquiry.message,
      consentAt: enquiry.createdAt,
      source: 'web_general',
      internalStatus: enquiry.internalStatus,
      ownerId: enquiry.ownerId,
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt,
    },
    enquiry.serviceTitle,
    [{ newStatus: enquiry.internalStatus, createdAt: enquiry.updatedAt }],
  );
}

export function customerStatusLabelSafe(status: CustomerStatus): CustomerStatus {
  return status;
}
