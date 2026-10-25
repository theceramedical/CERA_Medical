'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLayoutEffect, useRef } from 'react';

import type { ReactNode } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function HomeMotion({ children }: { readonly children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scope = root.current;
    if (scope === null) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((section) => {
        const cards = section.querySelectorAll('[data-card]');
        const title = section.querySelector('[data-reveal-title]');
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
            refreshPriority: 1,
          },
        });
        if (title !== null) {
          timeline.from(title, {
            y: 28,
            opacity: 0,
            duration: 0.55,
            ease: 'power2.out',
          });
        }
        if (cards.length > 0) {
          timeline.from(
            cards,
            { y: 36, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' },
            '-=0.25',
          );
        }
      });
    }, scope);
    return () => context.revert();
  }, []);

  return <div ref={root}>{children}</div>;
}
