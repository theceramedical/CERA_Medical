'use client';

import { cn } from '@cera/ui/cn';
import { useEffect, useState } from 'react';

import type { ReactNode } from 'react';

/**
 * The sticky header shell, which gains a shadow once the page has scrolled past 8px
 * (design-language.md section 5.5).
 *
 * A client component only because there is no way to observe scroll position on the server. It takes
 * the header's contents as children rather than rendering them, so the wordmark, the nav, and the
 * buttons all stay server-rendered - the boundary is drawn as tightly as the effect requires and no
 * tighter.
 */
export function HeaderScrollShadow({ children }: { readonly children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    /**
     * Read once on mount as well as on scroll.
     *
     * A page restored by the browser's back-forward cache, or one loaded with a `#fragment`, starts
     * already scrolled - so a listener alone leaves the header flat until the user moves, which looks
     * like a rendering bug rather than a missing event.
     */
    const update = (): void => {
      setScrolled(window.scrollY > 8);
    };

    update();

    /**
     * `passive: true` tells the browser this listener will not call `preventDefault`, which lets it
     * keep scrolling on the compositor instead of waiting for this handler. On a scroll listener that
     * is the difference between a smooth scroll and a janky one.
     */
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      window.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-surface',
        'transition-shadow duration-base ease-standard',
        scrolled ? 'shadow-sm' : 'shadow-none',
      )}
    >
      {children}
    </header>
  );
}
