import { cn } from './cn.ts';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { ElementType, ReactElement } from 'react';

/**
 * The four social marks in the footer's "Stay Connected" column (design-language.md section 5.9).
 *
 * **Why these are hand-drawn rather than imported.** `lucide-react` is the design system's only icon
 * set, and version 1.x removed every brand glyph - `Linkedin`, `Facebook`, `Instagram`, `Youtube`
 * and the rest are simply gone, along with the deprecated aliases. Nothing in the remaining 3,698
 * icons substitutes: a `Share2` or `Globe` in place of a recognisable mark leaves the user guessing
 * which platform a link goes to, and the visually hidden name is no help to a sighted user scanning
 * a row of four identical circles.
 *
 * So the marks are inline paths, in the same spirit as the wordmark: simplified, monochrome, drawn
 * from `currentColor`. They are deliberately generic silhouettes rather than traces of the official
 * brand assets, which carry trademark usage terms that a simplified monochrome glyph in a footer link
 * does not engage.
 *
 * Every mark is `aria-hidden`. `SocialLink` supplies the name, and it is the full phrase
 * ("CERA Medical on LinkedIn") rather than the bare platform, because a link list reading
 * "LinkedIn, Facebook, Instagram, YouTube" says nothing about whose accounts they are.
 */

export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'youtube';

const PLATFORM_NAME: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export interface SocialMarkProps {
  readonly platform: SocialPlatform;
  readonly className?: string;
}

export function SocialMark({ platform, className }: SocialMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      // See `CrossAndLeaf`: Edge in IE mode still honours the legacy behaviour that makes an SVG a
      // tab stop, and the symptom is a tab stop that announces nothing.
      focusable="false"
      aria-hidden="true"
      className={cn('size-5 shrink-0', className)}
    >
      {PLATFORM_PATH[platform]}
    </svg>
  );
}

const PLATFORM_PATH: Record<SocialPlatform, ReactElement> = {
  linkedin: (
    <path d="M4.5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3 9h3v12H3V9Zm5.5 0h2.9v1.7h.05c.5-.95 1.7-1.95 3.5-1.95 2.75 0 3.55 1.8 3.55 4.4V21h-3v-6.4c0-1.5-.55-2.45-1.85-2.45-1.1 0-1.75.75-2.05 1.5-.1.25-.1.6-.1.95V21h-3V9Z" />
  ),
  facebook: (
    <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.85.25-1.45 1.5-1.45h1.65V3.95c-.3-.05-1.3-.15-2.45-.15-2.45 0-4.1 1.45-4.1 4.15V10H7.4v3h2.2v8h3.9Z" />
  ),
  instagram: (
    // Three shapes rather than one path: the rounded square, the lens, and the corner dot. A single
    // path with holes would need fill-rule juggling for no benefit.
    <>
      <path
        fillRule="evenodd"
        d="M8 2.5h8A5.5 5.5 0 0 1 21.5 8v8A5.5 5.5 0 0 1 16 21.5H8A5.5 5.5 0 0 1 2.5 16V8A5.5 5.5 0 0 1 8 2.5Zm0 2A3.5 3.5 0 0 0 4.5 8v8A3.5 3.5 0 0 0 8 19.5h8a3.5 3.5 0 0 0 3.5-3.5V8A3.5 3.5 0 0 0 16 4.5H8Z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm0 2a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
        clipRule="evenodd"
      />
      <circle cx="17" cy="7" r="1.1" />
    </>
  ),
  youtube: (
    <path d="M21.6 7.2a2.6 2.6 0 0 0-1.85-1.85C18.1 4.9 12 4.9 12 4.9s-6.1 0-7.75.45A2.6 2.6 0 0 0 2.4 7.2C2 8.85 2 12 2 12s0 3.15.4 4.8a2.6 2.6 0 0 0 1.85 1.85C5.9 19.1 12 19.1 12 19.1s6.1 0 7.75-.45a2.6 2.6 0 0 0 1.85-1.85C22 15.15 22 12 22 12s0-3.15-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z" />
  ),
};

export interface SocialLinkProps {
  readonly platform: SocialPlatform;
  readonly href: string;
  /** Whose account it is. Combined with the platform to form the link's accessible name. */
  readonly accountName?: string;
  /** The link component. Always an external URL in practice, so `a` is the sensible default. */
  readonly as?: ElementType;
  readonly className?: string;
}

/**
 * A 32px icon-only link, per section 5.9.
 *
 * The visible glyph is 20px inside a 44px target: the reference draws a 32px button, which is below
 * the 44px the design contract commits to for anything touch-reachable, and four links this close
 * together is precisely the case where an undersized target causes a mis-tap. The padding grows the
 * target without changing the drawn size.
 *
 * `rel="noopener noreferrer"` and `target="_blank"` per section 5.9. `noopener` is the one that
 * matters: without it the opened page gets a `window.opener` handle back to this one and can
 * navigate it somewhere else.
 */
export function SocialLink({
  platform,
  href,
  accountName = 'CERA Medical',
  as: Component = 'a',
  className,
}: SocialLinkProps) {
  return (
    <Component
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-pill',
        'text-primary transition-colors duration-fast ease-standard hover:bg-primary-50 hover:text-primary-hover',
        className,
      )}
    >
      <SocialMark platform={platform} />
      {/* The name says whose account it is and that it opens elsewhere. "LinkedIn" alone leaves the
          user with four links whose destinations are a guess. */}
      <VisuallyHidden>{`${accountName} on ${PLATFORM_NAME[platform]} (opens in a new tab)`}</VisuallyHidden>
    </Component>
  );
}

export { PLATFORM_NAME };
