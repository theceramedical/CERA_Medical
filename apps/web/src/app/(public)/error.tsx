'use client';

import { Button } from '@cera/ui/button';
import { Icon } from '@cera/ui/icon';
import { TriangleAlert } from 'lucide-react';

import { AppButtonLink } from '../../components/link.tsx';
import { RouteState } from '../../components/route-states.tsx';

/**
 * The public error boundary.
 *
 * `'use client'` is required, not chosen: an error boundary has to run in the browser to catch a
 * client-side render failure and to offer a retry.
 *
 * **Nothing from `error` is displayed.** Not the message, not the digest, not the stack. A server-side
 * error message on a medical platform can carry a database constraint quoting a row, or a provider
 * response echoing a request - and PRD 8 forbids putting either in front of a user. Next already
 * redacts the message in production builds, so this is the second layer rather than the only one. What
 * connects a user's report to the logs is the request ID in the response header, which support can
 * ask for; `instrumentation.ts` reports the exception with that same ID attached.
 */
export default function PublicError({ reset }: { readonly reset: () => void }) {
  return (
    <RouteState
      icon={<Icon icon={TriangleAlert} size="lg" />}
      title="Something went wrong"
      description="This page could not be loaded. Trying again often works; if it does not, the links below will still get you where you were going."
      action={
        <>
          {/*
           * A real `<button>`, because retrying is an action rather than a destination - and it is
           * the one control on this page that is not a link. `reset` re-renders the boundary's
           * subtree without a full page load, which keeps the user's scroll position and any
           * client state outside the failed subtree.
           */}
          <Button
            variant="primary"
            onClick={() => {
              reset();
            }}
          >
            Try again
          </Button>
          <AppButtonLink href="/" variant="outline">
            Go to the homepage
          </AppButtonLink>
        </>
      }
    />
  );
}
