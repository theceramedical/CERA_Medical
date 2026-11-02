import { Heading, Text } from '@cera/ui/typography';

import { AuthPageShell, AuthPanelIntro } from '../../../../components/auth-page-shell.tsx';
import { AppButtonLink, AppLink } from '../../../../components/link.tsx';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Signed out',
    description: 'You have been securely signed out of the CERA Medical staff workspace.',
    path: '/auth/signed-out',
    noIndex: true,
  });
}

export default function SignedOutPage() {
  return (
    <AuthPageShell
      title="You are signed out"
      lede="Your CERA Medical staff session has ended on this device."
      aside={
        <>
          <Heading level={2} size="h4">
            Need to return?
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-3">
            Staff access is controlled by the Cloudflare Access policy for the CERA workspace.
          </Text>
          <AppLink href="/" className="mt-6 inline-block font-medium">
            Return to CERA Medical
          </AppLink>
        </>
      }
    >
      <AuthPanelIntro
        heading="Session closed securely"
        body="If you shared this device, close the browser window. You can start a new session whenever you are ready."
      />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <AppButtonLink href="/staff" variant="primary">
          Return to staff console
        </AppButtonLink>
        <AppButtonLink href="/" variant="outline">
          Back to website
        </AppButtonLink>
      </div>
    </AuthPageShell>
  );
}
