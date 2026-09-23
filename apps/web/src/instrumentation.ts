import type { Instrumentation } from 'next';

/**
 * Error reporting, wired once at server start.
 *
 * Next calls `register()` before any other application code runs, which is the only place an
 * exception thrown during module evaluation can still be captured - a `try`/`catch` in a layout is
 * already too late for that class of failure.
 *
 * The scrubbing that makes this safe lives in `@cera/observability/glitchtip`, not here. GlitchTip
 * does not implement Sentry's server-side data scrubbing, so `beforeSend` is the only thing between
 * an exception and an enquiry message appearing in the error tracker; duplicating any of that logic
 * in this file would create a second copy to keep correct.
 */
export async function register(): Promise<void> {
  /**
   * `register()` runs once per runtime, and the SDK is `@sentry/node`.
   *
   * Without this guard the import is attempted in the edge runtime too, where `node:` built-ins do
   * not resolve - and the resulting failure is a build error about a module the application never
   * meant to load there.
   */
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { initGlitchTip } = await import('@cera/observability/glitchtip');

  initGlitchTip({
    /**
     * Absent locally, and that disables reporting rather than failing.
     *
     * A development environment has no error tracker, and a site that refuses to start without one
     * would be worse than one that reports nothing: the exceptions would still exist, they would
     * just be invisible behind a boot failure.
     */
    ...(process.env.GLITCHTIP_DSN === undefined ? {} : { dsn: process.env.GLITCHTIP_DSN }),

    /**
     * `CERA_ENV` rather than `NODE_ENV`. `NODE_ENV` has three values and staging is not one of
     * them - a staging deploy runs as `production`, so grouping events by it would merge staging
     * noise into the production error feed, which is how a real incident gets missed.
     */
    environment: process.env.CERA_ENV ?? 'local',

    /**
     * The release is what makes a stack trace actionable: it is how an event maps to a commit and
     * to the source map uploaded for it. `'dev'` when unset, so a local event is not attributed to
     * whatever release happens to be last in the tracker.
     */
    release: process.env.RELEASE ?? 'dev',

    service: 'web',
  });
}

/**
 * Reports an error Next caught while rendering.
 *
 * Next calls this for errors that reach an `error.tsx` boundary, which would otherwise be handled
 * by the UI and never reported - the user sees a recovery page and nobody learns the page was
 * broken. The request ID comes from the header `proxy.ts` set, so the event correlates with the log
 * lines for the same request.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const [{ reportException }, { requestIdFromHeaders }] = await Promise.all([
    import('@cera/observability/glitchtip'),
    import('@cera/observability/request-id'),
  ]);

  reportException(error, requestIdFromHeaders(request.headers));
};
