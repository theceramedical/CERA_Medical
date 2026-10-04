import { Heading, Text } from '@cera/ui/typography';
import { notFound } from 'next/navigation';

import { AppLink } from '../../../../components/link.tsx';
import { checkoutEnabled } from '../../../../lib/checkout-enabled.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = pageMetadata({
  title: 'Order confirmed',
  description: 'Your CERA Medical order is confirmed.',
  path: '/checkout/confirmation',
  noIndex: true,
});

export default async function CheckoutConfirmationPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ order?: string }>;
}) {
  if (!checkoutEnabled()) notFound();
  const { order } = await searchParams;
  if (order === undefined || order.length === 0) notFound();

  return (
    <div className="mx-auto max-w-site px-6 py-16 md:px-10">
      <Heading level={1} size="h2">
        Thank you
      </Heading>
      <Text className="mt-4">
        Your order <strong>{order}</strong> is confirmed. We will email you next steps for project
        scoping.
      </Text>
      <Text className="mt-6">
        <AppLink href="/account/orders">View your orders</AppLink>
        {' · '}
        <AppLink href="/account">Account home</AppLink>
        {' · '}
        <AppLink href="/services">Browse more services</AppLink>
      </Text>
    </div>
  );
}
