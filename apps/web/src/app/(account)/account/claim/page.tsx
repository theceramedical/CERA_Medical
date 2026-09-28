import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Claim an enquiry' };
async function requestClaim() {
  'use server';
  await authenticatedApi('/v1/enquiries/claim/request', { method: 'POST' });
  redirect('/account/claim?sent=1');
}
async function consumeClaim(form: FormData) {
  'use server';
  await authenticatedApi('/v1/enquiries/claim/consume', {
    method: 'POST',
    body: { token: form.get('token') },
  });
  redirect('/account/enquiries');
}
export default async function AccountClaimPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token, sent } = await searchParams;
  return (
    <>
      <PageHeader title="Claim an enquiry" lede="Link an enquiry to your verified email." />
      <div className="mx-auto max-w-site px-6 py-12">
        <Text>
          {sent
            ? 'Claim links have been sent for any matching unclaimed enquiries. Check your email.'
            : 'The single-use email link only works for the signed-in account with the same verified email.'}
        </Text>
        {token ? (
          <form action={consumeClaim}>
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Claim this enquiry</Button>
          </form>
        ) : (
          <form action={requestClaim}>
            <Button type="submit">Request claim emails</Button>
          </form>
        )}
      </div>
    </>
  );
}
