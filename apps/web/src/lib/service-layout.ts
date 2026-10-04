import type { LayoutBlock } from '../components/cms-content-page.tsx';

const SIDEBAR_BLOCK_TYPES = new Set(['serviceEnquiryAside', 'serviceSidebarCard']);
const HEADER_BLOCK_TYPES = new Set(['serviceHero']);

export interface ParsedServiceLayout {
  readonly mainBlocks: readonly LayoutBlock[];
  readonly enquiryAside: LayoutBlock | null;
  readonly sidebarCards: readonly LayoutBlock[];
}

export function parseServiceLayout(layout: unknown): ParsedServiceLayout {
  const blocks = Array.isArray(layout) ? (layout as LayoutBlock[]) : [];
  const mainBlocks: LayoutBlock[] = [];
  let enquiryAside: LayoutBlock | null = null;
  const sidebarCards: LayoutBlock[] = [];

  for (const block of blocks) {
    const type = block.blockType;
    if (type === undefined || HEADER_BLOCK_TYPES.has(type)) continue;
    if (type === 'serviceEnquiryAside') {
      enquiryAside = block;
      continue;
    }
    if (type === 'serviceSidebarCard' || SIDEBAR_BLOCK_TYPES.has(type)) {
      if (type === 'serviceSidebarCard') sidebarCards.push(block);
      continue;
    }
    mainBlocks.push(block);
  }

  return { mainBlocks, enquiryAside, sidebarCards };
}
