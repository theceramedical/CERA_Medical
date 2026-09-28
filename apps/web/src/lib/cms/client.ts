import 'server-only';

import { type ContentDocument, type ContentType } from '@cera/contracts';
import { unstable_cache } from 'next/cache';

import { mapCmsDocument } from './map.ts';

/**
 * Server-side Payload client.
 *
 * `server-only` so a client component that imports this fails the build rather
 * than shipping `PAYLOAD_PREVIEW_SECRET` and the CMS origin into the browser
 * bundle (INT-803, and the preview-token contract).
 */

const COLLECTION: Record<ContentType, string> = {
  page: 'pages',
  post: 'posts',
  policy: 'policies',
  servicePresentation: 'service-presentations',
};

function cmsApiUrl(): string {
  return process.env.CMS_API_URL ?? process.env.CMS_URL ?? 'http://localhost:3001/api';
}

interface PayloadList<T> {
  readonly docs: readonly T[];
}

export async function getPublishedDocument(
  type: ContentType,
  slug: string,
): Promise<ContentDocument | null> {
  const collection = COLLECTION[type];
  const url = new URL(`${cmsApiUrl().replace(/\/$/, '')}/${collection}`);
  url.searchParams.set('where[slug][equals]', slug);
  url.searchParams.set('limit', '1');
  url.searchParams.set('depth', '1');

  const cached = unstable_cache(
    async () => {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) return null;
      const body = (await response.json()) as PayloadList<Record<string, unknown>>;
      const doc = body.docs[0];
      if (doc === undefined) return null;
      return mapCmsDocument(type, doc as never);
    },
    ['cms', type, slug, 'published'],
    { tags: [`cms:${collection}`, `cms:${collection}:${slug}`] },
  );

  return cached();
}

export async function getDraftDocument(
  type: ContentType,
  slug: string,
): Promise<ContentDocument | null> {
  const secret = process.env.PAYLOAD_PREVIEW_SECRET;
  if (secret === undefined) return null;

  const url = new URL(`${cmsApiUrl().replace(/\/$/, '')}/preview-document`);
  url.searchParams.set('collection', COLLECTION[type]);
  url.searchParams.set('slug', slug);

  const response = await fetch(url, {
    headers: { accept: 'application/json', 'x-preview-secret': secret },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const doc = (await response.json()) as Record<string, unknown>;
  return mapCmsDocument(type, doc as never);
}

export async function getDocument(
  type: ContentType,
  slug: string,
  draft: boolean,
): Promise<ContentDocument | null> {
  if (draft) return getDraftDocument(type, slug);
  return getPublishedDocument(type, slug);
}

export async function listPublishedDocuments(
  type: ContentType,
): Promise<readonly ContentDocument[]> {
  const collection = COLLECTION[type];
  const url = new URL(`${cmsApiUrl().replace(/\/$/, '')}/${collection}`);
  url.searchParams.set('limit', '50');
  url.searchParams.set('depth', '1');
  url.searchParams.set('sort', '-publishedAt');

  const response = await fetch(url, { next: { tags: [`cms:${collection}`] } });
  if (!response.ok) return [];
  const body = (await response.json()) as PayloadList<Record<string, unknown>>;
  return body.docs
    .map((doc) => {
      try {
        return mapCmsDocument(type, doc as never);
      } catch {
        return null;
      }
    })
    .filter((doc): doc is ContentDocument => doc !== null && doc.status === 'published');
}
