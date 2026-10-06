import { constrainedEditor } from '../lib/editor.ts';

import type { Block, Field } from 'payload';

/** Same block shape as pages layout, but tables FK to service_presentations (not pages). */
function servicePresentationBlock(block: Block, dbName: string): Block {
  return { ...block, dbName };
}

function remapArrayDbName(field: Field, name: string, dbName: string): Field {
  if (field.type !== 'array' || field.name !== name) {
    return field;
  }
  return { ...field, dbName };
}

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
    {
      name: 'trustItems',
      type: 'array',
      maxRows: 6,
      fields: [{ name: 'label', type: 'text', required: true, maxLength: 80 }],
    },
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

export const SectionHeadingBlock: Block = {
  slug: 'sectionHeading',
  labels: { singular: 'Section heading', plural: 'Section headings' },
  fields: [
    { name: 'eyebrow', type: 'text', maxLength: 80 },
    { name: 'heading', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    {
      name: 'badges',
      type: 'array',
      maxRows: 8,
      fields: [{ name: 'label', type: 'text', required: true, maxLength: 120 }],
    },
  ],
};

export const ServicesCatalogueBlock: Block = {
  slug: 'servicesCatalogue',
  labels: { singular: 'Services catalogue', plural: 'Services catalogues' },
  fields: [
    { name: 'searchLabel', type: 'text', defaultValue: 'Search services', maxLength: 80 },
    { name: 'applyLabel', type: 'text', defaultValue: 'Apply', maxLength: 40 },
    {
      name: 'emptyHeading',
      type: 'text',
      defaultValue: 'No services match those filters',
      maxLength: 120,
    },
    {
      name: 'emptyDescription',
      type: 'textarea',
      defaultValue: 'Clear the search or browse the full list of research services.',
      maxLength: 300,
    },
    {
      name: 'degradedAlert',
      type: 'textarea',
      defaultValue:
        'Live catalogue data is temporarily unavailable. Showing the last known services.',
      maxLength: 300,
    },
  ],
};

const sectionToneField = {
  name: 'tone',
  type: 'select' as const,
  defaultValue: 'surface',
  options: [
    { label: 'White', value: 'surface' },
    { label: 'Light tint', value: 'surface-tint' },
    { label: 'Secondary tint', value: 'surface-tint-2' },
  ],
};

export const FeatureGridBlock: Block = {
  slug: 'featureGrid',
  dbName: 'feat_grid',
  labels: { singular: 'Feature grid', plural: 'Feature grids' },
  fields: [
    { name: 'eyebrow', type: 'text', maxLength: 80 },
    { name: 'heading', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    sectionToneField,
    {
      name: 'centered',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Centre the section heading (audience-style bands).' },
    },
    {
      name: 'features',
      type: 'array',
      dbName: 'feat',
      required: true,
      minRows: 1,
      maxRows: 12,
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 120 },
        { name: 'description', type: 'textarea', required: true, maxLength: 600 },
        { name: 'href', type: 'text', maxLength: 300 },
        { name: 'linkLabel', type: 'text', maxLength: 80 },
        {
          name: 'highlights',
          type: 'array',
          dbName: 'hl',
          maxRows: 8,
          fields: [{ name: 'text', type: 'text', required: true, maxLength: 200 }],
        },
      ],
    },
  ],
};

export const ProcessStepsBlock: Block = {
  slug: 'processSteps',
  dbName: 'proc_steps',
  labels: { singular: 'Process steps', plural: 'Process steps' },
  fields: [
    { name: 'eyebrow', type: 'text', maxLength: 80 },
    { name: 'heading', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    sectionToneField,
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Two-column grid', value: 'grid' },
        { label: 'Vertical timeline', value: 'timeline' },
        { label: 'Numbered cards', value: 'numbered' },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 10,
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 120 },
        { name: 'description', type: 'textarea', required: true, maxLength: 600 },
      ],
    },
  ],
};

export const StatisticsBlock: Block = {
  slug: 'statistics',
  labels: { singular: 'Statistics', plural: 'Statistics' },
  fields: [
    { name: 'heading', type: 'text', maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'value', type: 'text', required: true, maxLength: 32 },
        { name: 'label', type: 'text', required: true, maxLength: 100 },
        { name: 'detail', type: 'text', maxLength: 180 },
      ],
    },
  ],
};

