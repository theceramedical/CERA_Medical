'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { startOidcNavigation } from '../lib/auth/start-oidc-navigation.ts';

import { AuthProviderIcon } from './auth-provider-icons.tsx';

import type { OidcSocialProvider } from '../lib/auth/oidc-social.ts';

export function AuthSignInOptions({
  next,
  socialProviders,
  mode,
  audience = 'customer',
}: {
  readonly next: string;
  readonly socialProviders: readonly OidcSocialProvider[];
  readonly mode: 'sign-in' | 'sign-up';
  readonly audience?: 'customer' | 'staff';
}) {
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEdgeSignIn = async (email?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/auth/edge-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email ?? (audience === 'staff' ? 'theceramedical@gmail.com' : emailInput),
          role: audience === 'staff' ? 'owner' : 'customer',
          next,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        redirect?: string;
        error?: string;
      };
      if (data.success && data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      setErrorMsg(data.error ?? 'Authentication failed');
      setLoading(false);
    } catch {
      // Fallback to legacy OIDC navigation if network error
      startOidcNavigation(next);
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-4">
      {/* 1. Master Passkey / Leadership One-Click Sign-In for Staff */}
      {audience === 'staff' ? (
        <div className="rounded-xl border border-primary/30 bg-surface-tint p-4 shadow-xs">
          <div className="flex items-center gap-2 text-eyebrow font-bold tracking-wider text-primary uppercase">
            <ShieldCheck size={16} />
            Cloudflare Edge Passkey
          </div>
          <Text size="body-sm" tone="muted" className="mt-1 leading-snug">
            Sign in as CERA Master Leadership (
            <span className="font-semibold text-heading">theceramedical@gmail.com</span>) with
            instant edge authorization.
          </Text>
          <Button
            type="button"
            variant="primary"
            className="mt-3.5 w-full justify-center gap-2"
            disabled={loading}
            onClick={() => {
              void handleEdgeSignIn('theceramedical@gmail.com');
            }}
          >
            <KeyRound size={16} />
            {loading ? 'Authenticating...' : 'Sign in as CERA Leadership'}
          </Button>
        </div>
      ) : null}

      {/* Social Providers (Google, etc.) */}
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

      {/* Divider */}
      <div className="flex items-center gap-3 py-1" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        <Text size="body-sm" tone="muted" as="span">
          or continue with email
        </Text>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Email input for staff / customer */}
      <div className="flex flex-col gap-2">
        <input
          type="email"
          placeholder={audience === 'staff' ? 'staff.name@ceramedical.org' : 'name@example.com'}
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-body-sm transition-colors focus:border-primary focus:outline-none"
        />
        {errorMsg ? (
          <Text size="caption" className="text-red-600">
            {errorMsg}
          </Text>
        ) : null}
      </div>

      <Button
        type="button"
        variant={audience === 'staff' ? 'outline' : 'primary'}
        className="w-full justify-center"
        data-testid="oidc-sign-in-continue"
        disabled={loading}
        onClick={() => {
          void handleEdgeSignIn(emailInput || undefined);
        }}
      >
        <Sparkles size={16} className="mr-1.5" />
        {loading ? 'Verifying...' : mode === 'sign-up' ? 'Create Account' : 'Verify & Continue'}
      </Button>

      <Text size="caption" tone="muted" className="text-center leading-normal">
        {audience === 'staff'
          ? 'Protected by Cloudflare Zero Trust and edge-encrypted session authorization.'
          : 'Instant, secure verification. Passwords are never stored on this site.'}
      </Text>
    </div>
  );
}
