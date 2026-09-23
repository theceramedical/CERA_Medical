import { Icon } from '@cera/ui/icon';
import { FileQuestion } from 'lucide-react';

import { AppButtonLink } from '../../components/link.tsx';
import { RouteState } from '../../components/route-states.tsx';

import type { Metadata } from 'next';

/**
 * The staff console's not-found state.
 *
 * **This one does mention access, where the portal's deliberately does not,** and the difference is
 * intentional. The portal's wording is identical whether a record is missing or belongs to someone
 * else, because distinguishing the two would turn a reference number into an oracle a stranger could
 * enumerate against. A staff member is already authenticated and already inside the system, so the
 * same sentence buys an attacker nothing - and withholding it costs something real: a staff member who
 * cannot tell "this record does not exist" from "this record is above my role" does not know whether
 * to escalate or to stop looking.
 */

export const metadata: Metadata = {
  title: 'Not found',
  robots: { index: false, follow: false },
};

export default function StaffNotFound() {
  return (
    <RouteState
      icon={<Icon icon={FileQuestion} size="lg" />}
      title="We could not find that"
      description="The enquiry or view you asked for does not exist, or it is outside the records your role can reach."
      action={
        <AppButtonLink href="/staff" variant="primary">
          Back to the queue
        </AppButtonLink>
      }
    />
  );
}
