import { revalidateTag } from 'next/cache';

const COLLECTIONS = ['pages', 'posts', 'policies', 'service-presentations'] as const;

/**
 * Server-to-server cache invalidation from the CMS after publish/unpublish.
 *
 * Same shared secret as draft preview. The secret never reaches the browser;
 * only Payload's afterChange hook holds it. Tags match `lib/cms/client.ts`.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.PAYLOAD_PREVIEW_SECRET;
  const given = request.headers.get('x-preview-secret');
  if (secret === undefined || given !== secret) {
    return new Response('Unauthorised.', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON.', { status: 400 });
  }

  if (body === null || typeof body !== 'object') {
    return new Response('Invalid body.', { status: 400 });
  }

  const collection = 'collection' in body ? body.collection : undefined;
  const slug = 'slug' in body ? body.slug : undefined;

  if (collection === 'global:site-settings') {
    revalidateTag('cms:global:site-settings', 'max');
    return Response.json({ revalidated: true });
  }

  if (
    typeof collection !== 'string' ||
    !COLLECTIONS.includes(collection as (typeof COLLECTIONS)[number])
  ) {
    return new Response('Unknown collection.', { status: 400 });
  }

  revalidateTag(`cms:${collection}`, 'max');
  if (typeof slug === 'string' && slug.length > 0) {
    revalidateTag(`cms:${collection}:${slug}`, 'max');
  }

  return Response.json({ revalidated: true });
}
