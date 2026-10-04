import { Icon } from '@cera/ui/icon';
import { IconDisc } from '@cera/ui/icon-disc';
import { SectionHeader } from '@cera/ui/section-header';
import { Heading, Text } from '@cera/ui/typography';
import NextLink from 'next/link';

import { HOMEPAGE_EXPLORE } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

export function ExploreSection() {
  return (
    <section aria-labelledby="explore-heading" className="bg-surface">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-16">
        <SectionHeader
          level={2}
          heading={<span id="explore-heading">Explore CERA Medical</span>}
          subheading="Methodology, background, and contact options when you are ready to scope a project."
        />
        <ul className="mt-10 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3">
          {HOMEPAGE_EXPLORE.map((link) => (
            <li
              key={link.href}
              className="flex flex-col rounded-lg border border-border bg-surface-subtle p-6 shadow-card"
            >
              <IconDisc tone="accent">
                <Icon icon={link.icon} size="lg" />
              </IconDisc>
              <Heading level={3} size="h4" className="mt-5">
                <NextLink href={link.href} className="text-foreground hover:text-primary">
                  {link.title}
                </NextLink>
              </Heading>
              <Text tone="muted" size="body-sm" className="mt-2 flex-1">
                {link.description}
              </Text>
              <AppButtonLink href={link.href} variant="outline" className="mt-6 self-start">
                Read more
              </AppButtonLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
