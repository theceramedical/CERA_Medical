/** Paths that require a verified email before the API will respond. */
const VERIFIED_EMAIL_API_PREFIXES = [
  '/v1/me/enquiries',
  '/v1/me/orders',
  '/v1/enquiries/claim/',
] as const;

export function apiPathRequiresVerifiedEmail(path: string): boolean {
  return VERIFIED_EMAIL_API_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

export function signInPath(returnTo?: string): string {
  return returnTo === undefined
    ? '/auth/sign-in'
    : `/auth/sign-in?next=${encodeURIComponent(returnTo)}`;
}
