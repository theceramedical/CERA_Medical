import { redirect } from 'next/navigation';

import { AuthPageShell, AuthPanelIntro } from '../../../../components/auth-page-shell.tsx';
import { VerifyEmailGuidance } from '../../../../components/verify-email-guidance.tsx';
import { customerReturnTo, safeReturnTo } from '../../../../lib/auth/return-to.ts';
import { getSession } from '../../../../lib/auth/session.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Verify your email',
    description: 'Confirm your email address to use enquiries and orders on CERA Medical.',
    path: '/auth/verify-email',
    noIndex: true,
  });
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const returnTo = customerReturnTo(safeReturnTo(next ?? null));
  const session = await getSession();
  if (session === null) {
    redirect(`/auth/sign-in?next=${encodeURIComponent('/auth/verify-email')}`);
  }
  if (session.emailVerified) {
    redirect(returnTo);
  }

  return (
    <AuthPageShell
      title="Verify your email"
      lede="Enquiries, orders, and claim links need a verified address in your sign-in service."
      aside={
        <AuthPanelIntro
          heading="Already verified?"
          body="After you confirm the address with Google, Microsoft, or your email provider, use Sign in again on this page so CERA refreshes your account."
        />
      }
    >
      <VerifyEmailGuidance email={session.email} returnTo={returnTo} />
    </AuthPageShell>
  );
}