export const ServicesShowcaseBlock: Block = {
  slug: 'servicesShowcase',
  labels: { singular: 'Services showcase', plural: 'Services showcases' },
  fields: [
    { name: 'heading', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    { name: 'viewAllHref', type: 'text', defaultValue: '/services', maxLength: 300 },
    { name: 'viewAllLabel', type: 'text', defaultValue: 'View All Services', maxLength: 80 },
  ],
};

export const ArticlesPreviewBlock: Block = {
  slug: 'articlesPreview',
  labels: { singular: 'Articles preview', plural: 'Articles previews' },
  fields: [
    { name: 'heading', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    { name: 'viewAllHref', type: 'text', defaultValue: '/articles', maxLength: 300 },
    { name: 'viewAllLabel', type: 'text', defaultValue: 'View All Articles', maxLength: 80 },
    { name: 'maxPosts', type: 'number', defaultValue: 3, min: 1, max: 6 },
  ],
};

export const FaqListBlock: Block = {
  slug: 'faqList',
  labels: { singular: 'FAQ list', plural: 'FAQ lists' },
  fields: [
    { name: 'eyebrow', type: 'text', maxLength: 80 },
    { name: 'heading', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    { name: 'linkHref', type: 'text', defaultValue: '/faqs', maxLength: 300 },
    { name: 'linkLabel', type: 'text', defaultValue: 'All FAQs', maxLength: 80 },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 12,
      fields: [
        { name: 'question', type: 'text', required: true, maxLength: 200 },
        { name: 'answer', type: 'textarea', required: true, maxLength: 1200 },
      ],
    },
  ],
};

export const CalloutBandBlock: Block = {
  slug: 'calloutBand',
  labels: { singular: 'Callout band', plural: 'Callout bands' },
  fields: [
    { name: 'eyebrow', type: 'text', maxLength: 120 },
    { name: 'heading', type: 'text', required: true, maxLength: 200 },
    { name: 'body', type: 'textarea', maxLength: 600 },
  ],
};

/** Service detail hero metadata (Stitch service pages). */
export const ServiceHeroBlock: Block = {
  slug: 'serviceHero',
  dbName: 'svc_hero',
  labels: { singular: 'Service hero', plural: 'Service heroes' },
  fields: [
    { name: 'eyebrow', type: 'text', maxLength: 120 },
    {
      name: 'badges',
      type: 'array',
      maxRows: 8,
      fields: [{ name: 'label', type: 'text', required: true, maxLength: 120 }],
    },
    { name: 'noticeTitle', type: 'text', maxLength: 120 },
    { name: 'noticeBody', type: 'textarea', maxLength: 500 },
  ],
};

export const KeyValueListBlock: Block = {
  slug: 'keyValueList',
  dbName: 'kv_list',
  labels: { singular: 'Specification list', plural: 'Specification lists' },
  fields: [
    { name: 'heading', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 400 },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 20,
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 200 },
        { name: 'detail', type: 'text', maxLength: 200 },
      ],
    },
  ],
};

/** Sticky sidebar enquiry card on service (product) pages. */
export const ServiceEnquiryAsideBlock: Block = {
  slug: 'serviceEnquiryAside',
  dbName: 'enq_aside',
  labels: { singular: 'Enquiry sidebar', plural: 'Enquiry sidebars' },
  fields: [
    { name: 'eyebrow', type: 'text', maxLength: 80, defaultValue: 'Project inquiry' },
    { name: 'title', type: 'text', maxLength: 160, defaultValue: 'Start a project conversation' },
    { name: 'body', type: 'textarea', maxLength: 600 },
    { name: 'buttonLabel', type: 'text', maxLength: 80, defaultValue: 'Request this service' },
    {
      name: 'trustItems',
      type: 'array',
      dbName: 'trust',
      maxRows: 8,
      fields: [{ name: 'label', type: 'text', required: true, maxLength: 160 }],
    },
  ],
};

export const ServiceSidebarCardBlock: Block = {
  slug: 'serviceSidebarCard',
  dbName: 'side_card',
  labels: { singular: 'Sidebar card', plural: 'Sidebar cards' },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    { name: 'body', type: 'textarea', maxLength: 800 },
    {
      name: 'items',
      type: 'array',
      maxRows: 12,
      fields: [
        { name: 'label', type: 'text', required: true, maxLength: 120 },
        { name: 'detail', type: 'textarea', maxLength: 400 },
      ],
    },
    {
      name: 'bullets',
      type: 'array',
      maxRows: 12,
      fields: [{ name: 'text', type: 'text', required: true, maxLength: 200 }],
    },
  ],
};

/** Feature grid for service presentations — nested arrays must not reuse pages `feat` / `hl`. */
const SpFeatureGridBlock: Block = {
  ...FeatureGridBlock,
  dbName: 'sp_fgrid',
  fields: FeatureGridBlock.fields.map((field) => {
    if (field.type === 'array' && field.name === 'features') {
      return {
        ...field,
        dbName: 'sp_feat',
        fields: field.fields.map((nested) =>
          nested.type === 'array' && nested.name === 'highlights'
            ? { ...nested, dbName: 'sp_hl' }
            : nested,
        ),
      };
    }
    return field;
  }),
};

/** Enquiry aside for service presentations — must not reuse pages `trust` table. */
const SpServiceEnquiryAsideBlock: Block = {
  ...ServiceEnquiryAsideBlock,
  dbName: 'sp_enq',
  fields: ServiceEnquiryAsideBlock.fields.map((field) =>
    remapArrayDbName(field, 'trustItems', 'sp_trust'),
  ),
};

/** Blocks allowed on service presentations (Vendure catalogue product pages). */
export const servicePresentationBlocks: Block[] = [
  servicePresentationBlock(ServiceHeroBlock, 'sp_hero'),
  SectionHeadingBlock,
  RichTextBlock,
  SpFeatureGridBlock,
  servicePresentationBlock(ProcessStepsBlock, 'sp_steps'),
  servicePresentationBlock(KeyValueListBlock, 'sp_kv'),
  CalloutBandBlock,
  CtaBandBlock,
  FaqListBlock,
  SpServiceEnquiryAsideBlock,
  servicePresentationBlock(ServiceSidebarCardBlock, 'sp_side'),
];

export const layoutBlocks: Block[] = [
  HeroBlock,
  SectionHeadingBlock,
  ServicesCatalogueBlock,
  FeatureGridBlock,
  ProcessStepsBlock,
  StatisticsBlock,
  ServicesShowcaseBlock,
  ArticlesPreviewBlock,
  FaqListBlock,
  CalloutBandBlock,
  RichTextBlock,
  CtaBandBlock,
  ServiceHeroBlock,
  KeyValueListBlock,
  ServiceEnquiryAsideBlock,
  ServiceSidebarCardBlock,
];
