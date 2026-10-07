import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { ClipboardCheck, ShieldCheck, Users } from 'lucide-react';
import Image from 'next/image';

import { HERO } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

import type { LucideIcon } from 'lucide-react';

const DEFAULT_TRUST: readonly { label: string; icon: LucideIcon }[] = [
  { label: 'Documented methods', icon: ClipboardCheck },
  { label: 'Reproducible analysis', icon: ShieldCheck },
  { label: 'Research team support', icon: Users },
];

export interface HeroContent {
  readonly eyebrow?: string | undefined;
  readonly headlinePrimary?: string | undefined;
  readonly headlineAccent?: string | undefined;
  readonly body?: string | undefined;
  readonly primaryHref?: string | undefined;
  readonly primaryLabel?: string | undefined;
  readonly secondaryHref?: string | undefined;
  readonly secondaryLabel?: string | undefined;
  readonly imageUrl?: string | undefined;
  readonly imageAlt?: string | undefined;
  readonly badgeTitle?: string | undefined;
  readonly badgeBody?: string | undefined;
  readonly trustLabels?: readonly string[] | undefined;
}

export function HeroSection({ content = {} }: { readonly content?: HeroContent }) {
  const trustItems =
    content.trustLabels !== undefined && content.trustLabels.length > 0
      ? content.trustLabels.map((label, index) => ({
          label,
          icon: DEFAULT_TRUST[index % DEFAULT_TRUST.length]?.icon ?? ClipboardCheck,
        }))
      : DEFAULT_TRUST;
  const badgeTitle = content.badgeTitle ?? HERO.badge.title;
  const badgeBody = content.badgeBody ?? HERO.badge.body;
  const headlinePrimary = content.headlinePrimary ?? HERO.headlinePrimary;
  const headlineAccent = content.headlineAccent ?? HERO.headlineAccent;

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface-tint pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 -right-6 select-none font-wordmark text-[3.25rem] leading-none font-extrabold text-primary opacity-5 sm:-right-10 sm:text-[5rem] lg:text-[7rem]"
      >
        SCIENCE • RIGOR • DATA
      </div>
      <div className="relative z-10 mx-auto max-w-site px-6 md:px-10">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="flex flex-col items-start lg:col-span-7 lg:pr-4">
            <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 shadow-sm">
              <span className="size-2 rounded-full bg-accent" />
              <Text as="p" size="eyebrow" tone="muted" className="tracking-[0.14em]">
                {content.eyebrow ?? HERO.eyebrow}
              </Text>
            </div>
            <Heading
              level={1}
              size="display-1"
              className="mb-4 max-w-full tracking-tight break-words"
            >
              <span className="block">{headlinePrimary}</span>
              <span className="block text-accent-hover">
                {headlineAccent.startsWith(' ') ? headlineAccent : ` ${headlineAccent}`}
              </span>
            </Heading>
            <Text size="body-lg" tone="muted" className="mb-8 max-w-xl leading-relaxed">
              {content.body ?? HERO.body}
            </Text>
            <div className="mb-10 flex w-full flex-wrap items-center gap-4 sm:w-auto">
              <AppButtonLink href={content.primaryHref ?? '/services'} variant="primary" size="lg">
                {content.primaryLabel ?? 'Explore Services'}
              </AppButtonLink>
              <AppButtonLink href={content.secondaryHref ?? '/enquiry'} variant="outline" size="lg">
                {content.secondaryLabel ?? 'Make an Enquiry'}
              </AppButtonLink>
            </div>
            <ul className="grid w-full list-none grid-cols-1 gap-4 border-t border-border p-0 pt-6 sm:grid-cols-3">
              {trustItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5">
                  <Icon icon={item.icon} size="md" className="shrink-0 text-accent" />
                  <Text size="body-sm" className="font-semibold">
                    {item.label}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-8 lg:col-span-5 lg:mt-0">
            <div className="relative h-64 overflow-hidden rounded-lg border border-border bg-surface shadow-md sm:h-80 lg:h-[460px]">
              <Image
                src={content.imageUrl ?? '/images/hero-portrait.svg'}
                alt={
                  content.imageAlt ??
                  'Laboratory researcher pipetting reagents in a biomedical testing facility.'
                }
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary-900/40 via-transparent to-transparent" />
            </div>
            <div className="relative mt-4 flex max-w-full items-start gap-4 rounded-lg border border-border bg-surface p-4 shadow-lg sm:absolute sm:-bottom-6 sm:-left-6 sm:mt-0 sm:max-w-sm sm:p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-surface-tint text-accent">
                <Icon icon={ClipboardCheck} size="md" />
              </div>
              <div>
                <Heading level={2} size="h4" className="mb-1">
                  {badgeTitle}
                </Heading>
                <Text size="caption" tone="muted">
                  {badgeBody}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
