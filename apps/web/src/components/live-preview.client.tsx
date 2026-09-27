'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';

/**
 * Reloads the current route when the CMS live-preview iframe is told the
 * document changed.
 *
 * Only mounted while Next draft mode is on, so a published visitor never
 * downloads this island or opens a websocket back to the CMS origin.
 */
export function LivePreview({ serverURL }: { readonly serverURL: string }) {
  const router = useRouter();

  return (
    <RefreshRouteOnSave
      refresh={() => {
        router.refresh();
      }}
      serverURL={serverURL}
    />
  );
}
