import { constrainedEditor } from '../lib/editor.ts';

import type { Block } from 'payload';

/**
 * Blocks that map one-to-one onto Phase 03/04 components.
 *
 * A block the public renderer does not implement is a block an editor will use
 * on launch day. These five plus rich text are the homepage and every interior
 * page; Phase 07 adds nothing to this list without adding a component first.
 */

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'eyebrow', type: 'text', required: true, maxLength: 80 },
    { name: 'headlinePrimary', type: 'text', required: true, maxLength: 120 },
    { name: 'headlineAccent', type: 'text', required: true, maxLength: 120 },
    { name: 'body', type: 'textarea', required: true, maxLength: 400 },
    { name: 'primaryHref', type: 'text', required: true, defaultValue: '/services' },
    { name: 'primaryLabel', type: 'text', required: true, defaultValue: 'Explore Services' },
    { name: 'secondaryHref', type: 'text', required: true, defaultValue: '/enquiry' },
    { name: 'secondaryLabel', type: 'text', required: true, defaultValue: 'Make an Enquiry' },
    { name: 'portrait', type: 'relationship', relationTo: 'media' },
    { name: 'badgeTitle', type: 'text', maxLength: 80 },
    { name: 'badgeBody', type: 'text', maxLength: 160 },
  ],
};

export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Rich text', plural: 'Rich text' },
  fields: [{ name: 'content', type: 'richText', required: true, editor: constrainedEditor() }],
};

export const CtaBandBlock: Block = {
  slug: 'ctaBand',
  labels: { singular: 'CTA band', plural: 'CTA bands' },
  fields: [
    { name: 'headline', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'text', maxLength: 240 },
    { name: 'href', type: 'text', required: true, defaultValue: '/enquiry' },
    { name: 'label', type: 'text', required: true, defaultValue: 'Make an Enquiry' },
  ],
};

export const layoutBlocks: Block[] = [HeroBlock, RichTextBlock, CtaBandBlock];
