import { Heading, Text } from '@cera/ui/typography';

import { SERVICE_CATEGORIES } from '../../content/public-revision.ts';
import { AppButtonLink, AppLink } from '../link.tsx';

export function ServicesOverview() {
  return (
    <>
      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Heading level={1} size="h1" className="mb-4">
            Our Services
          </Heading>
          <Text size="body-lg" tone="muted" className="max-w-3xl">
            CERA Medical supports biomedical research in three areas: preclinical studies, molecular
            research and biomedical data analysis. For every project we agree the scope, timeline
            and cost in writing before work begins.
          </Text>
        </div>
      </section>
      <div className="mx-auto grid max-w-site grid-cols-1 gap-6 px-6 py-12 md:px-10 lg:grid-cols-3">
        {SERVICE_CATEGORIES.map((service) => (
          <article
            key={service.slug}
            className="flex flex-col rounded-lg border border-border bg-surface p-6 shadow-card"
          >
            <Heading level={2} size="h3" className="mb-2">
              {service.title}
            </Heading>
            <Text tone="muted" className="mb-4">
              {service.summary}
            </Text>
            <ul className="mb-6 flex list-none flex-wrap gap-2 p-0">
              {service.chips.map((chip) => (
                <li key={chip.href}>
                  <AppLink
                    href={chip.href}
                    className="inline-flex rounded-full border border-border px-3 py-1 text-caption no-underline"
                  >
                    {chip.label}
                  </AppLink>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-3">
              <AppButtonLink href={`/services/${service.slug}`} variant="primary">
                Learn More
              </AppButtonLink>
              <AppButtonLink
                href={`/contact?service=${encodeURIComponent(service.slug)}#enquiry`}
                variant="outline"
              >
                Request Scoping
              </AppButtonLink>
            </div>
          </article>
        ))}
      </div>
      <div className="mx-auto max-w-site px-6 pb-16 md:px-10">
        <Text tone="muted">
          Every project starts with a written scope and protocol and ends with documented results
          and revision rounds. <AppLink href="/methodology">See how we work.</AppLink>
        </Text>
      </div>
    </>
  );
}
