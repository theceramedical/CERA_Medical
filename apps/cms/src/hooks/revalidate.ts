import { asString } from '../lib/as-string.ts';

import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload';

/**
 * Tells `apps/web` to drop the cache tags for a published document.
 *
 * Tags live in the web process (`cms:{collection}` and `cms:{collection}:{slug}`).
 * Payload cannot call `revalidateTag` itself - different container - so this is
 * a server-to-server POST with the same preview secret the draft fetch uses.
 * Failure is logged and swallowed: a down web app must not block a publish.
 */
async function notifyWeb(collection: string, slug: string): Promise<void> {
  const web = process.env.WEB_URL;
  const secret = process.env.PAYLOAD_PREVIEW_SECRET;
  if (web === undefined || secret === undefined) return;

  const url = `${web.replace(/\/$/, '')}/api/revalidate`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-preview-secret': secret,
      },
      body: JSON.stringify({ collection, slug }),
    });
  } catch {
    // Web is optional at CMS boot. A missed revalidation lasts until the next
    // successful publish or the cache TTL, not forever.
  }
}

export function revalidateAfterChange(collection: string): CollectionAfterChangeHook {
  return async ({ doc }) => {
    const slug = asString((doc as { slug?: unknown }).slug);
    if (slug.length > 0) await notifyWeb(collection, slug);
    return doc as never;
  };
}

export function revalidateGlobalAfterChange(slug: string): GlobalAfterChangeHook {
  return async ({ doc }) => {
    await notifyWeb(`global:${slug}`, '');
    return doc as never;
  };
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({ doc, collection }) => {
  const slug = asString((doc as { slug?: unknown }).slug);
  if (slug.length > 0) await notifyWeb(collection.slug, slug);
};
