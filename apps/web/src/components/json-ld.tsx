/**
 * JSON-LD that never claims a capability the PRD excludes.
 *
 * No `offers`, no `price`, no `MedicalProcedure`. A service page may say it is
 * a Service; it may not invent a price or a procedure.
 */

import { headers } from 'next/headers';

export async function JsonLd({ data }: { readonly data: Record<string, unknown> }) {
  const policy = (await headers()).get('content-security-policy');
  const nonce = /'nonce-([^']+)'/.exec(policy ?? '')?.[1];
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function organizationJsonLd(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CERA Medical',
    url: origin,
  };
}

export function websiteJsonLd(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CERA Medical',
    url: origin,
  };
}

export function medicalBusinessJsonLd(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'CERA Medical',
    url: origin,
  };
}

export function serviceJsonLd(options: {
  readonly origin: string;
  readonly name: string;
  readonly description: string;
  readonly url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: options.name,
    description: options.description,
    url: options.url,
    provider: { '@type': 'Organization', name: 'CERA Medical', url: options.origin },
  };
}

export function articleJsonLd(options: {
  readonly origin: string;
  readonly title: string;
  readonly url: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.title,
    mainEntityOfPage: options.url,
    publisher: { '@type': 'Organization', name: 'CERA Medical', url: options.origin },
  };
}
