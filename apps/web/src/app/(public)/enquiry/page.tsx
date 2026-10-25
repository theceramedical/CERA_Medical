import { permanentRedirect } from 'next/navigation';

import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Contact CERA Medical',
    description: 'Contact CERA Medical about a research service.',
    path: '/contact',
  });
}

export default async function EnquiryPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ service?: string; product?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.product !== undefined) query.set('product', params.product);
  if (params.service !== undefined) query.set('service', params.service);
  const search = query.toString();
  permanentRedirect(`/contact${search.length === 0 ? '' : `?${search}`}#enquiry`);
}
