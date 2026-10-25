'use client';

import { cn } from '@cera/ui/cn';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { isCurrent } from './navigation.ts';

import type { NavItem } from './navigation.ts';

/**
 * The five centred nav items, with the active one marked.
 *
 * A client component because `usePathname` is a hook. The alternative - passing the pathname down
 * from a server component - is not available in a layout: a layout does not receive the pathname, by
 * design, because it is not re-rendered on navigation within its subtree.
 *
 * The underline is drawn with a `border-b` on a `span` rather than `text-decoration`, so its offset
 * and thickness are controllable and it sits 6px below the text as the reference has it.
 */
export function DesktopNavLinks({ items }: { readonly items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex list-none items-center gap-2 p-0">
      {items.map((item) => {
        const current = isCurrent(item.href, pathname);

        return (
          <li key={item.href} className="group relative">
            <NextLink
              href={item.href}
              /**
               * `aria-current="page"` is the machine-readable half of the same statement the
               * underline makes visually. Without it the active item is conveyed by colour and a
               * 2px rule, which WCAG 1.4.1 does not accept and a screen reader cannot report at
               * all - so a user navigating by links has no idea where they already are.
               */
              aria-current={current ? 'page' : undefined}
              className={cn(
                'inline-flex h-11 items-center rounded-md px-3 text-button no-underline',
                'transition-colors duration-base ease-standard',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                current ? 'text-foreground' : 'text-neutral-700 hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'border-b-2 py-0.5',
                  current ? 'border-primary' : 'border-transparent',
                )}
              >
                {item.label}
              </span>
            </NextLink>
            {item.children !== undefined && item.children.length > 0 ? (
              <ul className="invisible pointer-events-none absolute top-full left-0 z-40 m-0 min-w-64 list-none rounded-md border border-border bg-surface p-2 opacity-0 shadow-card group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <NextLink
                      href={child.href}
                      className="block rounded-md px-3 py-2 text-caption font-medium text-neutral-700 no-underline hover:bg-surface-subtle hover:text-foreground"
                    >
                      {child.label}
                    </NextLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
