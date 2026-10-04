import type { LayoutBlock } from '../components/cms-content-page.tsx';

export interface ServicesCatalogueLabels {
  readonly searchLabel: string;
  readonly applyLabel: string;
  readonly emptyHeading: string;
  readonly emptyDescription: string;
  readonly degradedAlert: string;
}

const DEFAULTS: ServicesCatalogueLabels = {
  searchLabel: 'Search services',
  applyLabel: 'Apply',
  emptyHeading: 'No services match those filters',
  emptyDescription: 'Clear the search or browse the full list of research services.',
  degradedAlert: 'Live catalogue data is temporarily unavailable. Showing the last known services.',
};

function stringField(block: LayoutBlock, key: string, fallback: string): string {
  const value = block[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

export function servicesCatalogueFromLayout(layout: unknown): ServicesCatalogueLabels {
  const blocks = Array.isArray(layout) ? (layout as LayoutBlock[]) : [];
  const block = blocks.find((item) => item.blockType === 'servicesCatalogue');
  if (block === undefined) return DEFAULTS;
  return {
    searchLabel: stringField(block, 'searchLabel', DEFAULTS.searchLabel),
    applyLabel: stringField(block, 'applyLabel', DEFAULTS.applyLabel),
    emptyHeading: stringField(block, 'emptyHeading', DEFAULTS.emptyHeading),
    emptyDescription: stringField(block, 'emptyDescription', DEFAULTS.emptyDescription),
    degradedAlert: stringField(block, 'degradedAlert', DEFAULTS.degradedAlert),
  };
}

export function layoutBlocksWithoutServicesChrome(layout: unknown): readonly LayoutBlock[] {
  const blocks = Array.isArray(layout) ? (layout as LayoutBlock[]) : [];
  return blocks.filter(
    (block) => block.blockType !== 'sectionHeading' && block.blockType !== 'servicesCatalogue',
  );
}
