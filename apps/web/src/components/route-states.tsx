import { IconDisc } from '@cera/ui/icon-disc';
import { Skeleton, SkeletonRegion } from '@cera/ui/skeleton';
import { Heading, Text } from '@cera/ui/typography';

import type { ReactNode } from 'react';

/**
 * The building blocks for the `error.tsx`, `loading.tsx`, and `not-found.tsx` files each route group
 * needs.
 *
 * Shared because what differs between the groups is the copy and the way forward, not the structure -
 * and hand-writing a centred panel three times over is three chances for one of them to quietly lose
 * its heading.
 */

/**
 * A route-level state: icon, `h1`, explanation, and at least one way forward.
 *
 * **`h1`, which is why this is not `EmptyState`.** `EmptyState` is for a region inside a page that
 * already has a heading, so its level is capped at `h2`. These files *are* the page - a 404 rendered
 * with an `h2` and no `h1` gives a screen reader user nothing to orient by, and the page reports as
 * having no title in a heading list.
 *
 * The action is required rather than optional. A state with no way out is a dead end, and a user
 * arrives at one of these by accident - a mistyped URL, a stale bookmark, a link in an old email - so
 * the back button is the only alternative on offer, and it is not on offer at all to someone who
 * followed a link into a new tab.
 */
export interface RouteStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly action: ReactNode;
}

export function RouteState({ icon, title, description, action }: RouteStateProps) {
  return (
    <div className="mx-auto flex max-w-site flex-col items-center px-6 py-20 text-center md:px-10 lg:py-28">
      {/* `IconDisc` hides its contents from assistive technology. The heading below says what
          happened; a decorative glyph repeating it in an announcement adds nothing. */}
      <IconDisc tone="accent" size="lg">
        {icon}
      </IconDisc>

      <Heading level={1} size="h2" className="mt-6">
        {title}
      </Heading>

      <Text size="body-lg" tone="muted" measure className="mt-4">
        {description}
      </Text>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">{action}</div>
    </div>
  );
}

/**
 * A loading placeholder shaped like the page it stands in for.
 *
 * Shaped, not a spinner, because the reason to show anything is to say "content is arriving here, in
 * roughly this arrangement". A centred spinner communicates only that something is happening, and then
 * produces a layout jump when the real content replaces it.
 *
 * `SkeletonRegion` does the announcing. The blocks themselves are `aria-hidden` - a screen reader
 * reading out eight empty boxes is worse than silence - so without the region a loading state is
 * entirely invisible to anyone not looking at it.
 */
export function PageSkeleton() {
  return (
    <SkeletonRegion label="Loading page content" loading>
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-6 h-10 w-full max-w-xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-5 w-full max-w-lg" />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Three blocks, because every content page in this phase leads with a three-across row.
              The count is part of the shape; one block would understate how much is coming. */}
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
