import { describe, expect, it } from 'vitest';

import {
  enquiryCustomerReceiptHtml,
  enquiryStaffAlertHtml,
  enquiryStaffAlertText,
} from './enquiry-mail.ts';

const sample = {
  reference: 'CERA-2026-0042',
  name: 'Dr Ada Lovelace',
  email: 'ada@university.example',
  phone: '+92 300 0000000',
  institution: 'Example University',
  country: 'Pakistan',
  serviceId: 'metagenomic-data-analysis',
  message: 'We have 120 shotgun metagenome samples ready for QC and taxonomic profiling.',
  createdAt: '2026-10-05T10:00:00.000Z',
  staffPortalUrl: 'https://www.ceramedical.org/staff',
};

describe('enquiry mail templates', () => {
  it('includes enquiry reference in staff alert', () => {
    expect(enquiryStaffAlertText(sample)).toContain('CERA-2026-0042');
    expect(enquiryStaffAlertHtml(sample)).toContain('CERA-2026-0042');
    expect(enquiryStaffAlertHtml(sample)).toContain('metagenomic data analysis');
  });

  it('brands customer receipt HTML', () => {
    expect(enquiryCustomerReceiptHtml(sample)).toContain('CERA Medical');
    expect(enquiryCustomerReceiptHtml(sample)).toContain('three working days');
  });
});
