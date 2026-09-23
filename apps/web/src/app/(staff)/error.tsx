'use client';

import { Button } from '@cera/ui/button';
import { Icon } from '@cera/ui/icon';
import { TriangleAlert } from 'lucide-react';

import { AppButtonLink } from '../../components/link.tsx';
import { RouteState } from '../../components/route-states.tsx';

/**
 * The staff console error boundary.
 *
 * The explicit reassurance about the queue is the point of having separate copy here. A staff member
 * who sees an error while working a queue needs to know whether the transition they just submitted went
 * through - and "something went wrong" without that leaves them guessing, which in a work queue means
 * either a duplicate action or a dropped one.
 */
export default function StaffError({ reset }: { readonly reset: () => void }) {
  return (
    <RouteState
      icon={<Icon icon={TriangleAlert} size="lg" />}
      title="Something went wrong"
      description="This view could not be loaded. No enquiry has been changed by this error - the queue is exactly as you left it."
      action={
        <>
          <Button
            variant="primary"
            onClick={() => {
              reset();
            }}
          >
            Try again
          </Button>
          <AppButtonLink href="/staff" variant="outline">
            Back to the queue
          </AppButtonLink>
        </>
      }
    />
  );
}
