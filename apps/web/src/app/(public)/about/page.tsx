import { Heading, Text } from '@cera/ui/typography';

import { AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';

import type { Metadata } from 'next';

/**
 * About CERA Medical.
 *
 * Company, service and contact copy transcribed from the CERA client brief.
 */

export const metadata: Metadata = {
  title: 'About CERA Medical',
  description:
    'CERA Medical is a biomedical research and development company based in Haripur, Pakistan.',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About CERA Medical"
        lede="A biomedical research and development company providing laboratory, computational and evidence services."
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
            CERA Medical is an SECP-registered biomedical research and development company. We test
            candidate treatments in animal models, cells and computer simulations; run molecular
            laboratory work; analyse microbiome, omics and clinical data; and prepare evidence
            reviews and technical reports for health research and decision-making.
          </Text>

          <Heading level={2} size="h3" className="mt-12">
            How every project runs
          </Heading>
          <Text className="mt-4">
            Every project follows five stages: scoping, protocol, execution, analysis and reporting,
            then follow-up. The scope, timeline and cost are agreed in writing before work begins.
            Study controls, replicates and quality checks are defined in the protocol. Animal
            studies begin only after the protocol has received institutional animal ethics approval.
          </Text>
          <Text className="mt-4">
            Our facilities include an Animal House, Cell Culture Lab, Genomics Lab with Sanger
            sequencing, Histopathology Lab and Microscopy Lab. Project-specific methods and outputs
            are discussed during scoping.
          </Text>

          <Heading level={2} size="h3" className="mt-12">
            Getting in touch
          </Heading>
          <Text className="mt-4">
            For project enquiries, write to us at{' '}
            <AppLink href="mailto:theceramedica@gmail.com">theceramedica@gmail.com</AppLink> or use
            our <AppLink href="/contact">contact page</AppLink>. Please do not include direct
            identifiers for research participants in your initial message.
          </Text>
          <Heading level={2} size="h3" className="mt-12">
            Facilities
          </Heading>
          <Text className="mt-4">
            CERA Medical’s laboratory facilities include an Animal House, Cell Culture Lab, Genomics
            Lab with Sanger sequencing, Histopathology Lab and Microscopy Lab. Computational work
            supports molecular dynamics simulation, sequencing data analysis and other compute-heavy
            research. Exact GPU memory and workstation specifications need confirmation before being
            published.
          </Text>
          <Heading level={2} size="h3" className="mt-12">
            Why work with CERA Medical
          </Heading>
          <Text className="mt-4">
            The client’s service brief describes a PhD-level research and bioinformatics team,
            established and documented analysis workflows, publication-ready outputs, transparent
            project communication, client ownership of data and included revision rounds. Scope,
            deliverables, timeline and cost are agreed in writing for each project.
          </Text>
          <Text className="mt-4">
            Read the project stages on our <AppLink href="/methodology">methodology page</AppLink>.
          </Text>
        </div>
      </div>
    </>
  );
}
