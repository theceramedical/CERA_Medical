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

function blockField(block: LayoutBlock, key: string): string | undefined {
  const value = block[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

export function serviceHeroFromLayout(slug: string, layout: unknown): ServiceHeroContent {
  const defaults = DEFAULTS[slug] ?? { badges: [] };
  const blocks = Array.isArray(layout) ? (layout as LayoutBlock[]) : [];
  const hero = blocks.find((block) => block.blockType === 'serviceHero');
  if (hero === undefined) return defaults;

  const badgesRaw = hero.badges;
  const badges = Array.isArray(badgesRaw)
    ? badgesRaw
        .map((row) => {
          if (row === null || typeof row !== 'object') return null;
          const label = (row as { label?: unknown }).label;
          return typeof label === 'string' && label.length > 0 ? label : null;
        })
        .filter((item): item is string => item !== null)
    : defaults.badges;

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
