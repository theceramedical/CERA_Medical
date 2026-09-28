/**
 * Only same-origin relative paths. An absolute `next` is an open redirect.
 */
export function safeReturnTo(value: string | null | undefined, fallback = '/account'): string {
  if (value === undefined || value === null) return fallback;
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.includes('://')
  ) {
    return fallback;
  }
  return value;
}
