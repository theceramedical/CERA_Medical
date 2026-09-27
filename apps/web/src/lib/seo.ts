import { siteUrl } from './site-url.ts';

import type { Metadata } from 'next';

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

export function pageMetadata(options: {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(options.path);
  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: url },
    openGraph: {
      title: options.title,
      description: options.description,
      url,
      type: 'website',
      siteName: 'CERA Medical',
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
    },
    ...(options.noIndex === true ? { robots: { index: false, follow: true } } : {}),
  };
}
