import { Icon } from '@cera/ui/icon';
import { SectionHeader } from '@cera/ui/section-header';
import { Text } from '@cera/ui/typography';
import { ArrowRight } from 'lucide-react';

import { HOMEPAGE_FAQ_PREVIEW } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

export function FaqPreviewSection() {
  return (
    <section aria-labelledby="faq-preview-heading" className="bg-surface-tint-2">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <SectionHeader
          level={2}
          heading={<span id="faq-preview-heading">Common questions</span>}
          subheading="Quick answers before you submit an enquiry. Full detail lives on the FAQs page."
          action={
            <AppButtonLink
              href="/faqs"
              variant="ghost"
              iconEnd={<Icon icon={ArrowRight} size="sm" />}
            >
              All FAQs
            </AppButtonLink>
          }
        />
        <div className="mt-10 space-y-4">
          {HOMEPAGE_FAQ_PREVIEW.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-border bg-surface p-5 shadow-card open:ring-2 open:ring-focus-ring"
            >
              <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                {item.question}
              </summary>
              <Text tone="muted" className="mt-3">
                {item.answer}
              </Text>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
