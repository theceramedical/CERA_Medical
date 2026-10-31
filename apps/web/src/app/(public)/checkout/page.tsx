import { CheckoutPageContent } from '../../../components/checkout-page-content.client.tsx';
import { AppButtonLink } from '../../../components/link.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { assertCustomerPortalSession } from '../../../lib/auth/portal-access.ts';
import { getSession } from '../../../lib/auth/session.ts';
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
  if (!checkoutEnabled()) {
    return (
      <>
        <MarketingPageHeader
          title="Online checkout is temporarily unavailable"
          lede="Contact our team to discuss a product or service order."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Cart', href: '/cart' },
            { label: 'Checkout' },
          ]}
        />
        <div className="mx-auto flex max-w-site flex-wrap gap-3 px-6 py-12 md:px-10 lg:py-16">
          <AppButtonLink href="/contact#contact-form" variant="primary">
            Contact our team
          </AppButtonLink>
          <AppButtonLink href="/products" variant="outline">
            Browse products
          </AppButtonLink>
        </div>
      </>
    );
  }
  const session = assertCustomerPortalSession(await getSession(), {
    returnTo: '/checkout',
    emailVerified: true,
  });

  return (
    <>
      <MarketingPageHeader
        title="Checkout"
        lede="Complete payment for the signed-in account below. Orders appear under Your account → Orders."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Cart', href: '/cart' },
          { label: 'Checkout' },
        ]}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <CheckoutPageContent customerEmail={session.email} />
      </div>
    </>
  );
}
