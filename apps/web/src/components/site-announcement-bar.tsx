import { Text } from '@cera/ui/typography';

import { getPublicGlobal } from '../lib/cms/client.ts';

import { AppLink } from './link.tsx';

/**
 * Gradient status ribbon from the Stitch clinical-precision header (below the main nav).
 * Content is fully CMS-driven via the `announcement` global.
 */
export async function SiteAnnouncementBar() {
  const announcement = await getPublicGlobal<{
    enabled?: boolean;
    statusLabel?: string;
    message?: string;
    href?: string;
    linkLabel?: string;
  }>('announcement');

  if (!announcement?.enabled) return null;

  const statusLabel = announcement.statusLabel?.trim();
  const message = announcement.message?.trim();
  const href = announcement.href?.trim();
  const linkLabel = announcement.linkLabel?.trim();

  if (!statusLabel && !message && !(href && linkLabel)) return null;

  return (
    <div
      className="bg-linear-to-r from-gradient-from to-gradient-to px-4 py-2.5 text-on-primary"
      role="region"
      aria-label="Site announcement"
    >
      <div className="mx-auto flex max-w-site flex-col items-center justify-center gap-2 text-center sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-1 sm:text-left">
        {statusLabel ? (
          <Text
            as="span"
            size="caption"
            tone="on-dark"
            className="inline-flex items-center gap-2 font-semibold tracking-wide"
          >
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-teal-300 motion-safe:animate-pulse"
            />
            {statusLabel}
          </Text>
        ) : null}
        {message ? (
          <Text as="span" size="caption" tone="on-dark" className="opacity-95">
            {statusLabel ? (
              <span aria-hidden="true" className="mx-2 hidden opacity-70 sm:inline">
                |
              </span>
            ) : null}
            {message}
          </Text>
        ) : null}
        {href && linkLabel ? (
          <AppLink
            href={href}
            variant="quiet"
            className="text-caption font-semibold text-on-primary underline underline-offset-2 hover:text-on-primary hover:opacity-90"
          >
            {linkLabel}
          </AppLink>
        ) : null}
      </div>
    </div>
  );
}
