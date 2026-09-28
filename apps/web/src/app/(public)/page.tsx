import { ArticlesSection } from '../../components/home/articles-section.tsx';
import { CtaBandSection } from '../../components/home/cta-band-section.tsx';
import { HeroSection } from '../../components/home/hero-section.tsx';
import { ProcessSection } from '../../components/home/process-section.tsx';
import { ServicesSection } from '../../components/home/services-section.tsx';
import {
  JsonLd,
  medicalBusinessJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from '../../components/json-ld.tsx';
import { siteUrl } from '../../lib/site-url.ts';

import type { Metadata } from 'next';

/**
 * The homepage, reproducing the reference image section for section.
 *
 * **The band order and their backgrounds are the layout,** per design-language.md section 4.1: hero on
 * `surface-tint`, services on white, process on `surface-tint-2`, articles on white, the gradient CTA,
 * then the footer. The alternation is what separates the bands - there are no dividing rules between
 * them - so reordering these five lines would put two white bands together and visually merge them.
 *
 * Each section owns its own background and padding rather than receiving them here, so a section can be
 * moved to another page without carrying a `className` that only made sense in this stack.
 *
 * Every section is a server component. The only client code on this page arrives through the header's
 * three islands, which is what keeps a content page's JavaScript to the router and the hydration
 * bootstrap.
 */

export const metadata: Metadata = {
  /**
   * An absolute title, overriding the layout's `%s | CERA Medical` template.
   *
   * The homepage is the one page where the template produces the wrong result: "Home | CERA Medical"
   * buries the brand behind a word that means nothing in a search result or a bookmark list.
   */
  title: { absolute: 'CERA Medical - Trusted Medical Services, Made Easier to Access' },
  description:
    'Clear information. Simple enquiries. Better care for a healthier tomorrow. Explore our range of trusted medical services and make an enquiry online.',
};

export default function HomePage() {
  const origin = siteUrl().origin;

  return (
    <>
      <JsonLd data={organizationJsonLd(origin)} />
      <JsonLd data={websiteJsonLd(origin)} />
      <JsonLd data={medicalBusinessJsonLd(origin)} />
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
      <ArticlesSection />
      <CtaBandSection />
    </>
  );
}
