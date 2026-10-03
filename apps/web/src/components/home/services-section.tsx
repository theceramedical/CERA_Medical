import { Icon } from '@cera/ui/icon';
import { SectionHeader } from '@cera/ui/section-header';
import { ServiceCard } from '@cera/ui/service-card';
import { ArrowRight } from 'lucide-react';
import NextLink from 'next/link';

import { HOMEPAGE_SERVICES } from '../../content/homepage.ts';
import { AppButtonLink } from '../link.tsx';

/**
 * The service card row (design-language.md section 5.2 and 4.2).
 *
 * Five services use a three-column grid at desktop widths so the catalogue copy remains readable.
 */
export function ServicesSection() {
  return (
    <section aria-labelledby="services-heading" className="bg-surface">
      <div className="mx-auto max-w-site px-6 py-14 md:px-10 lg:py-20">
        <SectionHeader
          level={2}
          heading={<span id="services-heading">Research Services</span>}
          subheading="From preclinical work and laboratory analysis to microbiome research and evidence reports."
          action={
            <AppButtonLink
              href="/services"
              variant="ghost"
              iconEnd={<Icon icon={ArrowRight} size="sm" />}
            >
              View All Services
            </AppButtonLink>
          }
        />

        {/*
         * A `<ul>`, and `ServiceCard` renders an `<li>`.
         *
         * Not a style choice: a `listitem` with no list ancestor is a serious accessibility violation,
         * and it is exactly the defect the browser sweep found on the design preview page in Phase 03
         * WP-03.8. The type system cannot enforce it, so the requirement is documented on
         * `ServiceCardProps` and caught by the axe run.
         */}
        <ul className="mt-12 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {HOMEPAGE_SERVICES.map((service) => (
            <ServiceCard
              key={service.slug}
              title={service.title}
              description={service.description}
              href={`/services/${service.slug}`}
              icon={<Icon icon={service.icon} size="lg" />}
              // `next/link` for both links inside the card. One prop, so the title and the "Learn
              // More" button cannot end up routed differently - which shows up as the title
              // navigating instantly and the button doing a full page load.
              linkAs={NextLink}
              // `h3`, because the section's own heading is the `h2`. The card defaults to this, and it
              // is stated to make the outline visible at the call site rather than only in the
              // component.
              headingLevel={3}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
