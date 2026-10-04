import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

import { HOMEPAGE_SERVICES } from '../../content/homepage.ts';
import { serviceCardIcon } from '../../lib/service-card-icon';
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
  presentations = [],
  catalogue = [],
}: ServicesSectionProps) {
  const presentationBySlug = new Map(presentations.map((item) => [item.slug, item]));
  const cards =
    catalogue.length > 0
      ? catalogue.map((service) => {
          const copy = presentationBySlug.get(service.slug);
          const fallback = HOMEPAGE_SERVICES.find((item) => item.slug === service.slug);
          return {
            slug: service.slug,
            title: copy?.title ?? service.title,
            description: copy?.excerpt ?? service.summary,
            highlights: copy?.cardHighlights ?? fallback?.highlights,
            icon: serviceCardIcon(copy?.cardIcon) ?? fallback?.icon,
            wide: service.slug === 'evidence-synthesis-technical-reports',
          };
        })
      : HOMEPAGE_SERVICES.map((service) => ({
          slug: service.slug,
          title: service.title,
          description: service.description,
          highlights: service.highlights,
          icon: service.icon,
          wide: service.slug === 'evidence-synthesis-technical-reports',
        }));

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="services-heading" className="border-b border-border bg-surface py-16">
      <div className="mx-auto max-w-site px-6 md:px-10">
        <div className="mb-12 max-w-2xl">
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <Heading level={2} size="h2" id="services-heading" className="mb-2">
            {heading}
          </Heading>
          <Text tone="muted">{subheading}</Text>
        </div>
        <ul className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((service) => {
            const LucideIcon = service.icon;
            return (
              <li
                key={service.slug}
                className={`flex flex-col justify-between rounded-lg border border-border bg-surface p-6 shadow-card ${service.wide ? 'md:col-span-2' : ''}`}
              >
                <div>
                  {LucideIcon === undefined ? null : (
                    <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-surface-tint text-primary">
                      <Icon icon={LucideIcon} size="lg" />
                    </div>
                  )}
                  <Heading level={3} size="h4" className="mb-2">
                    {service.title}
                  </Heading>
                  <Text
                    size="body-sm"
                    tone="muted"
                    className={`mb-6 leading-relaxed ${service.wide ? 'max-w-xl' : ''}`}
                  >
                    {service.description}
                  </Text>
                  {service.highlights !== undefined && service.highlights.length > 0 ? (
                    <ul
                      className={`mb-6 list-none space-y-2 p-0 text-caption text-muted ${service.wide ? 'grid grid-cols-1 gap-3 space-y-0 sm:grid-cols-2' : ''}`}
                    >
                      {service.highlights.map((item) => (
                        <li key={item} className="flex items-center gap-1.5">
                          <Icon icon={CheckCircle2} size="sm" className="text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <AppButtonLink
                  href={`/services/${service.slug}`}
                  variant="outline"
                  fullWidth={!service.wide}
                  className={service.wide ? 'sm:w-auto' : undefined}
                  iconEnd={<Icon icon={ArrowRight} size="sm" />}
                  aria-label={`Learn more about ${service.title}`}
                >
                  Learn More
                </AppButtonLink>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
