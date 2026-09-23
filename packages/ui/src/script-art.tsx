/**
 * The two handwritten phrases in the reference: "Care Support Wellness For a Brighter Tomorrow"
 * overlaying the hero portrait, and "Your Health Matters" with a heart outline in the CTA band.
 *
 * design-language.md section 2 is explicit that these are **decorative artwork, not text**, and the
 * consequences of that ruling are the whole design of this file:
 *
 *   - **No third font.** Setting them in a script typeface would mean loading a family used on two
 *     elements, which is a font file, a render-blocking fetch, and a layout shift for ornament. The
 *     phrases are drawn as paths, so the cost is a few hundred bytes of inline SVG.
 *   - **`aria-hidden`, with no option.** Neither phrase adds information. "Care Support Wellness For
 *     a Brighter Tomorrow" announced in the middle of the hero, between the headline and the
 *     buttons, is an interruption made of marketing copy. The words are also unreadable as speech in
 *     the order they are drawn.
 *   - **No `<title>`, no `role="img"`.** Both would put it back in the accessibility tree.
 *
 * The paths are a stylised approximation rather than a trace of the reference's exact lettering. A
 * faithful trace would need the original artwork, which is not available; this reads as handwriting
 * at the sizes it is used and carries no meaning that could be wrong.
 */

import { cn } from './cn.ts';

export interface ScriptArtProps {
  readonly className?: string;
}

/**
 * The hero overlay.
 *
 * `currentColor` for the stroke so the caller's text colour drives it - over the portrait it is
 * white, and over a light band it would be teal. `stroke-linecap="round"` throughout, because a
 * butt cap is what makes drawn handwriting look like a technical diagram.
 */
export function HeroScript({ className }: ScriptArtProps) {
  return (
    <svg
      viewBox="0 0 320 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
      className={cn('h-auto w-full', className)}
    >
      {/* "Care" */}
      <path d="M12 44c-6-9 2-19 11-17 5 1 7 6 6 11" />
      <path d="M30 38c-7 2-11 7-10 12 1 4 6 5 9 2s5-8 5-12c0 5 1 10 5 11" />
      <path d="M48 34c0 5-1 10-1 15m0-11c2-5 6-7 9-6" />
      <path d="M62 38c5-1 9 0 10 3s-4 5-9 5c1 4 5 6 9 4" />

      {/* "Support" */}
      <path d="M92 30c-5-3-12-1-12 4s10 5 11 10-6 8-12 5" />
      <path d="M104 40c-4 0-7 3-7 8s3 8 7 8 7-3 7-8-3-8-7-8Z" />
      <path d="M118 40v22m0-14c1-5 5-8 9-7s6 6 4 11-7 7-11 4" />
      <path d="M140 40c-4 0-7 3-7 8s3 8 7 8 7-3 7-8" />
      <path d="M154 38v14c0 4 3 6 6 5" />
      <path d="M150 42h10" />
      <path d="M168 40c0 6 0 11 1 15m-1-11c1-4 4-6 7-5" />

      {/* "Wellness" */}
      <path d="M16 86l6 20 7-16 6 16 7-20" />
      <path d="M50 96c5-1 9 0 10 3s-4 5-9 5c1 4 5 6 9 4" />
      <path d="M68 82v20c0 3 2 5 5 4" />
      <path d="M80 82v20c0 3 2 5 5 4" />
      <path d="M94 104V92m0 5c2-4 6-6 9-4s3 7 3 11" />
      <path d="M118 96c5-1 9 0 10 3s-4 5-9 5c1 4 5 6 9 4" />
      <path d="M140 100c-4-2-8-1-8 2s7 2 7 5-4 4-8 2" />
      <path d="M152 100c-4-2-8-1-8 2s7 2 7 5-4 4-8 2" />

      {/* "For a Brighter Tomorrow", trailing off as it does in the reference */}
      <path d="M176 88v18m0-18h11m-11 9h8" />
      <path d="M200 92c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7Z" />
      <path d="M220 98c-4-1-8 1-8 4s4 4 7 2 4-5 4-8c0 4 1 7 4 8" />
      <path d="M240 84v22m0-12c2-4 7-5 10-2s2 9-2 11-7 1-8-1" />
      <path d="M262 94v12m0-8c1-3 4-5 6-4" />
      <path d="M278 98c4-1 8 0 8 3s-3 4-7 4c1 3 4 5 7 3" />
      <path d="M298 84v18c0 3 2 4 5 3" />
      <path d="M294 92h9" />
    </svg>
  );
}

/**
 * The CTA band's phrase, with the heart outline from the reference.
 *
 * Hidden below `lg` by the caller rather than here: whether it fits is a layout question, and a
 * component that hid itself at a breakpoint would be surprising in any other layout.
 */
export function CtaScript({ className }: ScriptArtProps) {
  return (
    <svg
      viewBox="0 0 220 96"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden="true"
      className={cn('h-auto w-full', className)}
    >
      {/* "Your" */}
      <path d="M10 30l7 11 8-11" />
      <path d="M17 41v14" />
      <path d="M38 38c-4 0-7 3-7 8s3 8 7 8 7-3 7-8-3-8-7-8Z" />
      <path d="M54 38v16m0-10c1-4 5-6 8-5" />
      <path d="M70 38v10c0 4 3 6 6 5s5-5 5-9v-6m0 16c0 6-3 9-8 9" />

      {/* "Health" */}
      <path d="M100 26v30m0-16h12m0-14v30" />
      <path d="M124 46c5-1 9 0 10 3s-4 5-9 5c1 4 5 6 9 4" />
      <path d="M146 40c-4 0-7 3-7 7s4 6 7 4 4-6 4-10c0 5 1 9 4 10" />
      <path d="M162 26v25c0 3 2 5 5 4" />
      <path d="M176 26v30m0-14c1-4 5-6 8-4s3 7 3 12" />

      {/* "Matters", dropping to a second line as in the reference */}
      <path d="M22 72v18m0-18l7 12 7-12v18" />
      <path d="M52 80c-4 0-7 3-7 7s4 6 7 4 4-6 4-9c0 4 1 8 4 9" />
      <path d="M72 72v14c0 3 2 5 5 4" />
      <path d="M68 78h9" />
      <path d="M90 72v14c0 3 2 5 5 4" />
      <path d="M86 78h9" />
      <path d="M104 84c5-1 9 0 10 3s-4 5-9 5c1 4 5 6 9 4" />
      <path d="M126 90V80m0 4c1-3 4-5 6-4" />
      <path d="M146 82c-4-2-8-1-8 2s7 2 7 5-4 4-8 2" />

      {/* The heart. Two arcs meeting at a point, drawn as one path so the join is clean. */}
      <path d="M186 90c-9-6-16-12-16-19a9 9 0 0 1 16-5 9 9 0 0 1 16 5c0 7-7 13-16 19Z" />
    </svg>
  );
}
