'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { useState } from 'react';

import { addVerifiedCartLine, notifyCartUpdated } from '../lib/cart-client.ts';

export function AddToCartButton({
  slug,
  label = 'Add to cart',
}: {
  readonly slug: string;
  readonly label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        className="w-full justify-center"
        onClick={() => {
          setPending(true);
          setAdded(false);
          setError(null);
          void addVerifiedCartLine(slug, 1)
            .then((cart) => {
              notifyCartUpdated(cart);
              setAdded(true);
            })
            .catch((reason: unknown) => {
              setError(
                reason instanceof Error && reason.message === 'cart_currency_mismatch'
                  ? 'This cart has a currency mismatch. Please contact us before ordering.'
                  : 'Cart could not be saved. Please try again.',
              );
            })
            .finally(() => setPending(false));
        }}
      >
        {pending ? 'Adding…' : added ? 'Added' : label}
      </Button>
      {error !== null ? (
        <Text size="caption" className="mt-1 text-danger-600" role="alert">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
