import { verifyPreviewToken } from '@cera/contracts/preview-token';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Enables Next draft mode after verifying a time-limited token from the CMS.
 *
 * The preview is the published presentation of the same route - there is no
 * second layout - so an editor sees exactly what will go live. The token binds
 * path and expiry; a token for `/about` cannot open `/privacy`, and a URL
 * copied out of the admin dies after fifteen minutes.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');
  const token = url.searchParams.get('token');
  const secret = process.env.PAYLOAD_PREVIEW_SECRET;

  if (path === null || token === null || secret === undefined) {
    return new Response('Missing preview parameters.', { status: 400 });
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid preview path.', { status: 400 });
  }

  if (!verifyPreviewToken(secret, token, path)) {
    return new Response('Preview token is invalid or has expired.', { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();
  redirect(path);
}
