import { Text } from '@cera/ui/typography';

import { AppButtonLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Claim an enquiry' };

export default function AccountClaimPage() {
  return (
    <>
      <PageHeader
        title="Claim an enquiry"
        lede="If you submitted an enquiry before creating an account, we can link it to this email."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Text>
          We email a single-use link to the verified address on this account. Possession of the link
          is not enough: it only works for the signed-in person whose verified email matches.
        </Text>
        <AppButtonLink href="/account" variant="primary" className="mt-6">
          Request claim emails
        </AppButtonLink>
      </div>
    </>
  );
}
