'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';

import { startOidcNavigation } from '../lib/auth/start-oidc-navigation.ts';

import { AuthProviderIcon } from './auth-provider-icons.tsx';

import type { OidcSocialProvider } from '../lib/auth/oidc-social.ts';

export function AuthSignInOptions({
  next,
  socialProviders,
  mode,
}: {
  readonly next: string;
  readonly socialProviders: readonly OidcSocialProvider[];
  readonly mode: 'sign-in' | 'sign-up';
}) {
  const emailLabel = mode === 'sign-up' ? 'Continue with email' : 'Continue with email or password';

  return (
    <div className="mt-8 flex flex-col gap-4">
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full justify-center bg-surface"
          data-testid={`oidc-sign-in-${provider.id}`}
          onClick={() => startOidcNavigation(next, provider.id)}
        >
          <AuthProviderIcon provider={provider.id} className="size-5 shrink-0" />
          Continue with {provider.label}
        </Button>
      ))}

      {socialProviders.length > 0 ? (
        <div className="flex items-center gap-3 py-1" aria-hidden="true">
          <div className="h-px flex-1 bg-border" />
          <Text size="body-sm" tone="muted" as="span">
            or
          </Text>
          <div className="h-px flex-1 bg-border" />
        </div>
      ) : null}

      <Button
        type="button"
        variant="primary"
        className="w-full"
        data-testid="oidc-sign-in-continue"
        onClick={() => startOidcNavigation(next)}
      >
        {emailLabel}
      </Button>

      <Text size="body-sm" tone="muted" className="text-center">
        You will be redirected to CERA&apos;s secure sign-in service. Passwords are never stored on
        this site.
      </Text>
    </div>
  );
}
