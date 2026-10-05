/** Base URL for server-side catalogue reads (Docker internal URL in production). */
function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    if (value !== undefined && value.length > 0) return value;
  }
  return undefined;
}

export function resolveCatalogueApiBaseUrl(): string {
  return (
    firstNonEmpty(process.env.API_INTERNAL_URL, process.env.NEXT_PUBLIC_API_URL) ??
    'http://localhost:3003'
  );
}
