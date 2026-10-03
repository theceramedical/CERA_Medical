import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../components/page-header.tsx';
import { PolicyDocument } from '../../../components/policy-document.tsx';
import { RichText } from '../../../components/rich-text.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';

import type { PolicySection } from '../../../components/policy-document.tsx';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Retention Policy',
  description: 'Draft retention schedule for CERA Medical enquiries, research data and samples.',
};

const SECTIONS: readonly PolicySection[] = [
  {
    heading: 'Purpose and scope',
    paragraphs: [
      'This draft schedule covers information and materials received through the website and CERA Medical services, including electronic files, email, physical samples, compounds and laboratory records.',
    ],
  },
  {
    heading: 'Principles',
    paragraphs: [
      'The client-proposed approach is to keep information and materials only while needed for their purpose or as required by law, and to keep project data and samples for the shortest practical period after delivery. A client agreement may specify a different period. Clients should keep their own copies because CERA Medical is not an archive.',
    ],
  },
  {
    heading: 'Proposed retention schedule',
    paragraphs: [
      'Unconverted enquiries: 12 months after last correspondence, then delete from mailbox and form records.',
      'Client contact details and service correspondence: for the relationship and 2 years after the last completed service, except records forming part of accounting records.',
      'Raw sequencing data and sample metadata: 90 days after final report delivery, or longer on the client’s written request while a manuscript is in preparation or review; then securely delete from working storage.',
      'Analysis outputs, reports, figures, scripts and simulation files: 12 months after delivery to support revisions and reviewer queries; then securely delete.',
      'Health, clinical, survey and programme datasets: 30 days after acceptance of the final report or the period in the data-sharing agreement; then return or securely delete with written confirmation.',
      'Draft reports and manuscripts: 6 months after delivery of the final version; then securely delete.',
      'Client samples and test compounds: 30 days after delivery of the final report; return at the client’s request and cost or destroy under biosafety and chemical-waste procedures.',
      'Tissue blocks, slides and other material generated in a study: 12 months after final report delivery; then return on request or destroy.',
      'Laboratory study records: 3 months after final report delivery; then securely delete or destroy, or transfer to the client on request.',
      'Invoices and accounting records: 6 years after the end of the relevant tax year, subject to applicable legal requirements.',
      'Product order and delivery details: 1 year as part of the accounting record, pending confirmation of the legal retention rule.',
      'Mailing-list records: until unsubscribe; retain an unsubscribe suppression record to prevent further messages.',
      'Consent records: while related information is held and 3 years afterwards.',
      'Website logs: 90 days. Analytics data: proposed 14 months, if analytics is enabled. Backups: proposed 30 days after deletion from live systems.',
    ],
  },
  {
    heading: 'Deletion requests',
    paragraphs: [
      'The client draft proposes acting on requests to delete files or return or destroy materials within 14 days and confirming completion in writing. Accounting records required by law are excluded.',
    ],
  },
  {
    heading: 'Longer retention',
    paragraphs: [
      'The proposed exceptions are a client’s written request, a legal, regulatory or ethics-committee requirement, or information needed to resolve a dispute or complaint. Information should be deleted or destroyed once the reason ends.',
    ],
  },
  {
    heading: 'How records are destroyed',
    paragraphs: [
      'The source proposes deleting electronic files from working storage, cloud folders, email attachments and transfer drives, removing them from backups through the normal backup cycle, wiping storage media before reuse or disposal, shredding paper records, and destroying biological samples and compounds under applicable biosafety and chemical-waste procedures.',
    ],
  },
  {
    heading: 'Responsibility and review',
    paragraphs: [
      'The source assigns responsibility to the CEO, proposes quarterly checks of items due for deletion, and an annual review or review when services or law change. The responsible person and process must be confirmed.',
    ],
  },
];

export default async function DataRetentionPage() {
  const document = await getCurrentDocument('policy', 'data-retention-policy');
  if (document !== null) {
    return (
      <>
        <PageHeader title={document.title} lede={document.excerpt ?? ''} />
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <RichText body={document.body} />
        </div>
      </>
    );
  }
  return (
    <PolicyDocument
      title="Data Retention Policy"
      lede="Proposed retention schedule supplied by CERA Medical."
      updated="2026-10-03"
      notice={
        <Alert tone="warning" title="Draft schedule — periods and operations need approval">
          <Text size="body-sm">
            Several periods were bracketed or marked for confirmation in the source. The schedule
            below records the proposed values for review; it is not an effective deletion
            commitment. In particular, confirm the single-server backup cycle and whether analytics
            or product orders are in use before publishing this as final policy.
          </Text>
        </Alert>
      }
      sections={SECTIONS}
    />
  );
}
