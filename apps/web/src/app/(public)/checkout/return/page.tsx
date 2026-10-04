'use client';

import { Text } from '@cera/ui/typography';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppLink } from '../../../../components/link.tsx';
import { CHECKOUT_CONTACT_STORAGE_KEY, completeCheckout } from '../../../../lib/cart-client.ts';

function CheckoutReturnError({ message }: { readonly message: string }) {
  return (
    <div className="mx-auto max-w-site px-6 py-16 md:px-10">
      <Text className="text-danger-600">{message}</Text>
      <Text className="mt-4">
        <AppLink href="/checkout">Back to checkout</AppLink>
      </Text>
    </div>
  );
}

function SafepayOrderFinalize({ tracker }: { readonly tracker: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let contact: { email?: string; fullName?: string } = {};
    try {
      const raw = sessionStorage.getItem(CHECKOUT_CONTACT_STORAGE_KEY);
      if (raw !== null) contact = JSON.parse(raw) as { email?: string; fullName?: string };
    } catch {
      /* ignore */
    }

    if (contact.email === undefined || contact.fullName === undefined) {
      router.replace('/checkout');
      return;
    }

    void completeCheckout({
      email: contact.email,
      fullName: contact.fullName,
      countryCode: 'PK',
      paymentMethod: 'safepay',
      safepayTracker: tracker,
    })
      .then((result) => {
        try {
          sessionStorage.removeItem(CHECKOUT_CONTACT_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        router.replace(`/checkout/confirmation?order=${encodeURIComponent(result.orderCode)}`);
      })
      .catch(() => {
        setError('We could not confirm your payment yet. Contact us with your order reference.');
      });
  }, [router, tracker]);

  if (error !== null) {
    return <CheckoutReturnError message={error} />;
  }

  return (
    <div className="mx-auto max-w-site px-6 py-16 md:px-10">
      <Text>Confirming your payment…</Text>
    </div>
  );
}

export default function CheckoutReturnPage() {
  const searchParams = useSearchParams();
  const tracker = searchParams.get('tracker');
  if (tracker === null || tracker.length === 0) {
    return (
      <CheckoutReturnError message="Missing payment reference. Return to checkout and try again." />
    );
  }
  return <SafepayOrderFinalize tracker={tracker} />;
}
