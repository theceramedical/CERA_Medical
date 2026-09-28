import { Field } from '@cera/ui/field';
import { Input } from '@cera/ui/input';
import { Text } from '@cera/ui/typography';

import { PageHeader } from '../../../../components/page-header.tsx';
import { getSession } from '../../../../lib/auth/session.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your profile' };

export default async function AccountProfilePage() {
  const session = await getSession();
  return (
    <>
      <PageHeader
        title="Your profile"
        lede="Name and phone can be updated here. Email changes go through sign-in."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <form className="flex max-w-measure flex-col gap-6">
          <Field label="Display name">
            <Input name="displayName" defaultValue={session?.email.split('@')[0] ?? ''} />
          </Field>
          <Field label="Phone">
            <Input name="phone" type="tel" autoComplete="tel" />
          </Field>
          <Field
            label="Email"
            hint="Change this in the sign-in service. Email is what lets you claim an enquiry."
          >
            <Input name="email" type="email" defaultValue={session?.email ?? ''} disabled />
          </Field>
        </form>
        <Text size="caption" tone="muted" className="mt-6">
          Saving is handled by the account API once you are signed in.
        </Text>
      </div>
    </>
  );
}
