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
  const institutionValue = input.institution == null ? '' : stripUnsafe(input.institution);
  const countryValue = input.country == null ? '' : stripUnsafe(input.country);
  const institution = institutionValue.length === 0 ? null : institutionValue;
  const country = countryValue.length === 0 ? null : countryValue;

  return {
    name: stripUnsafe(input.name),
    email,
    ...(phone === null ? {} : { phone }),
    ...(institution === null ? {} : { institution }),
    ...(country === null ? {} : { country }),
    serviceId: stripUnsafe(input.serviceId),
    message: stripUnsafe(input.message),
    consent: true,
    ...(input.sequencingDataConsent === undefined
      ? {}
      : { sequencingDataConsent: input.sequencingDataConsent }),
    ...(input.samplesCompoundsConsent === undefined
      ? {}
      : { samplesCompoundsConsent: input.samplesCompoundsConsent }),
    ...(input.healthDataConsent === undefined
      ? {}
      : { healthDataConsent: input.healthDataConsent }),
    ...(input.updatesOptIn === undefined ? {} : { updatesOptIn: input.updatesOptIn }),
    source: input.source,
  };
}

export function contentFingerprint(input: EnquiryInput): string {
  const extended =
    input.institution != null ||
    input.country != null ||
    input.sequencingDataConsent === true ||
    input.samplesCompoundsConsent === true ||
    input.healthDataConsent === true ||
    input.updatesOptIn === true;
  const value = extended
    ? [
        input.email,
        input.institution ?? '',
        input.country ?? '',
        input.serviceId,
        input.message,
        String(input.sequencingDataConsent === true),
        String(input.samplesCompoundsConsent === true),
        String(input.healthDataConsent === true),
        String(input.updatesOptIn === true),
      ].join('\n')
    : [input.email, input.serviceId, input.message].join('\n');
  return createHash('sha256').update(value).digest('hex');
}

export function hashIp(ip: string, salt: string): string {
  return createHash('sha256').update(`${salt}\n${ip}`).digest('hex');
}
