import type { NextRequest } from 'next/server';

/**
 * The first value in a comma-separated forwarded header.
 *
 * Cloudflare may append client addresses; the left-most entry is the value this hop intended for
 * the application.
 */
function firstHeaderValue(value: string | null): string | undefined {
  if (value === null || value.length === 0) return undefined;
  const first = value.split(',')[0]?.trim();
  return first !== undefined && first.length > 0 ? first : undefined;
}

/**
 * Origin as the visitor's browser sees it when the request passed through the edge proxy.
 *
 * The platform URL may reflect an internal request while forwarded headers carry the public
 * scheme and host. Comparing the internal URL to `NEXT_PUBLIC_SITE_URL` can cause redirect loops.
 */
export function resolvePublicOrigin(request: NextRequest): string {
  const proto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const host =
    firstHeaderValue(request.headers.get('x-forwarded-host')) ?? request.headers.get('host') ?? '';

  if (proto !== undefined && host.length > 0) {
    try {
      return new URL(`${proto}://${host}`).origin;
    } catch {
      // Malformed forwarded values are ignored; fall back to Next's parsed URL.
    }
  }

  return request.nextUrl.origin;
}

/**
 * Local health checks and internal probes hit loopback without forwarded headers.
 *
 * Canonical host enforcement belongs at the edge; redirecting local probes would send `fetch('/')`
 * to an external URL and fail the health check.
 */
export function isInternalProbe(request: NextRequest): boolean {
  if (firstHeaderValue(request.headers.get('x-forwarded-host')) !== undefined) return false;

  const host = request.headers.get('host') ?? '';
  return (
    /^127\.0\.0\.1(?::\d+)?$/.test(host) ||
    /^localhost(?::\d+)?$/i.test(host) ||
    /^0\.0\.0\.0(?::\d+)?$/.test(host)
  );
}
