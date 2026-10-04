import { siteUrl } from './site-url.ts';

import type { Metadata } from 'next';

/** Default social preview when a route does not supply its own image. */
export const DEFAULT_OG_IMAGE_PATH = '/images/hero-portrait.svg';

export const SITE_NAME = 'CERA Medical';

export function absoluteOrigin(): string {
  return siteUrl().origin;
}

export function googleSiteVerification(): Metadata['verification'] | undefined {
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if (token === undefined || token.length === 0) return undefined;
  return { google: token };
}

export function defaultOpenGraphImages(): NonNullable<Metadata['openGraph']>['images'] {
  const url = new URL(DEFAULT_OG_IMAGE_PATH, siteUrl()).toString();
  return [
    {
      url,
      alt: `${SITE_NAME} — biomedical research and laboratory services`,
    },
  ];
}
