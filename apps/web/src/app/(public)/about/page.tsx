import { Heading, Text } from '@cera/ui/typography';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';

import type { Metadata } from 'next';

/**
 * About CERA Medical.
 *
 * Real layout and real metadata; the words are placeholders pending CERA's own copy (PRD 22) and are
 * written to be replaceable without changing the structure. Phase 05 moves them into the CMS.
 */

export const metadata: Metadata = {
  title: 'About CERA Medical',
  description:
    'CERA Medical exists to make trusted medical information and services easier to reach.',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About CERA Medical"
        lede="We exist to make trusted medical information and services easier to reach."
      />

      {/*
       * `prose`-free on purpose. There is no typography plugin in this project, so long-form text is
       * composed from `Text` and `Heading` with explicit spacing - which means the type scale in
       * theme.css is the only thing deciding sizes, and a CMS-authored page in Phase 05 will render
       * through the same components rather than through a second set of styles.
       */}
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="max-w-measure">
          <Heading level={2} size="h3">
            What we do
          </Heading>
          <Text className="mt-4">
            CERA Medical publishes clear information about medical services and provides a simple
            way to enquire about them. We are not a clinical provider: we do not diagnose, treat, or
            hold medical records. What we do is remove the friction between a person with a question
            and the service that can answer it.
          </Text>

          <Heading level={2} size="h3" className="mt-12">
            How an enquiry works
          </Heading>
          <Text className="mt-4">
            You tell us which service you are interested in and how to reach you. We confirm by
            email with a reference number, and you can follow progress in your account at any point.
            We never ask for symptoms, conditions, or anything else clinical, and there is nowhere
            in this platform for that information to be stored.
          </Text>
          <Text className="mt-4">
            The full detail of what we collect and why is in our{' '}
            <AppLink href="/privacy">privacy notice</AppLink>.
          </Text>

          <Heading level={2} size="h3" className="mt-12">
            Getting in touch
          </Heading>
          <Text className="mt-4">
            For anything about a specific enquiry, quote its reference number. For everything else,
            the details on our <AppLink href="/contact">contact page</AppLink> reach the same team.
          </Text>
        </div>
      </div>
    </>
  );
}
