import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../components/page-header.tsx';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research Service FAQs',
    description: 'Answers about CERA Medical research services and project enquiries.',
    path: '/faqs',
  });
}

const FAQS = [
  {
    question: 'Which services does CERA Medical provide?',
    answer:
      'The portfolio includes preclinical studies, molecular research, metagenomic data analysis, biomedical and omics data analysis, and evidence synthesis and technical reports.',
  },
  {
    question: 'How does a project begin?',
    answer:
      'CERA Medical first discusses the research question, available materials or data, required outputs, scope, timeline and cost. The agreed scope is recorded in writing before work begins.',
  },
  {
    question: 'How quickly will you reply?',
    answer:
      'The client service brief says the team aims to reply to a service request within three working days.',
  },
  {
    question: 'What should I include in my request?',
    answer:
      'Describe the research question, samples, compounds or data, timeline and outputs you need. Do not include participant names or other direct identifiers in the website form.',
  },
  {
    question: 'How do I transfer large datasets or samples?',
    answer:
      'Large datasets are transferred later using an agreed secure link or retrieved from a provider or public repository. Arrange physical sample shipping with CERA Medical before sending materials.',
  },
  {
    question: 'When can animal studies start?',
    answer:
      'Animal-study protocols must be approved by the institutional animal ethics committee before the study begins.',
  },
  {
    question: 'How long does metagenomic analysis take?',
    answer:
      'The client brief gives a three-week delivery target for metagenomic analysis. The actual timeline should be confirmed during project scoping.',
  },
] as const;

export default function FaqsPage() {
  return (
    <>
      <PageHeader
        title="Research Service FAQs"
        lede="Answers about CERA Medical’s research services and project requests."
      />
      <div className="mx-auto max-w-measure px-6 py-12 md:px-10 lg:py-16">
        <div className="space-y-4">
          {FAQS.map((item) => (
            <details key={item.question} className="rounded-md border border-border bg-surface p-4">
              <summary className="cursor-pointer font-semibold">{item.question}</summary>
              <Text className="mt-3">{item.answer}</Text>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
