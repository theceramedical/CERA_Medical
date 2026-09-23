import { cn } from './cn.ts';

/**
 * Two rules that look similar and mean different things.
 *
 * `Divider` separates content. It is a real `<hr>`, which carries `role="separator"` for free, so a
 * screen reader announces the break rather than reading two unrelated sections as continuous prose.
 *
 * `SectionRule` is the 40px teal mark above a section heading (design-language.md section 5.7). It
 * is ornament - it says "a heading follows", which the heading already says - so it is
 * `aria-hidden` and is not an `<hr>`. Announcing a separator before every section heading is noise.
 *
 * They are in one file precisely because the distinction is easy to collapse by accident: whoever
 * reaches for one should see the other and have to choose.
 */

export interface DividerProps {
  readonly className?: string;
  /** Hides the rule from assistive tech, for when it repeats a boundary the markup already has. */
  readonly decorative?: boolean;
}

export function Divider({ className, decorative = false }: DividerProps) {
  return (
    <hr
      // `border-0` plus a border on one side, rather than `height: 1px` with a background: an `hr`
      // with a background colour renders as a 2px double line in some default stylesheets.
      className={cn('w-full border-0 border-t border-border', className)}
      aria-hidden={decorative ? 'true' : undefined}
    />
  );
}

export interface SectionRuleProps {
  readonly className?: string;
}

export function SectionRule({ className }: SectionRuleProps) {
  return (
    <span
      aria-hidden="true"
      // 40x3px, `accent`. A non-text mark that conveys structure needs 3:1 against its background
      // under WCAG 1.4.11; the "section rule" pairings in contrast.test.ts pin this token against
      // both white and the process band tint.
      className={cn('block h-[3px] w-10 rounded-pill bg-accent', className)}
    />
  );
}
