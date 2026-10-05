'use client';

import { Button } from '@cera/ui/button';

/**
 * Starts OIDC with a full document navigation on the **current** origin.
 *
 * A GET form with `action="/auth/signin"` can be resolved to `NEXT_PUBLIC_SITE_URL` (often `www`)
 * while the visitor is still on the apex host, which `form-action 'self'` then blocks. Assigning a
 * path on `window.location.origin` matches the address bar and avoids RSC fetches to `/auth/signin`
 * (302 to Authentik → CORS on preflight).
 */
export function OidcSignInContinue({
  next,
  className,
}: {
  readonly next: string;
  readonly className?: string;
}) {
  function continueSignIn(): void {
    const target = new URL('/auth/signin', window.location.origin);
    if (next.length > 0 && next !== '/') target.searchParams.set('next', next);
    window.location.assign(target);
  }

  return (
    <Button
      type="button"
      variant="primary"
      className={className}
      data-testid="oidc-sign-in-continue"
      onClick={continueSignIn}
    >
      Continue to secure sign in
    </Button>
  );
}
