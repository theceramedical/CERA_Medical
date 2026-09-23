import { ButtonLink } from './button.tsx';
import { Card, CardSpacer } from './card.tsx';
import { cn } from './cn.ts';
import { IconDisc } from './icon-disc.tsx';
import { Text } from './typography.tsx';

import type { ElementType, ReactNode } from 'react';

/**
 * A service in a grid, per design-language.md section 5.2.
 *
 * The composition rule this component exists to enforce: **the title is the link and the card is
 * not**. A card-wide anchor is the obvious way to get a large target, and it produces a single link
 * whose accessible name is every word in the card - title, description, and the button's label -
 * announced as one run, with the nested "Learn More" link now invalid markup. In a screen reader's
 * link list that is six unusable entries rather than six service names.
 *
 * "Learn More" therefore points at the same target with a distinct accessible name
 * ("Learn more about Cardiology"), which is what keeps the link list readable while preserving the
 * pointer target the visual design wants.
 */

export interface ServiceCardProps {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  /** A 24px line icon. Wrapped in an `aria-hidden` disc - it never carries meaning. */
  readonly icon?: ReactNode;
  /**
   * The link component, defaulting to `a`. `apps/web` passes `next/link`.
   *
   * Both links in this card go through it, so one prop cannot leave the card half client-side
   * routed - a mismatch that shows up as the title navigating instantly and the button triggering a
   * full page load.
   */
  readonly linkAs?: ElementType;
  /**
   * The heading level.
   *
   * Section 5.2 draws the title at `h4` size. Level and size are separate here because the same
   * card appears under an `h2` on the homepage and under an `h3` on a category page, and a
   * hardcoded level would skip a heading in one of them.
   */
  readonly headingLevel?: 2 | 3 | 4;
  readonly className?: string;
}

export function ServiceCard({
  title,
  description,
  href,
  icon,
  linkAs: Link = 'a',
  headingLevel = 3,
  className,
}: ServiceCardProps) {
  const HeadingTag = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';

  return (
    <Card as="li" interactive className={cn('gap-4', className)}>
      {icon === undefined ? null : <IconDisc tone="tint">{icon}</IconDisc>}

      <HeadingTag className="text-h4">
        <Link
          href={href}
          // No underline here, unlike an inline link: the title is a heading in a bordered card
          // sitting above a button, so its position already identifies it as the primary action.
          // SC 1.4.1 is about colour being the *only* cue, and here it is not.
          className="rounded-sm transition-colors duration-fast ease-standard hover:text-primary"
        >
          {title}
        </Link>
      </HeadingTag>

      <Text size="body-sm">{description}</Text>

      {/* Pushes the button to the card's foot so a row of cards with different copy lengths still
          has its buttons on one line. */}
      <CardSpacer />

      {/* A second link to the same target. `aria-label` rather than visually hidden text, because
          the visible words are already "Learn More" and SC 2.5.3 Label in Name is satisfied by the
          name containing them. */}
      <ButtonLink
        as={Link}
        href={href}
        variant="outline"
        fullWidth
        aria-label={`Learn more about ${title}`}
      >
        Learn More
      </ButtonLink>
    </Card>
  );
}
