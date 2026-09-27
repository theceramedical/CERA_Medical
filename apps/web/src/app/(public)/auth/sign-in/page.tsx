import { AppButtonLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
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
  const href = next === undefined ? '/auth/signin' : `/auth/signin?next=${encodeURIComponent(next)}`;

  return (
    <>
      <PageHeader
        title="Sign in"
        lede="Sign in to follow your enquiries and update your details. Passwords are never held by this application."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <AppButtonLink href={href} variant="primary">
          Continue to sign in
        </AppButtonLink>
      </div>
    </>
  );
}
