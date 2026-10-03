import { Alert } from '@cera/ui/alert';
import { Button } from '@cera/ui/button';
import { Field } from '@cera/ui/field';
import { Input } from '@cera/ui/input';
import { Text } from '@cera/ui/typography';
import { redirect } from 'next/navigation';

import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your profile' };

interface CustomerProfile {
  readonly displayName: string;
  readonly phone: string | null;
  readonly email: string;
}

function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
async function saveProfile(formData: FormData) {
  'use server';

  const displayName = formString(formData, 'displayName');
  const phone = formString(formData, 'phone');
  if (displayName.length === 0 || displayName.length > 120 || phone.length > 32) {
    redirect('/account/profile?invalid=1');
  }

  await authenticatedApi('/v1/me/profile', {
    method: 'PATCH',
    body: { displayName, phone: phone.length === 0 ? null : phone },
  });
  redirect('/account/profile?saved=1');
}

export default async function AccountProfilePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ saved?: string; invalid?: string }>;
}) {
  const [profile, { saved, invalid }] = await Promise.all([
    authenticatedApi<CustomerProfile>('/v1/me/profile'),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        title="Your profile"
        lede="Name and phone can be updated here. Email changes go through sign-in."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {saved === '1' ? (
          <Alert tone="success" title="Profile updated" className="mb-6 max-w-measure">
            Your contact details have been saved.
          </Alert>
        ) : null}
        {invalid === '1' ? (
          <Alert tone="danger" title="Check your profile details" className="mb-6 max-w-measure">
            Enter a name and use a phone number of 32 characters or fewer.
          </Alert>
        ) : null}
        <form action={saveProfile} className="flex max-w-measure flex-col gap-6">
          <Field label="Display name">
            <Input name="displayName" defaultValue={profile.displayName} maxLength={120} required />
          </Field>
          <Field label="Phone">
            <Input
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={profile.phone ?? ''}
              maxLength={32}
            />
          </Field>
          <Field
            label="Email"
            hint="Change this in the sign-in service. Email is what lets you claim an enquiry."
          >
            <Input name="email" type="email" defaultValue={profile.email} disabled />
          </Field>
          <Button type="submit" className="self-start">
            Save changes
          </Button>
        </form>
        <Text size="caption" tone="muted" className="mt-6">
          Your profile is used only for your CERA account and service communications.
        </Text>
      </div>
    </>
  );
}
