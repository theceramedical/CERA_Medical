import { createHash } from 'node:crypto';

import { EmailSchema, type EnquiryInput } from '@cera/contracts';

/**
 * Trim, collapse whitespace, lowercase email, strip control and zero-width
 * characters. The fingerprint is over the normalised values so two tabs that
 * differ only by a trailing space collide.
 */
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;
// Intentionally matches C0 controls so they cannot survive into storage or fingerprints.
// eslint-disable-next-line no-control-regex -- stripping controls is the purpose of this pattern
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function stripUnsafe(value: string): string {
  return value.replace(ZERO_WIDTH, '').replace(CONTROL, '').replace(/\s+/g, ' ').trim();
}

export function normaliseEnquiry(input: EnquiryInput): EnquiryInput {
  const email = EmailSchema.parse(stripUnsafe(input.email).toLowerCase());
  const phone = input.phone === undefined || input.phone === null ? null : stripUnsafe(input.phone);

  return {
    name: stripUnsafe(input.name),
    email,
    ...(phone === null ? {} : { phone }),
    serviceId: stripUnsafe(input.serviceId),
    message: stripUnsafe(input.message),
    consent: true,
    source: input.source,
  };
}

export function contentFingerprint(input: EnquiryInput): string {
  return createHash('sha256')
    .update(`${input.email}\n${input.serviceId}\n${input.message}`)
    .digest('hex');
}

export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}\n${ip}`).digest('hex');
}
