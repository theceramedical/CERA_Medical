/**
 * Optional Authentik OAuth sources (Google, Microsoft, …) linked from CERA sign-in UI.
 *
 * The authorize request accepts `source=<slug>` so users skip the generic Authentik chooser.
 * Slugs must match sources configured in Authentik; only explicitly listed providers are accepted.
 */

export type OidcSocialProviderId = 'google' | 'microsoft';

export interface OidcSocialProvider {
  readonly id: OidcSocialProviderId;
  readonly label: string;
  readonly sourceSlug: string;
}

const PROVIDER_ENV: Record<OidcSocialProviderId, string> = {
  google: 'OIDC_GOOGLE_SOURCE_SLUG',
  microsoft: 'OIDC_MICROSOFT_SOURCE_SLUG',
};

const PROVIDER_LABELS: Record<OidcSocialProviderId, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
};

function slugFor(id: OidcSocialProviderId): string | undefined {
  const raw = process.env[PROVIDER_ENV[id]];
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Social providers enabled via environment (shown on sign-in / sign-up). */
export function configuredOidcSocialProviders(): readonly OidcSocialProvider[] {
  const providers: OidcSocialProvider[] = [];
  for (const id of Object.keys(PROVIDER_LABELS) as OidcSocialProviderId[]) {
    const sourceSlug = slugFor(id);
    if (sourceSlug !== undefined) {
      providers.push({ id, label: PROVIDER_LABELS[id], sourceSlug });
    }
  }
  return providers;
}

/**
 * Maps `?provider=google` from the app to an Authentik `source` slug, or `undefined` if unknown.
 */
export function resolveOidcSocialProvider(
  provider: string | null | undefined,
): OidcSocialProvider | undefined {
  if (provider === null || provider === undefined || provider.length === 0) return undefined;
  return configuredOidcSocialProviders().find((entry) => entry.id === provider);
}
