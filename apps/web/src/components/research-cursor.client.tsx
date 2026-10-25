'use client';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

function intentFor(target: EventTarget | null): string {
  if (!(target instanceof Element)) return '';
  const control = target.closest('a, button');
  if (!(control instanceof HTMLElement)) return '';
  const marked = control.dataset.cursor;
  if (marked !== undefined && marked.length > 0) return marked;
  const href = control.getAttribute('href') ?? '';
  if (href.includes('preclinical') || href.includes('/projects')) return 'Mouse research';
  if (href.includes('enquiry') || href.includes('/contact')) return 'Make an enquiry';
  if (href.includes('/products')) return 'Research products';
  if (href.includes('/services')) return 'Laboratory services';
  return 'Open';
}

export function ResearchCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = cursor.current;
    if (node === null) return undefined;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return undefined;

    const xTo = gsap.quickTo(node, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(node, 'y', { duration: 0.35, ease: 'power3.out' });
    const label = node.querySelector('span');

    const move = (event: PointerEvent) => {
      xTo(event.clientX);
      yTo(event.clientY);
      const next = intentFor(event.target);
      if (label !== null) label.textContent = next;
      gsap.to(node, {
        opacity: next.length > 0 ? 1 : 0,
        scale: next.length > 0 ? 1 : 0.6,
        duration: 0.2,
      });
    };

    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div
      ref={cursor}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-50 hidden -translate-x-1/2 -translate-y-4 opacity-0 mix-blend-normal md:block"
    >
      <span className="block rounded-full bg-primary-800 px-3 py-1 text-caption font-semibold whitespace-nowrap text-on-primary shadow-md" />
    </div>
  );
}
