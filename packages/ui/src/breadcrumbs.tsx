import { ChevronRight } from 'lucide-react';

import { cn } from './cn.ts';

import type { ElementType } from 'react';

/**
 * The trail above a service or article page.
 *
 * Structural requirements, all of which look identical on screen when omitted:
 *
 *   - `<nav aria-label="Breadcrumb">`. Without the label a page with several navs gives a screen
 *     reader user a landmark list reading "navigation, navigation, navigation".
 *   - An `<ol>`, because the order is the meaning.
 *   - The separator is `aria-hidden`, otherwise every level is read as "Services greater than
 *     Cardiology".
 *   - The last item is `aria-current="page"` and is **not** a link. A link to the page you are
 *     already on is a control that does nothing.
 */

export interface Crumb {
  readonly label: string;
  /** Omitted for the current page, which is what makes it render as plain text. */
  readonly href?: string;
}

export interface BreadcrumbsProps {
  readonly items: readonly Crumb[];
  /**
   * The link component. Defaults to `a` so this package stays framework-agnostic; `apps/web`
   * passes `next/link` to keep client-side navigation.
   */
  readonly linkAs?: ElementType;
  readonly className?: string;
}

export function Breadcrumbs({ items, linkAs: Link = 'a', className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-body-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${String(index)}`} className="flex items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
              ) : null}

              {item.href === undefined || isLast ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast ? 'font-semibold text-foreground' : 'text-muted')}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  // Underlined, per SC 1.4.1: in a trail of small text, colour alone is not enough
                  // to say which items are links.
                  className={cn(
                    'rounded-sm underline decoration-1 underline-offset-2',
                    'text-copy transition-colors duration-fast ease-standard hover:text-primary',
                  )}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
