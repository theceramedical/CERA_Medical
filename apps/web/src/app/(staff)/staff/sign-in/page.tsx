import { Alert } from '@cera/ui/alert';
import { Heading, Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { PageHeader } from '../../../../components/page-header.tsx';
import { sessionHasStaffRole } from '../../../../lib/auth/portal-access.ts';
import { safeReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Staff access',
    description: 'Cloudflare Access staff workspace.',
    path: '/staff/sign-in',
    noIndex: true,
  });
}

export default async function StaffSignInPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeReturnTo(next ?? null, '/staff');
  const session = await getSession();
  if (session !== null) {
    if (sessionHasStaffRole(session)) redirect(safeNext);
    redirect('/auth/error?reason=access');
  }

  return (
    <>
      <PageHeader
        title="CERA staff access"
        lede="The staff workspace is protected by Cloudflare Access."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Alert tone="info" title="Staff access is not configured for this request">
          <Text size="body-sm">
            Sign in with the work email approved by a CERA administrator. If Cloudflare Access did
            not prompt you to verify your email, contact the administrator to check the staff access
            policy and application configuration.
          </Text>
        </Alert>
        <section className="mt-8 rounded-xl border border-border bg-surface p-6 shadow-card sm:p-9">
          <Heading level={2} size="h3">
            Staff only
          </Heading>
          <Text tone="muted" className="mt-3" measure>
            Customer enquiries and orders are handled by the CERA team. Customers can submit an
            enquiry or place an eligible guest order without creating an account.
          </Text>
        </section>
      </div>
    </>
  );
}
