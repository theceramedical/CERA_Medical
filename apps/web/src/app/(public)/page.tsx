import { Heading, Text } from '@cera/ui/typography';

import { HomeMotion } from '../../components/home/home-motion.client.tsx';
import { ScrollHero } from '../../components/home/scroll-hero.client.tsx';
import { AppButtonLink, AppLink } from '../../components/link.tsx';
import { catalogueProducts, productMediaFor } from '../../content/catalogue-products.ts';
import {
  HOME_PROJECTS,
  HELD_PRODUCT_SKUS,
  SERVICE_CATEGORIES,
} from '../../content/public-revision.ts';
import { getPublishedProjects } from '../../lib/cms/public-research-content.ts';
import { pageMetadata } from '../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Research that moves health forward',
    description:
      'CERA Medical is an SECP-registered biomedical research company in Haripur, Pakistan. Preclinical studies, molecular research and biomedical data analysis.',
    path: '/',
  });
}

const held = new Set<string>(HELD_PRODUCT_SKUS);

export default async function HomePage() {
  const products = catalogueProducts()
    .filter((product) => !held.has(product.sku))
    .slice(0, 3);
  const publishedProjects = await getPublishedProjects();
  const homeProjects =
    publishedProjects === null
      ? HOME_PROJECTS
      : publishedProjects.filter((project) => project.featured).slice(0, 3);

  return (
    <HomeMotion>
      <ScrollHero />

      <section data-reveal className="border-b border-border py-14">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div data-reveal-title>
            <Heading level={2} size="h2" className="mb-3">
              Our Services
            </Heading>
            <Text tone="muted" className="mb-8 max-w-2xl">
              Mouse research leads the laboratory. Molecular work and data analysis support those
              studies.
            </Text>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {SERVICE_CATEGORIES.map((service) => (
              <article
                data-card
                key={service.slug}
                className="rounded-lg border border-border bg-surface p-6 shadow-card"
              >
                <Heading level={3} size="h3" className="mb-2">
                  <AppLink href={`/services/${service.slug}`} className="no-underline">
                    {service.title}
                  </AppLink>
                </Heading>
                <Text tone="muted" className="mb-4">
                  {service.summary}
                </Text>
                <ul className="flex list-none flex-wrap gap-2 p-0">
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
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-reveal className="border-b border-border bg-surface-tint py-14">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div data-reveal-title className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Heading level={2} size="h2">
                Our Projects
              </Heading>
              <Text tone="muted" className="mt-2">
                Studies running in our laboratories and analyses we have completed.
              </Text>
            </div>
            <AppLink href="/projects">View all projects</AppLink>
          </div>
          {homeProjects.length === 0 ? (
            <Text tone="muted">No projects are currently published.</Text>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {homeProjects.map((project) => {
                const image = 'image' in project ? project.image : undefined;
                return (
                  <article
                    data-card
                    key={project.slug}
                    className="overflow-hidden rounded-lg border border-border bg-surface shadow-card"
                  >
                    {image === undefined ? null : (
                      <img src={image} alt="" className="h-44 w-full object-cover" />
                    )}
                    <div className="p-6">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-surface-tint px-3 py-1 text-caption font-semibold">
                          {project.category}
                        </span>
                        <span className="rounded-full border border-border px-3 py-1 text-caption font-semibold">
                          {project.status}
                        </span>
                      </div>
                      <Heading level={3} size="h4" className="mb-2">
                        <AppLink href={`/projects/${project.slug}`} className="no-underline">
                          {project.title}
                        </AppLink>
                      </Heading>
                      <Text tone="muted">{project.summary}</Text>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section data-reveal className="border-b border-border py-14">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div data-reveal-title className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Heading level={2} size="h2">
                Research Products
              </Heading>
              <Text tone="muted" className="mt-2">
                Research-use reagents, kits and cell preparations. Price on enquiry.
              </Text>
            </div>
            <AppLink href="/products">View catalogue</AppLink>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {products.map((product) => {
              const media = productMediaFor(product.sku);
              return (
                <article
                  data-card
                  key={product.sku}
                  className="overflow-hidden rounded-lg border border-border bg-surface shadow-card"
                >
                  {media === undefined ? null : (
                    <img
                      src={media.imageSrc}
                      alt={media.imageAlt}
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <div className="p-6">
                    <Heading level={3} size="h4" className="mb-2">
                      <AppLink
                        href={`/products#product-${product.sku.toLowerCase()}`}
                        className="no-underline"
                      >
                        {product.title}
                      </AppLink>
                    </Heading>
                    <Text tone="muted" className="mb-4">
                      {product.summary}
                    </Text>
                    <Text className="font-semibold">Price on enquiry</Text>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section data-reveal className="border-b border-border py-14">
        <div data-reveal-title className="mx-auto max-w-measure px-6 md:px-10">
          <Heading level={2} size="h2" className="mb-4">
            How we work
          </Heading>
          <Text size="body-lg" tone="muted">
            Every project starts with a written scope and protocol and ends with documented results
            and revision rounds. <AppLink href="/methodology">See how we work.</AppLink>
          </Text>
        </div>
      </section>

      <section data-reveal className="bg-primary-800 py-14 text-on-primary">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div data-reveal-title>
            <Heading level={2} size="h2" className="mb-3 text-on-primary">
              Ready to discuss your study?
            </Heading>
            <Text className="mb-6 max-w-2xl text-on-primary/90">
              Tell us about your samples, compounds or data. We reply within three working days.
            </Text>
            <AppButtonLink href="/contact#enquiry" variant="accent" data-cursor="Make an enquiry">
              Make an Enquiry
            </AppButtonLink>
          </div>
        </div>
      </section>
    </HomeMotion>
  );
}
