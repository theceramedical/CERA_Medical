import type { EnquiryFormCopy } from '../components/enquiry-form.client.tsx';

export function enquiryFormCopyFromSettings(settings: unknown): EnquiryFormCopy | undefined {
  if (settings === null || typeof settings !== 'object') return undefined;
  const enquiryForm = (settings as { enquiryForm?: unknown }).enquiryForm;
  if (enquiryForm === null || typeof enquiryForm !== 'object') return undefined;
  const form = enquiryForm as Record<string, unknown>;
  const fieldLabels =
    form.fieldLabels !== null && typeof form.fieldLabels === 'object'
      ? (form.fieldLabels as Record<string, unknown>)
      : {};
  const fieldHints =
    form.fieldHints !== null && typeof form.fieldHints === 'object'
      ? (form.fieldHints as Record<string, unknown>)
      : {};

  return {
    ...(typeof form.consentVersion === 'string' ? { consentVersion: form.consentVersion } : {}),
    ...(typeof form.generalConsent === 'string' ? { generalConsent: form.generalConsent } : {}),
    ...(Array.isArray(form.sequencingConsent)
      ? { sequencingDataConsent: form.sequencingConsent }
      : {}),
    ...(Array.isArray(form.samplesConsent) ? { samplesCompoundsConsent: form.samplesConsent } : {}),
    ...(Array.isArray(form.healthDataConsent) ? { healthDataConsent: form.healthDataConsent } : {}),
    ...(typeof form.updatesOptIn === 'string' ? { updatesOptIn: form.updatesOptIn } : {}),
    ...(typeof form.contactNotice === 'string' ? { contactNotice: form.contactNotice } : {}),
    ...(typeof form.successMessage === 'string' ? { successMessage: form.successMessage } : {}),
    ...(typeof form.retentionFooter === 'string' ? { retentionFooter: form.retentionFooter } : {}),
    labels: {
      ...(typeof fieldLabels.name === 'string' ? { name: fieldLabels.name } : {}),
      ...(typeof fieldLabels.email === 'string' ? { email: fieldLabels.email } : {}),
      ...(typeof fieldLabels.phone === 'string' ? { phone: fieldLabels.phone } : {}),
      ...(typeof fieldLabels.institution === 'string'
        ? { institution: fieldLabels.institution }
        : {}),
      ...(typeof fieldLabels.country === 'string' ? { country: fieldLabels.country } : {}),
      ...(typeof fieldLabels.serviceId === 'string' ? { serviceId: fieldLabels.serviceId } : {}),
      ...(typeof fieldLabels.message === 'string' ? { message: fieldLabels.message } : {}),
      ...(typeof fieldLabels.submit === 'string' ? { submit: fieldLabels.submit } : {}),
    },
    hints: {
      ...(typeof fieldHints.email === 'string' ? { email: fieldHints.email } : {}),
      ...(typeof fieldHints.serviceLocked === 'string'
        ? { serviceLocked: fieldHints.serviceLocked }
        : {}),
      ...(typeof fieldHints.message === 'string' ? { message: fieldHints.message } : {}),
    },
  };
}
