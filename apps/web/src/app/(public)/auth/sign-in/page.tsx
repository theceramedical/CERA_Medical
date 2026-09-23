import { ComingSoon } from '../../../../components/coming-soon.tsx';

import type { Metadata } from 'next';

/**
 * The sign-in route.
 *
 * It exists in this phase because `proxy.ts` redirects here, and a redirect to a 404 is worse than no
 * redirect: the user is told nothing, and the redirect logic looks broken when it is working exactly
 * as written. The redirect and its `?next=` parameter are already tested against this path.
 */

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your CERA Medical account to follow your enquiries.',
  // A sign-in page has nothing to index and appearing in results for "CERA Medical login" is not
  // worth the thin page. `follow: true` so the links out of it still carry.
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <ComingSoon
      title="Sign In"
      lede="Sign in to follow your enquiries and update your details."
      plan="Phase 09 connects this to Authentik over OIDC, with PKCE and multi-factor authentication for staff and administrators. Passwords are never held by this application - see ADR-004."
    />
  );
}
