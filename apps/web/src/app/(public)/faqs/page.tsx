import { Text } from '@cera/ui/typography';

import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { getCurrentDocument, getPublicGlobal } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research Service FAQs',
    description: 'Answers about CERA Medical research services and project enquiries.',
    path: '/faqs',
  });
}

export default async function FaqsPage() {
  const [settings, page] = await Promise.all([
    getPublicGlobal<{
      faqs?: readonly { question: string; answer: string }[];
    }>('site-settings'),
    getCurrentDocument('page', 'faqs'),
  ]);
  const hero = page === null ? null : sectionHeadingFromLayout(page.layout);
  const localFaqs = [
    {
      question: 'Which services does CERA Medical provide?',
      answer:
        'Our services cover three areas: preclinical studies, molecular research and biomedical data analysis, which includes metagenomics, health and omics data analysis, and evidence synthesis and technical reports.',
    },
    {
      question: 'How does a project begin?',
      answer:
        'We first discuss the research question, available materials or data, required outputs, scope, timeline and cost. The agreed scope is recorded in writing before work begins.',
    },
    {
      question: 'How quickly will you reply?',
      answer: 'We aim to reply to a service request within three working days.',
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
        'Metagenomic analysis is typically delivered within three weeks. The exact timeline is confirmed during project scoping.',
    },
  ];
  const published = (settings?.faqs ?? []).filter(
    (item) => !item.answer.includes('The client brief gives a three-week delivery target'),
  );
  const items = [
    ...localFaqs,
    ...published.filter((item) => !localFaqs.some((local) => local.question === item.question)),
  ];

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? page?.title ?? 'Research Service FAQs'}
        lede={
          hero?.lede ??
          page?.excerpt ??
          'Answers about CERA Medical research services and project enquiries.'
        }
        eyebrow={hero?.eyebrow ?? 'Support'}
      />
      <div className="mx-auto max-w-measure px-6 py-12 md:px-10 lg:py-16">
        <div className="space-y-4">
          {items.map((item) => (
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
