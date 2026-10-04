import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight, ChevronDown } from 'lucide-react';

import { HOMEPAGE_FAQ_PREVIEW } from '../../content/homepage.ts';
import { AppLink } from '../link.tsx';

export function FaqPreviewSection({
  eyebrow = 'Enquiry protocol',
  heading = 'Common Questions',
  subheading = 'Quick answers before you submit an enquiry. Full detail lives on the FAQs page.',
  linkHref = '/faqs',
  linkLabel = 'All FAQs',
  items,
}: {
  readonly eyebrow?: string;
  readonly heading?: string;
  readonly subheading?: string;
  readonly linkHref?: string;
  readonly linkLabel?: string;
  readonly items?: readonly { question: string; answer: string }[];
}) {
  const faqs = items !== undefined && items.length > 0 ? items : HOMEPAGE_FAQ_PREVIEW;

  return (
    <section
      aria-labelledby="faq-preview-heading"
      className="border-b border-border bg-surface-tint py-16"
    >
      <div className="mx-auto max-w-site px-6 md:px-10">
        <div className="mb-12 flex flex-col justify-between md:flex-row md:items-end">
          <div>
            <Text
              as="p"
              size="eyebrow"
              className="font-semibold tracking-widest text-accent uppercase"
            >
              {eyebrow}
            </Text>
            <Heading level={2} size="h2" id="faq-preview-heading" className="mt-1 mb-2">
              {heading}
            </Heading>
            <Text tone="muted">{subheading}</Text>
          </div>
          <AppLink
            href={linkHref}
            className="mt-4 inline-flex items-center gap-1 font-semibold text-accent no-underline md:mt-0"
          >
            {linkLabel}
            <Icon icon={ArrowRight} size="sm" />
          </AppLink>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-border bg-surface p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-heading marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <Icon
                  icon={ChevronDown}
                  size="md"
                  className="shrink-0 text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <Text size="body-sm" tone="muted" className="mt-4 border-t border-border pt-4">
                {item.answer}
              </Text>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
