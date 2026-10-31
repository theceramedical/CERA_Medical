import { Alert } from '@cera/ui/alert';
import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Claim an enquiry' };
async function requestClaim() {
  'use server';
  let issued: number;
  try {
    ({ issued } = await authenticatedApi<{ issued: number }>('/v1/enquiries/claim/request', {
      method: 'POST',
      returnTo: '/account/claim',
    }));
  } catch {
    redirect('/account/claim?error=delivery');
  }
  redirect(issued > 0 ? '/account/claim?sent=1' : '/account/claim?none=1');
}
async function consumeClaim(form: FormData) {
  'use server';
  await authenticatedApi('/v1/enquiries/claim/consume', {
    method: 'POST',
    body: { token: form.get('token') },
    returnTo: '/account/claim',
  });
  redirect('/account/enquiries');
}
export default async function AccountClaimPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token, sent, none, error } = await searchParams;
  return (
    <>
      <PageHeader title="Claim an enquiry" lede="Link an enquiry to your verified email." />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="max-w-measure rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
          {error === 'delivery' ? (
            <Alert tone="warning" title="Claim email could not be sent">
              Email delivery is unavailable. Your enquiry is unchanged; try again later or contact
              CERA support.
            </Alert>
          ) : none ? (
            <Alert tone="info" title="No enquiries to claim">
              We did not find any unclaimed enquiries for your verified email address. Submit a new
              request from Make an Enquiry, or use the same email on the form as on this account.
            </Alert>
          ) : sent ? (
            <Alert tone="success" title="Claim links sent">
              We sent a link for each matching unclaimed enquiry to your verified email address.
              Check your inbox and spam folder.
            </Alert>
          ) : (
            <Text tone="muted">
              The secure, single-use email link works only for the signed-in account with the same
              verified email address.
            </Text>
          )}
          {token ? (
            <form action={consumeClaim} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <Button type="submit">Claim this enquiry</Button>
            </form>
          ) : (
            <form action={requestClaim} className="mt-6">
              <Button type="submit">Request claim emails</Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
