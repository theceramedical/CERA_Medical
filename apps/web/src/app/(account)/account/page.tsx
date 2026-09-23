import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../components/page-header.tsx';

import type { Metadata } from 'next';

/**
 * The portal dashboard. Phase 11 builds it.
 *
 * It exists now so the route group has a route, which is what makes the proxy's presence check
 * testable end to end: without a page here, a request to `/account` would 404 before the redirect
 * could be observed, and "no session" would be indistinguishable from "no route".
 */

export const metadata: Metadata = {
  title: 'Your account',
};

export default function AccountDashboardPage() {
  return (
    <>
      <PageHeader title="Your account" lede="Your enquiries and their progress, in one place." />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Alert tone="info" title="This page is not finished yet">
          <Text size="body-sm">
            Phase 11 builds the dashboard, the enquiry timeline, and the profile form. Phase 09
            connects sign-in first - until then this page is reachable only by setting a session
            cookie by hand.
          </Text>
        </Alert>
      </div>
    </>
  );
}
