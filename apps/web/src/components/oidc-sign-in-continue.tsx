import { Button } from '@cera/ui/button';

/**
 * Starts OIDC with a full document navigation.
 *
 * `next/link` (even with `prefetch={false}`) still issues an RSC fetch on click. `/auth/signin`
 * responds with a 302 to Authentik, and a cross-origin redirect on that preflight fails CORS in the
 * browser. A plain GET form performs a normal top-level navigation instead.
 */
export function OidcSignInContinue({
  next,
  className,
}: {
  readonly next: string;
  readonly className?: string;
}) {
  return (
    <form method="GET" action="/auth/signin" className={className}>
      {next.length > 0 && next !== '/' ? <input type="hidden" name="next" value={next} /> : null}
      <Button type="submit" variant="primary">
        Continue to secure sign in
      </Button>
    </form>
  );
}
