/**
 * Payload may return `/api/media/file/...` on the CMS admin host. The public site
 * serves bytes from `S3_PUBLIC_URL` and `next/image` only allows that origin.
 */
export function publicizeCmsMediaUrl(url: string | null): string | null {
  if (url === null || url.length === 0) return null;

  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, '');
  if (publicBase === undefined || publicBase.length === 0) return url;

  try {
    const parsed = new URL(url);
    const match = /^\/api\/media\/file\/(.+)$/.exec(parsed.pathname);
    if (match?.[1] === undefined) return url;
    const filename = decodeURIComponent(match[1]);
    return `${publicBase}/${filename}`;
  } catch {
    return url;
  }
}
