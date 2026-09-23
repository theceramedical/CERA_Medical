import { Icon } from '@cera/ui/icon';
import { FileQuestion } from 'lucide-react';

import { AppButtonLink } from '../../components/link.tsx';
import { RouteState } from '../../components/route-states.tsx';

import type { Metadata } from 'next';

/**
 * The portal 404.
 *
 * Reached by `notFound()` as well as by a bad URL, and in the portal that is the more important case:
 * Phase 11 calls it when a customer requests an enquiry that is not theirs. **The wording has to be
 * the same either way.** "You do not have access to that enquiry" confirms the record exists, which
 * turns a reference number into an oracle someone can enumerate against. "We could not find it" is
 * true from the perspective of a caller scoped to their own records, and says nothing.
 */

export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: false },
};

export default function AccountNotFound() {
  return (
    <RouteState
      icon={<Icon icon={FileQuestion} size="lg" />}
      title="We could not find that"
      description="The page or enquiry you asked for is not available on your account."
      action={
        <AppButtonLink href="/account" variant="primary">
          Back to your dashboard
        </AppButtonLink>
      }
    />
  );
}
