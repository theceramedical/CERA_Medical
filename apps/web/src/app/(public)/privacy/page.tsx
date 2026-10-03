import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PolicyDocument } from '../../../components/policy-document.tsx';

import type { PolicySection } from '../../../components/policy-document.tsx';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Terms',
  description: 'How CERA Medical proposes to handle enquiry and client project information.',
};

const SECTIONS: readonly PolicySection[] = [
  {
    heading: 'Who we are',
    paragraphs: [
      'CERA Medical is a biomedical research and development company registered with the Securities and Exchange Commission of Pakistan. Its office is at 2nd Floor, BIC, C2 Building, Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST), Mang, Haripur, Pakistan. CERA Medical develops natural healthcare products and provides preclinical studies, molecular research, metagenomic data analysis, biomedical and omics data analysis, and evidence synthesis and technical reporting.',
    ],
  },
  {
    heading: 'Scope',
    paragraphs: [
      'These draft terms describe information collected through ceramedical.org and while providing services, how it may be used and protected, proposed retention periods, and choices for visitors, enquirers and clients.',
    ],
  },
  {
    heading: 'Information collected',
    paragraphs: [
      'When you contact CERA Medical or request a service, the proposed collection includes your name, email address, optional telephone number, institution, country and message. To provide a service, CERA Medical may receive files and materials you submit or ask it to retrieve, including sequencing data, sample metadata, health, survey and programme datasets, draft reports and manuscripts, figures and tables, test compounds and biological samples with related records.',
      'The client copy also describes billing information, product-order details, server logs and cookies. Whether those categories apply to the production service must be confirmed before this notice is approved.',
    ],
  },
  {
    heading: 'How information is used',
    paragraphs: [
      'The stated purposes are responding to enquiries and preparing quotations; carrying out requested services and delivering results; invoicing and keeping legally required accounting records; securing and operating the website; sending service messages and updates where requested; and complying with legal obligations or lawful requests.',
      'The client copy identifies consent, performing a requested service, legitimate interests in operating and securing services, and legal obligations as the proposed bases for processing. The applicable legal basis for each activity requires review.',
    ],
  },
  {
    heading: 'Research data, health data and samples',
    paragraphs: [
      'The client copy says files, datasets, samples, compounds and results remain the client’s property and are used only on the client’s instructions for the requested work. It says CERA Medical will not use client materials for its own research, publications, product development or marketing, or disclose them to other clients. Research collaborations are to have a separate written agreement covering ownership, publication and authorship.',
      'Services are intended for de-identified data and coded samples. Clients are asked not to provide direct identifiers and remain responsible for the approvals and consent governing their underlying study or programme. Human genetic reads are described as being removed during quality control and not used for another purpose. Data-sharing or data-protection agreements may be signed before transfer where required by a client organisation.',
      'The client copy states staff and contracted specialists with access are bound by confidentiality and that an NDA is available on request. These handling and security practices must be verified against the live production workflow.',
    ],
  },
  {
    heading: 'Sharing information',
    paragraphs: [
      'The proposed sharing is limited to assigned staff and contracted specialists under confidentiality obligations; operational providers for hosting, email, secure file transfer/storage and payment processing; people the client instructs CERA Medical to involve; and disclosures required by law or a competent authority. The client copy says personal information is not sold.',
    ],
  },
  {
    heading: 'Where information is stored',
    paragraphs: [
      'Storage locations and international transfers have not yet been confirmed for the production environment. The final notice must name the relevant hosting and service providers and explain any transfer outside Pakistan.',
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'The client’s draft describes restricted access, encrypted file transfer, password-protected systems and backups. Those specific controls and backup locations must be confirmed against the production configuration before publication as commitments. No method of transmission or storage is completely secure.',
    ],
  },
  {
    heading: 'Retention',
    paragraphs: [
      'Proposed retention periods and deletion procedures are listed in the Data Retention Policy. Several periods and operational details in the source are still unconfirmed; the schedule is therefore a draft and is not yet an effective retention commitment.',
    ],
  },
  {
    heading: 'Choices and requests',
    paragraphs: [
      'The client draft proposes that people may request access to, correction of or deletion of their information, withdraw consent, or stop updates by writing to theceramedica@gmail.com. Its proposed response time is 30 days, subject to identity checks and records that must be retained by law. Applicable rights and response periods require legal confirmation.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'The client draft describes necessary cookies and optional analytics cookies that would load only after permission is given. The live website’s actual cookies and analytics configuration must be checked; no analytics consent should be requested unless such non-essential technology is enabled.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'The client draft says the website and services are intended for researchers, professionals, organisations and adult consumers, and that programme datasets about children are handled only in de-identified form. This statement and the underlying safeguards require approval.',
    ],
  },
  {
    heading: 'External links',
    paragraphs: [
      'The website may link to journals, databases and other external sites. CERA Medical is not responsible for the content or privacy practices of those sites.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'The client draft proposes revising the terms when services or applicable law change and notifying clients by email where a change materially affects information already held.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      'Questions and information requests may be sent to CERA Medical, 2nd Floor, BIC, C2 Building, PAF-IAST, Mang, Haripur, Pakistan, at theceramedica@gmail.com.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PolicyDocument
      title="Privacy Terms"
      lede="Draft privacy terms prepared from the content supplied by CERA Medical."
      updated="2026-10-03"
      notice={
        <Alert tone="warning" title="Draft for review — not an effective privacy notice">
          <Text size="body-sm">
            The source contains unresolved company-name, hosting, transfer, security, analytics and
            retention details. This draft identifies them rather than making unsupported promises.
            CERA Medical must approve the operational facts and obtain legal review before launch.
          </Text>
        </Alert>
      }
      sections={SECTIONS}
    />
  );
}
