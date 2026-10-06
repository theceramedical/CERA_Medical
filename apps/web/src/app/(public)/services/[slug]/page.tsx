import { EmptyState } from '@cera/ui/empty-state';
import { Heading, Text } from '@cera/ui/typography';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { CmsLayout } from '../../../../components/cms-content-page.tsx';
import { JsonLd, serviceJsonLd } from '../../../../components/json-ld.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { MarketingPageHeader } from '../../../../components/marketing-page-header.tsx';
import { RichText } from '../../../../components/rich-text.tsx';
import { ServiceEnquiryAside } from '../../../../components/service-enquiry-aside.tsx';
import { getPublicService, listPublicServices } from '../../../../lib/catalogue/client.ts';
import { getDocument, getPublishedDocument } from '../../../../lib/cms/client.ts';
import { absoluteUrl, pageMetadata } from '../../../../lib/seo.ts';
import { serviceHeroFromLayout } from '../../../../lib/service-hero.ts';
import { parseServiceLayout } from '../../../../lib/service-layout.ts';
import { siteUrl } from '../../../../lib/site-url.ts';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [service, presentation] = await Promise.all([
    getPublicService(slug),
    getPublishedDocument('servicePresentation', slug),
  ]);
  if (service === 'gone') {
    return pageMetadata({
      title: 'Service no longer offered',
      description: 'This service is no longer offered by CERA Medical.',
      path: `/services/${slug}`,
      noIndex: true,
    });
  }
  if (service === null) {
    return pageMetadata({
      title: 'Service not found',
      description: 'That service could not be found.',
      path: `/services/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    title: presentation?.seo.title ?? presentation?.title ?? service.title,
    description: presentation?.seo.description ?? presentation?.excerpt ?? service.summary,
    path: `/services/${slug}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, allServices] = await Promise.all([getPublicService(slug), listPublicServices()]);

  if (service === 'gone') {
    return (
      <div className="mx-auto max-w-site px-6 py-16 md:px-10">
        <EmptyState
          heading="This service is no longer offered"
          description="Travel vaccinations have been withdrawn. Browse current services or make an enquiry about something else."
          action={<AppLink href="/services">View current services</AppLink>}
        />
      </div>
    );
  }

  if (service === null) notFound();

  const draft = await draftMode();
  const presentation = await getDocument('servicePresentation', slug, draft.isEnabled);
  const { mainBlocks, enquiryAside, sidebarCards } = parseServiceLayout(presentation?.layout);
  const hasStructuredLayout = mainBlocks.length > 0;

  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          origin: siteUrl().origin,
          name: presentation?.title ?? service.title,
          description: presentation?.excerpt ?? service.summary,
          url: absoluteUrl(`/services/${slug}`),
        })}
      />
      <MarketingPageHeader
        title={presentation?.title ?? service.title}
        lede={presentation?.excerpt ?? service.summary}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: presentation?.title ?? service.title },
        ]}
        availability={service.availabilityText}
        {...(() => {
          const hero = serviceHeroFromLayout(slug, presentation?.layout, service.category?.slug);
          return {
            ...(hero.eyebrow !== undefined ? { eyebrow: hero.eyebrow } : {}),
            badges: hero.badges,
            ...(hero.noticeTitle !== undefined && hero.noticeBody !== undefined
              ? { notice: { title: hero.noticeTitle, body: hero.noticeBody } }
              : {}),
          };
        })()}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="min-w-0 space-y-12">
            {service.imageUrl !== null ? (
              <figure className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
                <img
                  src={service.imageUrl}
                  alt=""
                  className="h-auto max-h-[28rem] w-full object-cover"
                />
              </figure>
            ) : null}
            {hasStructuredLayout ? (
              <>
                {presentation?.body ? (
                  <div className="prose-measure">
                    <RichText body={presentation.body} />
                  </div>
                ) : null}
                <CmsLayout blocks={mainBlocks} embedded />
              </>
            ) : (
              <>
                {service.displayPrice !== null ? (
                  <Text className="font-medium">{service.displayPrice}</Text>
                ) : null}
                <div>
                  {presentation !== null ? (
                    <RichText body={presentation.body} />
                  ) : (
                    <Text>{service.description}</Text>
                  )}
                </div>
              </>
            )}
          </article>

          <ServiceEnquiryAside
            slug={slug}
            displayPrice={service.displayPrice}
            listPriceMinor={service.listPriceMinor}
            productCheckoutEnabled={service.checkoutEnabled}
            enquiryEnabled={service.enquiryEnabled}
            enquiryAside={enquiryAside}
            sidebarCards={sidebarCards}
          />
        </div>

        {allServices.items.filter((item) => item.slug !== slug).slice(0, 3).length > 0 ? (
          <section
            className="mt-16 border-t border-border pt-12"
            aria-labelledby="related-services-heading"
          >
            <Heading level={2} size="h3" id="related-services-heading">
              Explore related services
            </Heading>
            <ul className="mt-6 grid list-none gap-4 p-0 md:grid-cols-3">
              {allServices.items
                .filter((item) => item.slug !== slug)
                .slice(0, 3)
                .map((item) => (
                  <li key={item.slug}>
                    <AppLink
                      href={`/services/${item.slug}`}
                      className="block rounded-lg border border-border bg-surface p-5 no-underline transition-shadow hover:shadow-card"
                    >
                      <Text className="font-semibold text-copy">{item.title}</Text>
                      <Text size="body-sm" tone="muted" className="mt-2">
                        {item.summary}
                      </Text>
                    </AppLink>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
