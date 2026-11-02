import { Heading, Text } from '@cera/ui/typography';

import { AppLink } from '../../../../components/link.tsx';

export default function CheckoutReturnPage() {
  return (
    <div className="mx-auto max-w-site px-6 py-16 md:px-10">
      <Heading level={1} size="h2">
        Online payment unavailable
      </Heading>
      <Text className="mt-4">
        CERA Medical currently accepts cash on delivery only. No online payment was taken.
      </Text>
      <Text className="mt-6">
        <AppLink href="/checkout">Return to checkout</AppLink>
      </Text>
    </div>
  );
}
