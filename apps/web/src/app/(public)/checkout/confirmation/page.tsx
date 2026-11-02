import { notFound } from 'next/navigation';

import { CheckoutConfirmation } from '../../../../components/checkout-confirmation.client.tsx';
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
      <CheckoutConfirmation orderCode={order} />
    </div>
  );
}
