'use client';

import { Button } from '@cera/ui/button';
import { useState } from 'react';

import { addCartLine, notifyCartUpdated } from '../lib/cart-client.ts';

export function AddToCartButton({
  slug,
  label = 'Add to cart',
}: {
  readonly slug: string;
  readonly label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="w-full justify-center"
      onClick={() => {
        setPending(true);
        setAdded(false);
        void addCartLine(slug, 1)
          .then((cart) => {
            notifyCartUpdated(cart);
            setAdded(true);
          })
          .catch(() => setPending(false))
          .finally(() => setPending(false));
      }}
    >
      {pending ? 'Adding…' : added ? 'Added' : label}
    </Button>
  );
}
