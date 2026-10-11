import { Heading, Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { AuthSignInOptions } from '../../../../components/auth-sign-in-options.tsx';
import { AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { safeReturnTo, isStaffReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Staff sign in',
    description: 'Sign in to the CERA Medical staff console.',
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
  const requestedNext = safeReturnTo(next ?? null, '/staff');
  const safeNext = isStaffReturnTo(requestedNext) ? requestedNext : '/staff';
  const session = await getSession();
  if (session !== null) redirect(safeNext);

  return (
    <>
      <PageHeader
        title="CERA staff console"
        lede="A private workspace for the CERA team to review enquiries and manage delivery operations."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
          <section className="rounded-xl border border-border bg-surface p-6 shadow-card sm:p-9">
            <div className="mb-8 border-b border-border pb-6">
              <Text size="eyebrow" tone="muted">
                INTERNAL ACCESS
              </Text>
              <Heading level={2} size="h3" className="mt-2">
                Sign in to the staff workspace
              </Heading>
              <Text tone="muted" className="mt-3" measure>
                Use the work account provisioned by a CERA administrator. Multi-factor
                authentication is required for every staff session.
              </Text>
            </div>
            <AuthSignInOptions
              next={safeNext}
              socialProviders={[]}
              mode="sign-in"
              audience="staff"
            />
          </section>

          <aside className="rounded-xl bg-primary-900 p-6 text-white sm:p-8">
            <Text size="eyebrow" className="text-white/70">
              STAFF ONLY
            </Text>
            <Heading level={2} size="h4" className="mt-3 text-white">
              Need a customer account?
            </Heading>
            <Text className="mt-3 text-white/80" measure>
              Customer enquiries and orders use a separate public account experience. A customer
              account cannot open staff records.
            </Text>
            <div className="mt-7 flex flex-col gap-4">
              <AppLink
                href="/auth/sign-in?next=/account"
                className="font-medium text-white underline underline-offset-4"
              >
                Go to customer sign in
              </AppLink>
              <AppLink href="/" className="text-sm text-white/75 underline underline-offset-4">
                Return to the public website
              </AppLink>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
