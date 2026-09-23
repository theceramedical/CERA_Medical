import { ExternalLink } from 'lucide-react';

import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { AnchorHTMLAttributes, ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/**
 * Link, per design-language.md section 5.
 *
 * Renders whatever element it is given, defaulting to `<a>`. That indirection exists so this
 * package stays free of a framework dependency: `apps/web` binds `next/link` to it once, in its
 * own wrapper, and every other consumer gets a plain anchor. A `next/link` import here would make
 * `@cera/ui` unusable from the Payload admin and from any test that is not running a Next
 * compiler.
 */

export type LinkVariant = 'inline' | 'standalone' | 'quiet';

const VARIANT_CLASS: Record<LinkVariant, string> = {
  /**
   * A link inside running text.
   *
   * Underlined, and that is not negotiable. WCAG 1.4.1 forbids colour as the only means of
   * conveying information, and a link that is distinguished from its surrounding sentence purely
   * by being blue is exactly that failure. `underline-offset-2` keeps the rule off the descenders,
   * which is what usually prompts someone to remove it.
   */
  inline:
    'text-primary underline underline-offset-2 decoration-1 hover:decoration-2 hover:text-primary-hover',

  /**
   * A link that stands alone - a card title, a nav item, a footer entry.
   *
   * No underline at rest is acceptable here because the link is not embedded in a sentence: its
   * position and isolation already identify it as a control. An underline appears on hover so the
   * affordance is still discoverable.
   */
  standalone: 'text-primary hover:text-primary-hover hover:underline underline-offset-2',

  /** Inherits its colour. For a heading that is itself a link, where the heading ink should win. */
  quiet: 'text-inherit hover:text-primary hover:underline underline-offset-2',
};

export interface LinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'color'> {
  /** The element to render. `apps/web` passes `next/link`; the default is a plain anchor. */
  readonly as?: ElementType;
  readonly href: string;
  readonly variant?: LinkVariant;
  /**
   * Opens in a new tab, with the affordances that requires.
   *
   * Not merely `target="_blank"`. Opening a new tab without warning is disorienting for anyone
   * relying on a screen reader or on browser history, so this also renders a visible icon and
   * appends "(opens in a new tab)" to the accessible name.
   */
  readonly external?: boolean;
  readonly children: ReactNode;
}

export function Link({
  as,
  href,
  variant = 'inline',
  external = false,
  className,
  children,
  ...rest
}: LinkProps) {
  const Tag: ElementType = as ?? 'a';

  /**
   * `rel="noopener noreferrer"` on anything opening a new tab.
   *
   * `noopener` is the security half: without it the opened page receives a `window.opener`
   * reference and can navigate this tab somewhere else, which is a working phishing primitive.
   * Modern browsers imply it for `target="_blank"`, but older ones do not and the cost of being
   * explicit is nothing.
   */
  const externalProps: AnchorHTMLAttributes<HTMLAnchorElement> = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Tag
      href={href}
      className={cn(
        VARIANT_CLASS[variant],
        'rounded-sm transition-colors duration-fast ease-standard',
        className,
      )}
      {...externalProps}
      {...rest}
    >
      {children}
      {external ? (
        <>
          {/* Inline with the text, hence the explicit alignment - a bare 16px icon in a line of
              17px text sits noticeably high otherwise. */}
          <ExternalLink
            className="ml-1 inline-block size-3.5 align-[-0.125em]"
            aria-hidden="true"
            focusable="false"
          />
          <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
        </>
      ) : null}
    </Tag>
  );
}
