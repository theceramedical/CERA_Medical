'use client';

import { cn } from '@cera/ui/cn';
import { ChevronDown } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { isCurrent } from './navigation.ts';

import type { NavItem } from './navigation.ts';

export function DesktopNavLinks({ items }: { readonly items: readonly NavItem[] }) {
  const pathname = usePathname();
  const linkClass = (current: boolean) =>
    cn(
      'inline-flex min-h-11 items-center rounded-md px-3 text-button no-underline transition-colors',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
      current ? 'text-foreground' : 'text-neutral-700 hover:text-foreground',
    );

  return (
    <ul className="flex list-none items-center gap-1 p-0">
      {items.map((item) => {
        const current = isCurrent(item.href, pathname);
        if (item.children && item.children.length > 0) {
          return (
            <li key={item.href}>
              <details className="group relative">
                <summary
                  aria-current={current ? 'page' : undefined}
                  className={cn(linkClass(current), 'cursor-pointer list-none gap-1 [&::-webkit-details-marker]:hidden')}
                >
                  {item.label}
                  <ChevronDown aria-hidden="true" size={15} className="transition-transform group-open:rotate-180" />
                </summary>
                <ul className="absolute top-full left-0 z-50 mt-1 min-w-64 list-none rounded-md border border-border bg-surface p-2 shadow-lg">
                  <li>
                    <NextLink href={item.href} className="flex min-h-11 items-center rounded px-3 text-body-sm font-semibold text-primary no-underline hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus">
                      All Services
                    </NextLink>
                  </li>
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <NextLink
                        href={child.href}
                        aria-current={isCurrent(child.href, pathname) ? 'page' : undefined}
                        className="flex min-h-11 items-center rounded px-3 text-body-sm text-copy no-underline hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-focus"
                      >
                        {child.label}
                      </NextLink>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        }
        return (
          <li key={item.href}>
            <NextLink href={item.href} aria-current={current ? 'page' : undefined} className={linkClass(current)}>
              <span className={cn('border-b-2 py-0.5', current ? 'border-primary' : 'border-transparent')}>
                {item.label}
              </span>
            </NextLink>
          </li>
        );
      })}
    </ul>
  );
}
