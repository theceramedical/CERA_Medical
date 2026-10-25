import { Heading, Text } from '@cera/ui/typography';

import { AppButtonLink, AppLink } from '../link.tsx';

import type { ServiceCategory } from '../../content/public-revision.ts';

export function ClientServicePage({ service }: { readonly service: ServiceCategory }) {
  return (
    <>
      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="mb-3 text-caption text-muted">
            <AppLink href="/">Home</AppLink>
            <span aria-hidden="true"> / </span>
            <AppLink href="/services">Services</AppLink>
          </p>
          <Heading level={1} size="h1" className="mb-4">
            {service.title}
          </Heading>
          <Text size="body-lg" tone="muted" className="max-w-3xl">
            {service.intro}
          </Text>
          <ul className="mt-6 flex list-none flex-wrap gap-2 p-0">
            {service.chips.map((chip) => (
              <li key={chip.href}>
                <AppLink
                  href={chip.href}
                  className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-caption font-semibold no-underline"
                >
                  {chip.label}
                </AppLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="mx-auto max-w-site space-y-8 px-6 py-12 md:px-10">
        {service.sections.map((section) => (
          <article id={section.id} key={section.id} className="scroll-mt-24">
            <Heading level={2} size="h3" className="mb-3">
              {section.title}
            </Heading>
            {section.body.map((paragraph) => (
              <Text key={paragraph} tone="muted" className="mb-3 max-w-3xl">
                {paragraph}
              </Text>
            ))}
          </article>
        ))}
        {service.closing !== undefined ? (
          <Text className="max-w-3xl">{service.closing}</Text>
        ) : null}
        <p>
          <AppLink href="/projects">
            Our current studies are listed on the Our Projects page.
          </AppLink>
        </p>
        <Text tone="muted">
          Every project starts with a written scope and protocol and ends with documented results
          and revision rounds. <AppLink href="/methodology">See how we work.</AppLink>
        </Text>
        <AppButtonLink
          href={`/contact?service=${encodeURIComponent(service.slug)}#enquiry`}
          variant="primary"
        >
          Make an Enquiry
        </AppButtonLink>
      </div>
    </>
  );
}
