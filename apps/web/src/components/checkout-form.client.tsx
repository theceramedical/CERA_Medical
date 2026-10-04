'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { completeCheckout } from '../lib/cart-client.ts';

import { AppLink } from './link.tsx';

export function CheckoutForm({ cartTotalLabel }: { readonly cartTotalLabel: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
        if (typeof emailRaw !== 'string' || typeof nameRaw !== 'string') {
          setError('Enter your name and email.');
          setPending(false);
          return;
        }
        const email = emailRaw;
        const fullName = nameRaw;
        void completeCheckout({ email, fullName, countryCode: 'PK' })
          .then((result) =>
            router.push(`/checkout/confirmation?order=${encodeURIComponent(result.orderCode)}`),
          )
          .catch(() => {
            setError('Payment could not be completed. Try again or contact us.');
            setPending(false);
          });
      }}
    >
      <Text tone="muted">Order total: {cartTotalLabel}</Text>
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
        {pending ? 'Processing…' : 'Pay and confirm order'}
      </Button>
      <Text size="body-sm" tone="muted">
        Local/dev uses test settlement. Production uses Stripe when configured.{' '}
        <AppLink href="/contact">Need help?</AppLink>
      </Text>
    </form>
  );
}
