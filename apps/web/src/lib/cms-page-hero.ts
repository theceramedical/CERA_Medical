import type { LayoutBlock } from '../components/cms-content-page.tsx';

export interface PageHeroFields {
  readonly eyebrow?: string;
  readonly title?: string;
  readonly lede?: string;
  readonly badges?: readonly string[];
}

export function sectionHeadingFromLayout(layout: unknown): PageHeroFields | undefined {
  const blocks = Array.isArray(layout) ? (layout as LayoutBlock[]) : [];
  const block = blocks.find((item) => item.blockType === 'sectionHeading');
  if (block === undefined) return undefined;
  const eyebrow = typeof block.eyebrow === 'string' ? block.eyebrow : undefined;
  const heading = typeof block.heading === 'string' ? block.heading : undefined;
  const body = typeof block.body === 'string' ? block.body : undefined;
  if (heading === undefined) return undefined;
  const badgesRaw = block.badges;
  const badges = Array.isArray(badgesRaw)
    ? badgesRaw
        .map((row) => {
          if (row === null || typeof row !== 'object') return null;
          const label = (row as { label?: unknown }).label;
          return typeof label === 'string' && label.length > 0 ? label : null;
        })
        .filter((item): item is string => item !== null)
    : [];
  return {
    ...(eyebrow !== undefined ? { eyebrow } : {}),
    title: heading,
    ...(body !== undefined ? { lede: body } : {}),
    ...(badges.length > 0 ? { badges } : {}),
  };
}
