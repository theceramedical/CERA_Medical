import { AppButtonLink } from './link.tsx';

/** Desktop header auth actions — rendered once (mobile uses {@link MobileNav}). */
export function SiteHeaderAuthActions({
  signedIn,
  staff,
}: {
  readonly signedIn: boolean;
  readonly staff?: boolean;
}) {
  if (signedIn) {
    return (
      <div className="flex items-center gap-2">
        {staff ? (
          <AppButtonLink href="/staff" variant="primary" size="sm">
            Staff
          </AppButtonLink>
        ) : null}
        <AppButtonLink href="/account" variant="outline" size="sm">
          Your account
        </AppButtonLink>
      </div>
    );
  }

  return (
    <AppButtonLink href="/auth/sign-in" variant="outline" size="sm">
      Sign In
    </AppButtonLink>
  );
}
