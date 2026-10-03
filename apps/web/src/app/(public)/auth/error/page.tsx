import { Alert } from '@cera/ui/alert';
import { Heading, Text } from '@cera/ui/typography';

import { AppButtonLink, AppLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
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
  return (
    <>
      <PageHeader title={title} lede={lede} />
      <div className="mx-auto grid max-w-site gap-8 px-6 py-12 md:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:py-16">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
          <Alert tone="info" title="Your account and enquiry details are safe">
            <Text size="body-sm">{plan}</Text>
          </Alert>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AppButtonLink href="/auth/sign-in" variant="primary">
              Try signing in again
            </AppButtonLink>
            <AppButtonLink href="/enquiry" variant="outline">
              Make an enquiry
            </AppButtonLink>
          </div>
        </section>
        <aside className="rounded-lg bg-surface-tint p-6">
          <Heading level={2} size="h4">
            Need help?
          </Heading>
          <Text size="body-sm" tone="muted" className="mt-3">
            If the problem continues, contact CERA Medical and mention that you had difficulty
            signing in.
          </Text>
          <AppLink href="mailto:contact@ceramedical.org" className="mt-4 inline-flex">
            contact@ceramedical.org
          </AppLink>
        </aside>
      </div>
    </>
  );
}
