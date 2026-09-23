import { Pill } from './badge.tsx';
import { ButtonLink } from './button.tsx';
import { Card, CardSpacer } from './card.tsx';
import { cn } from './cn.ts';
import { Text } from './typography.tsx';

import type { ElementType, ReactNode } from 'react';

/**
 * An article in a grid, per design-language.md section 5.4.
 *
 * Same composition rule as `ServiceCard`: the title is the link, the card is not.
 *
 * The cover image is decorative - `alt=""` - because the title immediately below it carries the
 * same meaning. A real `alt` here would make the card announce its subject twice, and the honest
 * alternative ("A photograph of a stethoscope on a desk") tells the reader nothing about the
 * article. The image element is supplied by the caller rather than built here, so `apps/web` can use
 * `next/image` and its sizing, and the `alt=""` requirement is asserted in this component's tests
 * rather than hoped for.
 */

export interface ArticleCardProps {
  readonly title: string;
  readonly excerpt: string;
  readonly href: string;
  /** The category chip over the image's bottom-left. Announced with a "Category:" prefix. */
  readonly category: string;
  /**
   * The 16:9 cover. Supplied by the caller, and must be decorative: `alt=""`.
   *
   * Optional, because an article without a cover should render as a card without an image rather
   * than as a card with a grey rectangle where one would have been.
   */
  readonly cover?: ReactNode;
  readonly linkAs?: ElementType;
  readonly headingLevel?: 2 | 3 | 4;
  readonly className?: string;
}

export function ArticleCard({
  title,
  excerpt,
  href,
  category,
  cover,
  linkAs: Link = 'a',
  headingLevel = 3,
  className,
}: ArticleCardProps) {
  const HeadingTag = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <Card as="li" interactive className={cn('gap-4 p-0', className)}>
      {/* `relative` so the pill can be positioned against the image, `overflow-hidden` with the
          matching radius so the cover's corners are clipped rather than poking out of the card. */}
      <div className="relative overflow-hidden rounded-t-lg">
        {cover}
        <div className="absolute bottom-3 left-3">
          <Pill>{category}</Pill>
        </div>
      </div>

      <div className="flex grow flex-col gap-4 px-5 pb-5">
        <HeadingTag className="text-h4">
          <Link
            href={href}
            className="rounded-sm transition-colors duration-fast ease-standard hover:text-primary"
          >
            {title}
          </Link>
        </HeadingTag>

        {/**
         * `line-clamp-2` truncates visually and leaves the full text in the DOM, which is the
         * point: a screen reader reads the whole excerpt, and `text-overflow` never replaces
         * content with an ellipsis that assistive technology would announce as content.
         */}
        <Text size="body-sm" className="line-clamp-2">
          {excerpt}
        </Text>

        <CardSpacer />

        <ButtonLink as={Link} href={href} aria-label={`Read more: ${title}`}>
          Read More
        </ButtonLink>
      </div>
    </Card>
  );
}
