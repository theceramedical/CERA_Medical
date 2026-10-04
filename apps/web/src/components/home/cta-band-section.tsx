import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight } from 'lucide-react';

import { CTA_BAND } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

export interface CtaContent {
  readonly heading?: string | undefined;
  readonly body?: string | undefined;
  readonly href?: string | undefined;
  readonly label?: string | undefined;
}

export function CtaBandSection({ content = {} }: { readonly content?: CtaContent }) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="bg-linear-to-r from-gradient-from to-gradient-to py-16 text-on-primary"
    >
      <div className="mx-auto max-w-site px-6 text-center md:px-10">
        <Heading
          level={2}
          size="h1"
          tone="on-dark"
          id="cta-heading"
          className="mb-4 tracking-tight"
        >
          {content.heading ?? CTA_BAND.heading}
        </Heading>
        <Text size="body-lg" tone="on-dark" className="mx-auto mb-8 max-w-2xl leading-relaxed">
          {content.body ?? CTA_BAND.body}
        </Text>
        <div className="flex justify-center">
          <AppButtonLink
            href={content.href ?? '/enquiry'}
            variant="on-dark"
            size="lg"
            iconEnd={<Icon icon={ArrowRight} size="sm" />}
          >
            {content.label ?? 'Make an Enquiry'}
          </AppButtonLink>
        </div>
      </div>
    </section>
  );
}
