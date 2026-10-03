import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../components/page-header.tsx';
import { PolicyDocument } from '../../../components/policy-document.tsx';
import { RichText } from '../../../components/rich-text.tsx';
import { getCurrentDocument } from '../../../lib/cms/client.ts';

import type { PolicySection } from '../../../components/policy-document.tsx';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Draft terms for CERA Medical’s research service enquiries and projects.',
};

const SECTIONS: readonly PolicySection[] = [
  {
    heading: 'Status of these terms',
    paragraphs: [
      'CERA Medical has not supplied final website Terms of Service in the client content document. This draft summarizes the project workflow described there and must be reviewed and approved before it is treated as a contract.',
    ],
  },
  {
    heading: 'Enquiries and project agreements',
    paragraphs: [
      'A website enquiry asks CERA Medical to discuss a possible research service. It is not acceptance of a project. Before work starts, the research question, materials or data, scope, deliverables, timeline and cost are agreed in writing.',
    ],
  },
  {
    heading: 'Client responsibilities',
    paragraphs: [
      'The client is responsible for having authority to provide submitted data, samples and compounds and for obtaining the ethical approvals, participant or donor consent, safety information and data-sharing agreements required for the work. Do not send direct identifiers through the website form.',
      'For human-derived samples, sequencing data or health, clinical, survey and programme data, follow the service-specific consent requirements and agree secure transfer arrangements before providing project files or materials.',
    ],
  },
  {
    heading: 'Study protocols and animal work',
    paragraphs: [
      'A study protocol or analysis plan is prepared before execution. Animal studies do not begin until the protocol has been approved by the institutional animal ethics committee.',
    ],
  },
  {
    heading: 'Results and use',
    paragraphs: [
      'Methods, controls, analysis and reporting are defined in the agreed project protocol. Research results and computational predictions do not by themselves establish that a treatment is safe or effective for people, and are not medical advice or a clinical treatment recommendation.',
    ],
  },
  {
    heading: 'Ownership, confidentiality and publication',
    paragraphs: [
      'The client-provided privacy draft says client files, samples and generated results remain client property and are used only for the requested work. Research collaborations require a separate written agreement for ownership, publication and authorship. Confirm confidentiality, output licensing and publication conditions in the project agreement.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'For project questions, contact CERA Medical at contact@ceramedical.org or use the enquiry form.',
    ],
  },
];

export default async function TermsPage() {
  const document =
    (await getCurrentDocument('policy', 'terms-of-service')) ??
    (await getCurrentDocument('policy', 'terms'));
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
      title="Terms of Service"
      lede="Draft project terms based on the client’s service workflow."
      updated="2026-10-03"
      notice={
        <Alert tone="warning" title="Draft — legal and client approval required">
          <Text size="body-sm">
            The supplied content includes service workflows and client responsibilities, but no
            approved Terms of Service. Confirm project contracting, liability, fees, intellectual
            property, cancellation and dispute terms before launch.
          </Text>
        </Alert>
      }
      sections={SECTIONS}
    />
  );
}
