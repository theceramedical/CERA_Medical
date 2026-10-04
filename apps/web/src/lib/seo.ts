import { defaultOpenGraphImages, SITE_NAME } from './seo-site.ts';
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
  readonly ogImagePath?: string;
  readonly ogImageAlt?: string;
}): Metadata {
  const url = absoluteUrl(options.path);
  const images: NonNullable<Metadata['openGraph']>['images'] =
    options.ogImagePath === undefined
      ? defaultOpenGraphImages()
      : [
          {
            url: absoluteUrl(options.ogImagePath),
            alt: options.ogImageAlt ?? options.title,
          },
        ];
  const twitterImages = Array.isArray(images)
    ? images.map((image) => {
        if (typeof image === 'string') return image;
        if (image instanceof URL) return image.toString();
        const url = image.url;
        return url instanceof URL ? url.toString() : url;
      })
    : [];

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: url },
    openGraph: {
      title: options.title,
      description: options.description,
      url,
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_GB',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
      images: twitterImages,
    },
    ...(options.noIndex === true
      ? { robots: { index: false, follow: true } }
      : { robots: { index: true, follow: true } }),
  };
}
