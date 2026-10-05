import { Alert } from '@cera/ui/alert';
import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { ClipboardList, FileText, Link2, LogOut, Package, User } from 'lucide-react';

import { AppButtonLink, AppLink } from '../../../components/link.tsx';
import { PageHeader } from '../../../components/page-header.tsx';
import { sessionHasStaffRole } from '../../../lib/auth/portal-access.ts';
import { getSession } from '../../../lib/auth/session.ts';
import { checkoutEnabled } from '../../../lib/checkout-enabled.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your account',
};

function DashboardCard({
  href,
  title,
  description,
  icon,
}: {
  readonly href: string;
  readonly title: string;
  readonly description: string;
  readonly icon: typeof FileText;
}) {
  return (
    <AppLink
      href={href}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-6 no-underline shadow-card transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-surface-tint text-primary">
        <Icon icon={icon} size="md" />
      </div>
      <div>
        <Heading level={3} size="h4" className="group-hover:text-primary">
          {title}
        </Heading>
        <Text size="body-sm" tone="muted" className="mt-1">
          {description}
        </Text>
      </div>
    </AppLink>
  );
}

export default async function AccountDashboardPage() {
  const session = await getSession();
  const staff = session !== null && sessionHasStaffRole(session);

  return (
    <>
      <PageHeader title="Your account" lede="Your enquiries and their progress, in one place." />

      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {session === null ? (
          <Alert tone="info" title="Sign in to see your enquiries">
            <Text size="body-sm">
              <AppLink href="/auth/sign-in?next=/account">Sign in</AppLink> with the email you used
              on the enquiry form, then claim any existing references.
            </Text>
          </Alert>
        ) : (
          <div className="flex flex-col gap-8">
            {!session.emailVerified ? (
              <Alert tone="warning" title="Verify your email to use enquiries and orders">
                <Text size="body-sm">
                  Your profile can be updated now. Enquiries, orders, and claim links need a
                  verified email in your sign-in service.
                </Text>
              </Alert>
            ) : null}

            {staff ? (
              <Alert tone="info" title="You also have staff access">
                <Text size="body-sm">
                  This page is the customer portal (your own enquiries and orders). To triage
                  incoming requests for the team, open the{' '}
                  <AppLink href="/staff">staff console</AppLink>. Staff sign-in requires
                  multi-factor authentication.
                </Text>
              </Alert>
            ) : null}

            <section
              aria-labelledby="account-welcome"
              className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8"
            >
              <Heading level={2} id="account-welcome" size="h3">
                Welcome back
              </Heading>
              <Text tone="muted" className="mt-2">
                Signed in as <span className="font-medium text-foreground">{session.email}</span>
              </Text>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <AppButtonLink
                  href="/account/profile"
                  variant="outline"
                  size="sm"
                  iconStart={<User aria-hidden />}
                >
                  Update profile
                </AppButtonLink>
                <AppButtonLink
                  href="/account/claim"
                  variant="outline"
                  size="sm"
                  iconStart={<Link2 aria-hidden />}
                >
                  Claim an enquiry
                </AppButtonLink>
                <AppButtonLink
                  href="/auth/signout"
                  variant="ghost"
                  size="sm"
                  iconStart={<LogOut aria-hidden />}
                >
                  Sign out
                </AppButtonLink>
              </div>
            </section>

            <section aria-labelledby="account-shortcuts">
              <Heading level={2} id="account-shortcuts" size="h4" className="mb-4">
                Portal
              </Heading>
              <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
                <li>
                  <DashboardCard
                    href="/account/enquiries"
                    title="Your enquiries"
                    description="Track status and messages for research requests linked to this account."
                    icon={FileText}
                  />
                </li>
                {checkoutEnabled() ? (
                  <li>
                    <DashboardCard
                      href="/account/orders"
                      title="Your orders"
                      description="View order history and fulfilment updates."
                      icon={Package}
                    />
                  </li>
                ) : null}
                {staff ? (
                  <li>
                    <DashboardCard
                      href="/staff"
                      title="Staff console"
                      description="Team enquiry queue, assignments, and integration deliveries."
                      icon={ClipboardList}
                    />
                  </li>
                ) : null}
              </ul>
              <Text size="body-sm" tone="muted" className="mt-6">
                {staff
                  ? 'Customer enquiries you submitted appear here after you claim them to this email. All new web enquiries are handled in the staff console.'
                  : 'Open enquiries appear in the list once they are claimed to this email address.'}
              </Text>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
