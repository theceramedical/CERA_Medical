import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PolicyDocument } from '../../../components/policy-document.tsx';

import type { PolicySection } from '../../../components/policy-document.tsx';
import type { Metadata } from 'next';

/**
 * Terms of service.
 *
 * Placeholder wording, marked as such for the same reason as the privacy notice. The medical-advice
 * disclaimer is the section that matters most on a site like this and is the one written to be
 * substantively correct rather than filled in later: a visitor who mistakes an information site for a
 * clinical one may delay getting care, and that is not a risk to leave to a later phase.
 */

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms on which CERA Medical provides this website and its enquiry service.',
};

const SECTIONS: readonly PolicySection[] = [
  {
    heading: 'This site is not medical advice',
    paragraphs: [
      'Everything published here is general information about services. It is not a diagnosis, not a treatment recommendation, and not a substitute for speaking to a qualified clinician about your own circumstances.',
      'If you think you may have a medical emergency, contact emergency services immediately. Do not submit an enquiry and wait for a reply - enquiries are handled during working hours and are not monitored as an emergency channel.',
    ],
  },
  {
    heading: 'What an enquiry is',
    paragraphs: [
      'Submitting an enquiry is a request to be contacted about a service. It is not a booking, not an appointment, and not a commitment by us to provide anything.',
      'We will acknowledge your enquiry by email with a reference number. Progress is visible in your account.',
    ],
  },
  {
    heading: 'Using this site',
    paragraphs: [
      'Please do not submit an enquiry on behalf of someone else without their knowledge, submit information that is not yours to share, or attempt to interfere with the operation of the site.',
      'We may decline to act on an enquiry, and we may suspend access where the site is being misused.',
    ],
  },
  {
    heading: 'Accuracy and availability',
    paragraphs: [
      'We take care to keep service information current, but details change. Where something matters to your decision, ask us and we will confirm it.',
      'We aim to keep the site available but do not guarantee uninterrupted access. Planned maintenance will be announced where it is likely to be noticed.',
    ],
  },
  {
    heading: 'Your account',
    paragraphs: [
      'You are responsible for keeping access to your account secure. Tell us promptly if you think someone else has gained access to it.',
      'You can ask us to close your account at any time. Records we are required to keep will be retained as described in the privacy notice.',
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: [
      'We will update this page when the terms change, and the date at the top will change with it. Material changes affecting existing enquiries will be notified by email rather than left to be noticed here.',
    ],
  },
];

export default function TermsPage() {
  return (
    <PolicyDocument
      title="Terms of Service"
      lede="The terms on which we provide this website and the enquiry service."
      updated="2026-09-23"
      notice={
        <Alert tone="warning" title="This wording is a placeholder">
          <Text size="body-sm">
            These terms have not yet been through legal review and must not be relied on as final.
            The first section, on medical advice, states the position the platform is built to - the
            rest is provisional.
          </Text>
        </Alert>
      }
      sections={SECTIONS}
    />
  );
}
