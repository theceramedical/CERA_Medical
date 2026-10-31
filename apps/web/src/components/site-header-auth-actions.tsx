import { AppButtonLink } from './link.tsx';

/**
 * Desktop header auth actions.
 * Per October 2026 revision: unauthenticated public visitors see only "Make an Enquiry".
 * Authenticated visitors see their account / staff portal links.
 */
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

  return null;
}
