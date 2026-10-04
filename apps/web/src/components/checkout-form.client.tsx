'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  CHECKOUT_CONTACT_STORAGE_KEY,
  completeCheckout,
  startSafepayCheckout,
  type CheckoutPaymentMethod,
} from '../lib/cart-client.ts';

import { AppLink } from './link.tsx';

export function CheckoutForm({
  cartTotalLabel,
  showTestPayment,
}: {
  readonly cartTotalLabel: string;
  readonly showTestPayment: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>('safepay');

  return (
    <form
      className="mx-auto max-w-md space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const form = event.currentTarget;
        const data = new FormData(form);
        const emailRaw = data.get('email');
        const nameRaw = data.get('fullName');
        const methodRaw = data.get('paymentMethod');
        if (typeof emailRaw !== 'string' || typeof nameRaw !== 'string') {
          setError('Enter your name and email.');
          setPending(false);
          return;
        }
        const email = emailRaw;
        const fullName = nameRaw;
        const method =
          methodRaw === 'cod' || methodRaw === 'safepay' || methodRaw === 'test'
            ? methodRaw
            : paymentMethod;

        if (method === 'safepay') {
          const origin = window.location.origin;
          const contact = { email, fullName };
          try {
            sessionStorage.setItem(CHECKOUT_CONTACT_STORAGE_KEY, JSON.stringify(contact));
          } catch {
            /* ignore quota errors */
          }
          void startSafepayCheckout({
            email,
            fullName,
            redirectUrl: `${origin}/checkout/return`,
            cancelUrl: `${origin}/checkout`,
          })
            .then(({ checkoutUrl }) => {
              window.location.assign(checkoutUrl);
            })
            .catch(() => {
              setError('Could not start Safepay checkout. Try COD or contact us.');
              setPending(false);
            });
          return;
        }

        void completeCheckout({ email, fullName, countryCode: 'PK', paymentMethod: method })
          .then((result) =>
            router.push(`/checkout/confirmation?order=${encodeURIComponent(result.orderCode)}`),
          )
          .catch(() => {
            setError('Order could not be completed. Try again or contact us.');
            setPending(false);
          });
      }}
    >
      <Text tone="muted">Order total: {cartTotalLabel}</Text>
      <fieldset className="space-y-2">
        <Text size="body-sm" className="font-medium">
          Payment method
        </Text>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="paymentMethod"
            value="safepay"
            checked={paymentMethod === 'safepay'}
            onChange={() => setPaymentMethod('safepay')}
          />
          <Text size="body-sm">Pay online (Safepay)</Text>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="paymentMethod"
            value="cod"
            checked={paymentMethod === 'cod'}
            onChange={() => setPaymentMethod('cod')}
          />
          <Text size="body-sm">Cash on delivery</Text>
        </label>
        {showTestPayment ? (
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              value="test"
              checked={paymentMethod === 'test'}
              onChange={() => setPaymentMethod('test')}
            />
            <Text size="body-sm">Test payment (development)</Text>
          </label>
        ) : null}
      </fieldset>
      <label className="block">
        <Text size="body-sm" className="mb-1 font-medium">
          Full name
        </Text>
        <input
          name="fullName"
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </label>
      <label className="block">
        <Text size="body-sm" className="mb-1 font-medium">
          Email
        </Text>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </label>
      {error ? (
        <Text size="body-sm" className="text-danger-600">
          {error}
        </Text>
      ) : null}
      <Button type="submit" variant="primary" disabled={pending} className="w-full justify-center">
        {pending
          ? 'Processing…'
          : paymentMethod === 'safepay'
            ? 'Continue to Safepay'
            : 'Confirm order'}
      </Button>
      <Text size="body-sm" tone="muted">
        Online payments are processed on Safepay&apos;s secure hosted page. COD orders are confirmed
        without prepayment. <AppLink href="/contact">Need help?</AppLink>
      </Text>
    </form>
  );
}
