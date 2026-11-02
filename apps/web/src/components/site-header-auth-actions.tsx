import { AppButtonLink } from './link.tsx';

/**
 * Desktop header auth actions.
 * Per October 2026 revision: unauthenticated public visitors see only "Make an Enquiry".
 * Staff sessions get a staff portal link. Customers do not have accounts.
 */
export function SiteHeaderAuthActions({
  signedIn,
  staff,
}: {
  readonly signedIn: boolean;
  readonly staff?: boolean;
}) {
  if (signedIn && staff) {
    return (
      <div className="flex items-center gap-2">
        <AppButtonLink href="/staff" variant="primary" size="sm">
          Staff
        </AppButtonLink>
      </div>
    );
  }

  return null;
}
