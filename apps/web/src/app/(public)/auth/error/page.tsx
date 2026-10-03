import { ComingSoon } from '../../../../components/coming-soon.tsx';
import { authErrorCopy } from '../../../../lib/auth/error-copy.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Sign-in error',
    description: 'The sign-in attempt could not be completed.',
    path: '/auth/error',
    noIndex: true,
  });
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const { title, lede, plan } = authErrorCopy((await searchParams).reason);
  return <ComingSoon title={title} lede={lede} plan={plan} />;
}
