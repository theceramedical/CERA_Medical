import { signPreviewToken } from '@cera/contracts/preview-token';

export const PREVIEW_BREAKPOINTS = [
  { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
  { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
  { label: 'Desktop', name: 'desktop', width: 1280, height: 800 },
] as const;

/**
 * A time-limited URL the admin "Preview" button and the live-preview iframe open.
 *
 * Points at `apps/web`'s `/api/preview`, which verifies the token, enables
 * `draftMode()`, and redirects to `path`. The path is a public route so the
 * preview is the published presentation with draft data, not a second layout.
 */
export function previewUrl(path: string): string {
  const web = process.env.WEB_URL ?? 'http://localhost:3000';
  const secret = process.env.PAYLOAD_PREVIEW_SECRET;

  if (secret === undefined || secret.length === 0) {
    return `${web}${path}`;
  }

  const token = signPreviewToken(secret, path);
  return `${web}/api/preview?path=${encodeURIComponent(path)}&token=${encodeURIComponent(token)}`;
}
