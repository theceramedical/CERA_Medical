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
  readonly name?: string;
  readonly phone?: string | null;
  readonly serviceId?: string;
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

type Awaitable<T> = T | Promise<T>;

export interface PortalStore {
  listAll(): Awaitable<PortalEnquiry[]>;
  getById(id: string): Awaitable<PortalEnquiry | null>;
  listForSubject(subjectId: string): Awaitable<PortalEnquiry[]>;
  getForSubject(subjectId: string, reference: string): Awaitable<PortalEnquiry | null>;
  findUnclaimedByEmailHash(emailHash: string): Awaitable<PortalEnquiry[]>;
  claim(enquiryId: string, subjectId: string): Awaitable<boolean>;
  putEnquiry(enquiry: PortalEnquiry, actor?: string): Awaitable<void>;
  putToken(token: ClaimToken): Awaitable<void>;
  findToken(hash: string): Awaitable<ClaimToken | null>;
  getProfile(subjectId: string): Awaitable<PortalProfile | null>;
  putProfile(profile: PortalProfile): Awaitable<void>;
  issueClaim?(token: ClaimToken, raw: string): Promise<void>;
  consumeToken?(token: string, subject: string, emailHash: string): Promise<boolean>;
  listAudit?(id: string): Promise<unknown[]>;
  listDeliveries?(): Promise<unknown[]>;
  retryDelivery?(id: string, actor: string): Promise<boolean>;
}

type SyncPortalStore = {
  [K in keyof PortalStore]: PortalStore[K] extends (...args: infer A) => infer R
    ? (...args: A) => Awaited<R>
    : PortalStore[K];
};

export function memoryPortalStore(): SyncPortalStore {
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

export function issueClaimToken(
  store: ReturnType<typeof memoryPortalStore>,
  enquiry: PortalEnquiry,
  now = Date.now(),
): string {
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
  store: ReturnType<typeof memoryPortalStore>,
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
      id: enquiry.id,
      reference: enquiry.reference,
      customerSubjectId: enquiry.customerSubjectId,
      name: enquiry.name ?? 'Customer',
      email: enquiry.email,
      phone: enquiry.phone ?? null,
      serviceId: enquiry.serviceId ?? 'cardiology',
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
