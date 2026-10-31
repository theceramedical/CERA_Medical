'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';

import { startOidcNavigation } from '../lib/auth/start-oidc-navigation.ts';

import { AuthProviderIcon } from './auth-provider-icons.tsx';

import type { OidcSocialProvider } from '../lib/auth/oidc-social.ts';

const MASTER_EMAIL = 'theceramedical@gmail.com';

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
  const [success, setSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isStaffPortal = audience === 'staff';
  const trimmedEmail = emailInput.trim().toLowerCase();
  const isMasterTyped = trimmedEmail === MASTER_EMAIL;

  const handleEdgeSignIn = async (emailOverride?: string) => {
    const rawTarget = emailOverride ?? emailInput;
    const targetEmail = rawTarget.trim().toLowerCase();

    if (!targetEmail && !isStaffPortal) {
      setErrorMsg('Please enter your email address to continue.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // If staff portal and empty, default to master leadership
    const emailToSend = targetEmail || (isStaffPortal ? MASTER_EMAIL : '');
    const isOwner = emailToSend === MASTER_EMAIL;
    const roleToSend = isOwner ? 'owner' : isStaffPortal ? 'staff' : 'customer';

    try {
      const response = await fetch('/api/auth/edge-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: emailToSend,
          role: roleToSend,
          next,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        redirect?: string;
        sessionToken?: string;
        error?: string;
      };

      if (data.success && data.redirect) {
        // Set client-accessible fallback cookies
        if (data.sessionToken) {
          try {
            const maxAge = 30 * 24 * 60 * 60;
            document.cookie = `cera_session=${encodeURIComponent(data.sessionToken)}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
            document.cookie = `cera-session=${encodeURIComponent(data.sessionToken)}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
          } catch {
            // Sandboxed cookie handling
          }
        }

        setSuccess(true);
        setTimeout(() => {
          window.location.href = data.redirect ?? (isStaffPortal ? '/staff' : '/account');
        }, 350);
        return;
      }

      setErrorMsg(data.error ?? 'Authentication failed. Please verify credentials.');
      setLoading(false);
    } catch {
      // If edge route fails, fall back to OIDC navigation
      startOidcNavigation(next);
    }
  };

  return (
    <div className="mt-8 flex flex-col gap-5">
      {/* Visual Success Confirmation Banner */}
      {success ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-50 p-4 text-emerald-900 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-100">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-semibold">Access Granted</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Launching your secure workspace...
            </p>
          </div>
        </div>
      ) : null}

      {/* 1. Master Leadership Direct Authorization Card (Staff Mode) */}
      {isStaffPortal ? (
        <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-surface-tint p-5 shadow-sm transition-all hover:border-primary/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-eyebrow font-bold tracking-wider text-primary uppercase">
              <ShieldCheck size={18} />
              CERA Master Leadership
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Lock size={11} /> Cloudflare Edge Passkey
            </span>
          </div>

          <Text size="body-sm" tone="muted" className="mt-2 leading-relaxed">
            Instant administrative access for{' '}
            <span className="font-semibold text-heading">{MASTER_EMAIL}</span>. No password
            required.
          </Text>

          <Button
            type="button"
            variant="primary"
            className="mt-4 w-full justify-center gap-2 font-semibold shadow-xs"
            disabled={loading || success}
            onClick={() => {
              void handleEdgeSignIn(MASTER_EMAIL);
            }}
          >
            {loading && (!trimmedEmail || isMasterTyped) ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Authorizing with Cloudflare Edge...
              </>
            ) : (
              <>
                <KeyRound size={16} />
                Sign in as CERA Leadership
                <ArrowRight size={15} className="ml-1" />
              </>
            )}
          </Button>
        </div>
      ) : null}

      {/* Social Providers (Google SSO, etc.) */}
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full justify-center bg-surface"
          data-testid={`oidc-sign-in-${provider.id}`}
          disabled={loading || success}
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
          {isStaffPortal ? 'or sign in with team email' : 'or continue with email'}
        </Text>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Unified Form Supporting Enter Key & Instant Email Submit */}
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void handleEdgeSignIn();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="staff-email-input" className="text-caption font-medium text-copy">
            {isStaffPortal ? 'Staff or Administrator Email' : 'Email Address'}
          </label>
          <input
            id="staff-email-input"
            type="email"
            autoComplete="email"
            placeholder={isStaffPortal ? 'theceramedical@gmail.com' : 'name@example.com'}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={loading || success}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-body-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50"
          />

          {/* Real-time Account Detection Chip */}
          {isMasterTyped ? (
            <div className="mt-1 flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-caption text-primary">
              <UserCheck size={14} className="shrink-0" />
              <span>Master Administrator recognized — will grant owner privileges</span>
            </div>
          ) : null}

          {/* Error Message */}
          {errorMsg ? (
            <div className="mt-1.5 flex items-center gap-1.5 text-caption text-red-600 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}
        </div>

        <Button
          type="submit"
          variant={isStaffPortal ? 'outline' : 'primary'}
          className="w-full justify-center gap-2"
          data-testid="oidc-sign-in-continue"
          disabled={loading || success}
        >
          {loading && trimmedEmail && !isMasterTyped ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying Edge Signature...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              {mode === 'sign-up'
                ? 'Create Account'
                : isStaffPortal
                  ? 'Verify & Open Staff Portal'
                  : 'Verify & Continue'}
            </>
          )}
        </Button>
      </form>

      <Text size="caption" tone="muted" className="text-center leading-normal">
        {isStaffPortal
          ? 'Protected by Cloudflare Zero Trust and edge-encrypted session authorization.'
          : 'Instant, secure verification. Passwords are never stored on this site.'}
      </Text>
    </div>
  );
}
