'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { ArrowRight, ShieldCheck } from 'lucide-react';

import { startOidcNavigation } from '../lib/auth/start-oidc-navigation.ts';

import { AuthProviderIcon } from './auth-provider-icons.tsx';

import type { OidcSocialProvider } from '../lib/auth/oidc-social.ts';

export function AuthSignInOptions({
  next,
  socialProviders,
  mode,
  audience = 'customer',
  configured = true,
}: {
  readonly next: string;
  readonly socialProviders: readonly OidcSocialProvider[];
  readonly mode: 'sign-in' | 'sign-up';
  readonly audience?: 'customer' | 'staff';
  readonly configured?: boolean;
}) {
  if (!configured) {
    return (
      <div
        role="status"
        className="mt-8 rounded-lg border border-border bg-surface-tint p-4"
        data-testid="oidc-not-configured"
      >
        <Text size="body-sm" tone="muted">
          {audience === 'staff'
            ? 'Staff sign-in is not available yet. Contact the CERA administrator for access.'
            : 'Secure account sign-in is being set up. You can still send an enquiry without an account.'}
        </Text>
      </div>
    );
  }

  if (audience === 'staff') {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <Text size="body-sm" tone="muted">
          Sign in with the staff identity provisioned by a CERA administrator. The application
          checks the verified staff role on every staff page and API request.
        </Text>
        <Button
          type="button"
          variant="primary"
          className="w-full justify-center gap-2"
          data-testid="staff-oidc-sign-in"
          onClick={() => startOidcNavigation(next)}
        >
          <ShieldCheck size={16} />
          Continue to secure staff sign-in
          <ArrowRight size={15} />
        </Button>
        <Text size="caption" tone="muted" className="text-center">
          Staff credentials and multi-factor requirements are verified by the configured identity
          provider.
        </Text>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4">
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full justify-center gap-2 bg-surface"
          data-testid={`oidc-sign-in-${provider.id}`}
          onClick={() => startOidcNavigation(next, provider.id)}
        >
          <AuthProviderIcon provider={provider.id} className="size-5 shrink-0" />
          Continue with {provider.label}
        </Button>
      ))}
      <Button
        type="button"
        variant={socialProviders.length > 0 ? 'outline' : 'primary'}
        className="w-full justify-center gap-2"
        data-testid="oidc-sign-in-continue"
        onClick={() => startOidcNavigation(next)}
      >
        <ShieldCheck size={16} />
        {mode === 'sign-up' ? 'Create account securely' : 'Continue securely'}
        <ArrowRight size={15} />
      </Button>
      <Text size="caption" tone="muted" className="text-center">
        Your identity provider verifies your account before this site creates a session.
      </Text>
    </div>
  );
}
