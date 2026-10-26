import { notFound } from 'next/navigation';

import { CategoryServiceDetails, serviceCategoryMetadata } from '../../../../components/services/category-service-details.tsx';
import { getPublishedDocument } from '../../../../lib/cms/client.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const presentation = await getPublishedDocument('servicePresentation', slug);
  const page = serviceCategoryMetadata(slug, presentation);
  if (page === null) {
    return pageMetadata({
      title: 'Service not found',
      description: 'That service could not be found.',
      path: `/services/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({ title: page.title, description: page.intro, path: `/services/${slug}` });
}

export default async function ServiceDetailPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (serviceCategoryMetadata(slug) === null) notFound();
  const presentation = await getPublishedDocument('servicePresentation', slug);
  return <CategoryServiceDetails slug={slug} document={presentation} />;
}
