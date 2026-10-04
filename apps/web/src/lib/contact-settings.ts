import type { ContactEnquiryPanel, ContactLocation } from '../components/contact-site-panel.tsx';

export function contactFromSiteSettings(settings: unknown): {
  readonly locations: readonly ContactLocation[];
  readonly enquiry: ContactEnquiryPanel;
} {
  const record = settings !== null && typeof settings === 'object' ? settings : {};
  const rawLocations = (record as { contactLocations?: unknown }).contactLocations;
  const locations = Array.isArray(rawLocations)
    ? rawLocations
        .map((row) => {
          if (row === null || typeof row !== 'object') return null;
          const item = row as Record<string, unknown>;
          const label = typeof item.label === 'string' ? item.label : '';
          const value = typeof item.value === 'string' ? item.value : '';
          if (label.length === 0 || value.length === 0) return null;
          const href =
            typeof item.href === 'string' && item.href.length > 0 ? item.href : undefined;
          const iconRaw = item.icon;
          const icon =
            iconRaw === 'mail' || iconRaw === 'mapPin' || iconRaw === 'phone' ? iconRaw : undefined;
          return {
            label,
            value,
            ...(href !== undefined ? { href } : {}),
            ...(icon !== undefined ? { icon } : {}),
          };
        })
        .filter((item): item is ContactLocation => item !== null)
    : [];

  const rawEnquiry = (record as { contactEnquiry?: unknown }).contactEnquiry;
  const enquiryRecord =
    rawEnquiry !== null && typeof rawEnquiry === 'object'
      ? (rawEnquiry as Record<string, unknown>)
      : {};
  const enquiry: ContactEnquiryPanel = {
    ...(typeof enquiryRecord.heading === 'string' ? { heading: enquiryRecord.heading } : {}),
    ...(typeof enquiryRecord.body === 'string' ? { body: enquiryRecord.body } : {}),
    ...(typeof enquiryRecord.buttonLabel === 'string'
      ? { buttonLabel: enquiryRecord.buttonLabel }
      : {}),
    ...(typeof enquiryRecord.buttonHref === 'string'
      ? { buttonHref: enquiryRecord.buttonHref }
      : {}),
    ...(enquiryRecord.showInlineForm === true ? { showInlineForm: true } : {}),
    ...(typeof enquiryRecord.formSectionTitle === 'string'
      ? { formSectionTitle: enquiryRecord.formSectionTitle }
      : {}),
  };

  return { locations, enquiry };
}
