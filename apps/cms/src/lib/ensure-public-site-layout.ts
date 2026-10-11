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

export const RESEARCH_RIBBON = {
  enabled: true,
  statusLabel: 'RESEARCH SERVICES',
  message:
    'Preclinical, molecular and data analysis projects scoped with documented methods and ethics review where required.',
  href: '/methodology',
  linkLabel: 'See how we work',
} as const;

/**
 * Replaces only the known unsafe legacy announcement or an empty bootstrap placeholder.
 * Editorial announcements, including intentionally disabled ones, remain untouched.
 */
export async function ensureResearchRibbon(payload: Payload): Promise<boolean> {
  const announcement = (await payload.findGlobal({
    slug: 'announcement',
    overrideAccess: true,
  })) as {
    enabled?: boolean;
    statusLabel?: string;
    message?: string;
  };

  const label = announcement.statusLabel?.trim().toLowerCase() ?? '';
  const message = announcement.message?.trim().toLowerCase() ?? '';
  const legacy =
    label === 'lab accredited' ||
    message.includes('iso 17025 compliant bio-testing') ||
    message.includes('confirm accreditation claims');
  const empty = label === '' && message === '';
  if (!legacy && !empty) return false;

  await payload.updateGlobal({
    slug: 'announcement',
    data: RESEARCH_RIBBON,
    overrideAccess: true,
  });
  return true;
}

const EDITORIAL_INSTRUCTION =
  /^(?:Full text for a page titled|Page title:|Effective date:|Buttons:)/;

function lexicalNodeText(node: { children?: readonly { text?: string }[] }): string {
  return (node.children ?? [])
    .map((child) => child.text ?? '')
    .join('')
    .trim();
}

/**
 * Removes client-draft instructions that were published into the privacy policy.
 * Other paragraphs stay as stored in the CMS.
 */
export async function ensurePrivacyPolicyCopy(payload: Payload): Promise<boolean> {
  const found = await payload.find({
    collection: 'policies',
    where: { slug: { equals: 'privacy-policy' } },
    limit: 1,
    overrideAccess: true,
  });
  const policy = found.docs[0] as
    | {
        id: number | string;
        body?: { root?: { children?: { children?: { text?: string }[] }[] } };
      }
    | undefined;
  const children = policy?.body?.root?.children;
  if (policy === undefined || children === undefined) return false;
  const next = children.filter((node) => !EDITORIAL_INSTRUCTION.test(lexicalNodeText(node)));
  if (next.length === children.length) return false;
  await payload.update({
    collection: 'policies',
    id: policy.id,
    data: {
      body: {
        ...policy.body,
        root: { ...policy.body?.root, children: next },
      },
    },
    overrideAccess: true,
  });
  return true;
}
