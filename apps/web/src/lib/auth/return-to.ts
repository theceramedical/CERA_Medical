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

/** True when a return target belongs to the invitation-only staff workspace. */
export function isStaffReturnTo(value: string): boolean {
  return value === '/staff' || value.startsWith('/staff/');
}

/** Customer enrollment must never send a newly-created account into the staff workspace. */
export function customerReturnTo(value: string): string {
  return isStaffReturnTo(value) ? '/account' : value;
}
