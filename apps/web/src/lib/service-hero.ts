import type { LayoutBlock } from '../components/cms-content-page.tsx';

export interface ServiceHeroContent {
  readonly eyebrow?: string;
  readonly badges: readonly string[];
  readonly noticeTitle?: string;
  readonly noticeBody?: string;
}

const DEFAULTS: Record<string, ServiceHeroContent> = {
  'preclinical-studies': {
    eyebrow: 'Research service line · ethical scoping validated',
    badges: [
      'Institutional animal ethics approval required',
      'BSL-2 validated',
      'Rigorous quality directives',
      'GLP aligned',
    ],
    noticeTitle: 'Research notice and scope',
    noticeBody:
      'These are research services, not clinical care. We establish whether a candidate treatment is safe and effective before it reaches human trials.',
  },
  'molecular-research': {
    eyebrow: 'Laboratory service line · validated assays',
    badges: [
      'Coded human samples only',
      'Documented chain of custody',
      'Method validation on request',
    ],
    noticeTitle: 'Research samples',
    noticeBody:
      'Human-derived samples must be coded and supplied without direct identifiers, with ethical approval and donor consent in place.',
  },
  'metagenomic-data-analysis': {
    eyebrow: 'Bioinformatics service line · sequencing workflows',
    badges: ['De-identified metadata', 'Reproducible pipeline documentation', 'QC at every stage'],
    noticeTitle: 'Data handling',
    noticeBody:
      'Human genetic reads from human samples are removed during quality control and are not analysed for any other purpose.',
  },
  'biomedical-omics-data-analysis': {
    eyebrow: 'Computational service line · clinical and omics data',
    badges: ['De-identified by default', 'Validation plan in scope', 'Traceable parameters'],
    noticeTitle: 'Regulated data',
    noticeBody:
      'Supply de-identified data unless a data-sharing agreement has been agreed before transfer.',
  },
  'evidence-synthesis-technical-reports': {
    eyebrow: 'Evidence service line · decision-ready reporting',
    badges: ['PRISMA-aligned workflows', 'GRADE where applicable', 'Client-owned outputs'],
    noticeTitle: 'Programme and survey data',
    noticeBody:
      'Health, clinical, survey and programme datasets should be de-identified unless a data-sharing agreement is in place.',
  },
};

function seededHero(slug: keyof typeof DEFAULTS): ServiceHeroContent {
  const hero = DEFAULTS[slug];
  if (hero === undefined) {
    throw new Error(`Missing service hero defaults for ${slug}`);
  }
  return hero;
}

const LABORATORY_HERO = seededHero('molecular-research');
const BIOINFORMATICS_HERO = seededHero('metagenomic-data-analysis');
const EVIDENCE_HERO = seededHero('evidence-synthesis-technical-reports');

/** Vendure collection slug → flagship hero copy for new catalogue services. */
const CATEGORY_DEFAULTS: Record<string, ServiceHeroContent> = {
  'laboratory-research': LABORATORY_HERO,
  bioinformatics: BIOINFORMATICS_HERO,
  'evidence-reporting': EVIDENCE_HERO,
};

function fallbackHero(slug: string, categorySlug: string | undefined): ServiceHeroContent {
  const bySlug = DEFAULTS[slug];
  if (bySlug !== undefined) return bySlug;
  if (categorySlug !== undefined) {
    const byCategory = CATEGORY_DEFAULTS[categorySlug];
    if (byCategory !== undefined) return byCategory;
  }
  // New catalogue rows often ship before a collection filter is set in Vendure.
  return LABORATORY_HERO;
}

function blockField(block: LayoutBlock, key: string): string | undefined {
  const value = block[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function badgeLabelsFromBlock(hero: LayoutBlock): readonly string[] {
  const badgesRaw = hero.badges;
  if (!Array.isArray(badgesRaw)) return [];
  return badgesRaw
    .map((row) => {
      if (row === null || typeof row !== 'object') return null;
      const label = (row as { label?: unknown }).label;
      return typeof label === 'string' && label.length > 0 ? label : null;
    })
    .filter((item): item is string => item !== null);
}

function heroBlockIsEmpty(hero: LayoutBlock): boolean {
  return (
    blockField(hero, 'eyebrow') === undefined &&
    blockField(hero, 'noticeTitle') === undefined &&
    blockField(hero, 'noticeBody') === undefined &&
    badgeLabelsFromBlock(hero).length === 0
  );
}

export function serviceHeroFromLayout(
  slug: string,
  layout: unknown,
  categorySlug?: string | null,
): ServiceHeroContent {
  const defaults = fallbackHero(slug, categorySlug ?? undefined);
  const blocks = Array.isArray(layout) ? (layout as LayoutBlock[]) : [];
  const hero = blocks.find((block) => block.blockType === 'serviceHero');
  if (hero === undefined || heroBlockIsEmpty(hero)) return defaults;

  const badges = badgeLabelsFromBlock(hero);

  const eyebrow = blockField(hero, 'eyebrow') ?? defaults.eyebrow;
  const noticeTitle = blockField(hero, 'noticeTitle') ?? defaults.noticeTitle;
  const noticeBody = blockField(hero, 'noticeBody') ?? defaults.noticeBody;
  return {
    ...(eyebrow !== undefined ? { eyebrow } : {}),
    badges: badges.length > 0 ? badges : defaults.badges,
    ...(noticeTitle !== undefined ? { noticeTitle } : {}),
    ...(noticeBody !== undefined ? { noticeBody } : {}),
  };
}
