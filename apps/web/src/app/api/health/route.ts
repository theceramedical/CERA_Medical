/**
 * Liveness for the container health check.
 *
 * The public homepage waits on the CMS and catalogue. Those can still be
 * starting when Compose asks whether this process is up, and a slow page
 * must not be what decides that.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return Response.json({ ok: true });
}
