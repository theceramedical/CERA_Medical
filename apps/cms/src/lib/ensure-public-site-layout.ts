import { homePageMarketingBlocks } from './bootstrap-home-layout.ts';

import type { Page } from '../payload-types.ts';
import type { Payload } from 'payload';

const HOME_SHELL = new Set(['hero', 'statistics', 'ctaBand']);
const MARKETING_TYPES = new Set([
  'servicesShowcase',
  'featureGrid',
  'processSteps',
  'articlesPreview',
  'faqList',
]);

interface LayoutBlock {
  blockType?: string;
  [key: string]: unknown;
}

function asLayout(layout: unknown): LayoutBlock[] {
  return Array.isArray(layout) ? (layout as LayoutBlock[]) : [];
}

/**
 * Inserts the Stitch homepage marketing stack when Payload `home` only has shell blocks.
 * Safe to run repeatedly — skips when any marketing block is already present.
 */
export async function ensureHomeMarketingLayout(payload: Payload): Promise<boolean> {
  const found = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    overrideAccess: true,
  });
  const page = found.docs[0];
  if (page === undefined) return false;

  const layout = asLayout(page.layout);
  const hasMarketing = layout.some((block) => MARKETING_TYPES.has(block.blockType ?? ''));
  if (hasMarketing) return false;

  const hero = layout.find((block) => block.blockType === 'hero');
  const statistics = layout.find((block) => block.blockType === 'statistics');
  const ctaBand = layout.find((block) => block.blockType === 'ctaBand');
  const middle = layout.filter((block) => !HOME_SHELL.has(block.blockType ?? ''));
  const nextLayout = [
    ...(hero !== undefined ? [hero] : []),
    ...(statistics !== undefined ? [statistics] : []),
    ...homePageMarketingBlocks(),
    ...middle,
    ...(ctaBand !== undefined ? [ctaBand] : []),
  ];

  await payload.update({
    collection: 'pages',
    id: page.id,
    data: { layout: nextLayout as NonNullable<Page['layout']> },
    overrideAccess: true,
  });
  return true;
}

const STITCH_RIBBON = {
  enabled: true,
  statusLabel: 'LAB ACCREDITED',
  message:
    'ISO 17025 Compliant Bio-testing & Metagenomic Workflows — Preclinical Phase Queues Open Q2',
  href: '/methodology',
  linkLabel: 'Review Protocol Standards →',
} as const;

/**
 * Turns on the status ribbon with Stitch defaults when it was left disabled from early bootstrap.
 */
export async function ensureLabAccreditedRibbon(payload: Payload): Promise<boolean> {
  const announcement = (await payload.findGlobal({
    slug: 'announcement',
    overrideAccess: true,
  })) as {
    enabled?: boolean;
    statusLabel?: string;
    message?: string;
  };

  const placeholder =
    announcement.message?.includes('confirm accreditation') === true ||
    announcement.statusLabel?.toLowerCase() === 'lab accredited';

  if (announcement.enabled === true && !placeholder) return false;

  await payload.updateGlobal({
    slug: 'announcement',
    data: STITCH_RIBBON,
    overrideAccess: true,
  });
  return true;
}
