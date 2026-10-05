import { AppButtonLink } from './link.tsx';

/** Desktop header auth actions — rendered once (mobile uses {@link MobileNav}). */
export function SiteHeaderAuthActions({ signedIn }: { readonly signedIn: boolean }) {
  if (signedIn) {
    return (
      <AppButtonLink href="/account" variant="outline" size="sm">
        Your account
      </AppButtonLink>
    );
  }

  return (
    <AppButtonLink href="/auth/sign-in" variant="outline" size="sm">
      Sign In
    </AppButtonLink>
  );
}
