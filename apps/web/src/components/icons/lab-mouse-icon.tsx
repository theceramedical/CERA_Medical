import type { SVGProps } from 'react';

/**
 * Laboratory research mouse (Mus musculus) icon.
 * Represents in vivo animal model research, preclinical animal house studies,
 * and rodent laboratory workflows (NOT a computer peripheral).
 */
export function LabMouseIcon({
  size = 20,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { readonly size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Curved mouse back, snout and chin */}
      <path d="M4 16.5c-.8-.6-1.5-1.5-1.5-2.5 0-1.8 1.4-3.2 3.2-3.5 1.5-.2 2.8-.8 3.8-1.8l1-1c1.2-1.2 3.2-1.2 4.4 0 .6.6 1.4 1 2.3 1.1 2.5.3 4.3 2.4 4.3 4.9 0 2.8-2.2 4.8-5 4.8H7c-1.2 0-2.2-.6-3-1.5z" />
      {/* Laboratory mouse rounded ear */}
      <path d="M12.5 8.5c-.5-1.5-.2-3 1-3.8 1.3-.9 3-.4 3.5 1 .3.8.1 1.7-.5 2.3" />
      {/* Eye */}
      <circle cx="18" cy="13" r="0.75" fill="currentColor" stroke="none" />
      {/* Delicate whiskers */}
      <path d="M19.5 14.5l2.5.5M19.5 15.5l2 1.5" />
      {/* Paw / base accents */}
      <path d="M8 19.5v-1.5M13 19.5v-1.5" />
      {/* Graceful slender tail */}
      <path d="M2.5 14c-1-1.5-1-3.5 0-5 1.2-1.8 1.8-3.5 1-5" />
    </svg>
  );
}
