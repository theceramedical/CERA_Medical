import { Icon } from '@cera/ui/icon';
import { SectionHeader } from '@cera/ui/section-header';
import { ServiceCard } from '@cera/ui/service-card';
import { ArrowRight } from 'lucide-react';
import NextLink from 'next/link';

import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

import { serviceCardIcon } from '../../lib/service-card-icon.ts';
import { AppButtonLink } from '../link.tsx';

export interface ServicesSectionProps {
  readonly heading?: string;
  readonly subheading?: string;
  readonly viewAllHref?: string;
  readonly viewAllLabel?: string;
  readonly presentations?: readonly ContentDocument[];
  readonly catalogue?: readonly PublicService[];
}

export function ServicesSection({
  heading = 'Research Services',
  subheading = 'Five integrated service lines — each with enquiry enabled on the catalogue so you can request scoping without leaving the site.',
  viewAllHref = '/services',
  viewAllLabel = 'View All Services',
  presentations = [],
  catalogue = [],
}: ServicesSectionProps) {
  const presentationBySlug = new Map(presentations.map((item) => [item.slug, item]));
  const cards =
    catalogue.length > 0
      ? catalogue.map((service) => {
          const copy = presentationBySlug.get(service.slug);
          return {
            slug: service.slug,
            title: copy?.title ?? service.title,
            description: copy?.excerpt ?? service.summary,
            highlights: copy?.cardHighlights,
            iconKey: copy?.cardIcon,
            wide: service.slug === 'evidence-synthesis-technical-reports',
          };
        })
      : presentations.map((copy) => ({
          slug: copy.slug,
          title: copy.title,
          description: copy.excerpt ?? '',
          highlights: copy.cardHighlights,
          iconKey: copy.cardIcon,
          wide: copy.slug === 'evidence-synthesis-technical-reports',
        }));

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="services-heading" className="bg-surface">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <SectionHeader
          level={2}
          heading={<span id="services-heading">{heading}</span>}
          subheading={subheading}
          action={
            <AppButtonLink
              href={viewAllHref}
              variant="ghost"
              iconEnd={<Icon icon={ArrowRight} size="sm" />}
            >
              {viewAllLabel}
            </AppButtonLink>
          }
        />
        <ul className="mt-12 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((service) => {
            const LucideIcon = serviceCardIcon(service.iconKey);
            return (
              <ServiceCard
                key={service.slug}
                title={service.title}
                description={service.description}
                href={`/services/${service.slug}`}
                {...(LucideIcon === undefined
                  ? {}
                  : { icon: <Icon icon={LucideIcon} size="lg" /> })}
                {...(service.highlights === undefined ? {} : { highlights: service.highlights })}
                {...(service.wide ? { className: 'md:col-span-2 lg:col-span-2' } : {})}
                linkAs={NextLink}
                headingLevel={3}
              />
            );
          })}
        </ul>
      </div>
    </section>
  );
}
