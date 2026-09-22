import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts, last one winning.
 *
 * `clsx` handles the conditional forms; `twMerge` is the part that matters. Without it,
 * `cn('px-4', className)` where the caller passes `px-6` emits both, and which one applies
 * depends on their order in the generated stylesheet rather than on the call - so a
 * component's own default silently beats the override at one breakpoint and loses at
 * another. `twMerge` understands that `px-4` and `px-6` are the same property and drops
 * the earlier one.
 *
 * Every component in this package composes its classes through here for that reason: it is
 * what makes `className` a reliable escape hatch rather than a coin flip.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
