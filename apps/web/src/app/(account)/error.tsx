'use client';

import { Button } from '@cera/ui/button';
import { Icon } from '@cera/ui/icon';
import { TriangleAlert } from 'lucide-react';

import { AppButtonLink } from '../../components/link.tsx';
import { RouteState } from '../../components/route-states.tsx';

/**
 * The portal error boundary.
 *
 * Separate copy from the public one, and the difference is the way forward: a signed-in customer
 * looking at their own enquiries wants to get back to their dashboard, not to the marketing homepage.
 * An error page that sends someone to the front door has made their problem worse.
 *
 * As in the public boundary, nothing from `error` reaches the screen. This subtree renders a customer's
 * own enquiry data, so an echoed error message is the most likely place for it to leak.
 */
export default function AccountError({ reset }: { readonly reset: () => void }) {
  return (
    <RouteState
      icon={<Icon icon={TriangleAlert} size="lg" />}
      title="Something went wrong"
      description="We could not load this part of your account. Your enquiries and their history are unaffected."
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
          <AppButtonLink href="/account" variant="outline">
            Back to your dashboard
          </AppButtonLink>
        </>
      }
    />
  );
}
