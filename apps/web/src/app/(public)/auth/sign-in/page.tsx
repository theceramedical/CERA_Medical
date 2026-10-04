import { Heading, Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { AppButtonLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { safeReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Sign In',
    description: 'Sign in to your CERA Medical account to follow your enquiries.',
    path: '/auth/sign-in',
    noIndex: true,
  });
}

export default async function SignInPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = safeReturnTo(next ?? null);
  const session = await getSession();
  if (session !== null) {
    redirect(safeNext);
  }

  const href =
    safeNext.length > 0 && safeNext !== '/'
      ? `/auth/signin?next=${encodeURIComponent(safeNext)}`
      : '/auth/signin';

  return (
    <>
      <PageHeader
        title="Sign in"
        lede="Sign in to follow your enquiries and update your details. Passwords are never held by this application."
      />
      <div className="mx-auto grid max-w-site gap-8 px-6 py-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-16">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
          <Heading level={2} size="h3">
            Your CERA account
          </Heading>
          <Text tone="muted" className="mt-3">
            Use your verified email to view enquiries, receive secure claim links and update your
            contact details.
          </Text>
          <AppButtonLink href={href} variant="primary" className="mt-8">
            Continue to secure sign in
          </AppButtonLink>
        </section>
        <aside className="rounded-lg bg-surface-tint p-6">
          <Heading level={2} size="h4">
            New to CERA?
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-3">
            You can submit a research request without an account. We will use your email to help you
            follow its progress.
          </Text>
          <AppButtonLink href="/enquiry" variant="outline" className="mt-6">
            Make an enquiry
          </AppButtonLink>
        </aside>
      </div>
    </>
  );
}
