import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { CheckoutForm } from '../../../components/checkout-form.client.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { fetchCart } from '../../../lib/cart-client.ts';
import { checkoutEnabled } from '../../../lib/checkout-enabled.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = pageMetadata({
  title: 'Checkout',
  description: 'Complete your CERA Medical service purchase.',
  path: '/checkout',
  noIndex: true,
});

export default async function CheckoutPage() {
  if (!checkoutEnabled()) notFound();

  const cart = await fetchCart((await headers()).get('cookie')).catch(() => null);
  if (cart === null || cart.lines.length === 0) notFound();

  return (
    <>
      <MarketingPageHeader
        title="Checkout"
        lede="Enter your details to pay and confirm your order. You will receive a confirmation reference."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <CheckoutForm
          cartTotalLabel={`${(cart.totalMinor / 100).toFixed(2)} ${cart.currencyCode}`}
          showTestPayment={process.env.NODE_ENV !== 'production'}
        />
      </div>
    </>
  );
}
