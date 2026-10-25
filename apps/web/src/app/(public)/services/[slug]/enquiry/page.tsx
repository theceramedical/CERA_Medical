import { permanentRedirect } from 'next/navigation';

import { pageMetadata } from '../../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Contact CERA Medical',
    description: 'Contact CERA Medical about a research service.',
    path: '/contact',
  });
}

export default async function ServiceEnquiryPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/contact?service=${encodeURIComponent(slug)}#enquiry`);
}
