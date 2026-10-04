export function serviceHeroBootstrapBlock(slug: string) {
  const heroes: Record<
    string,
    {
      eyebrow: string;
      badges: { label: string }[];
      noticeTitle: string;
      noticeBody: string;
    }
  > = {
    'preclinical-studies': {
      eyebrow: 'Research service line · ethical scoping validated',
      badges: [
        { label: 'Institutional animal ethics approval required' },
        { label: 'BSL-2 validated' },
        { label: 'Rigorous quality directives' },
        { label: 'GLP aligned' },
      ],
      noticeTitle: 'Research notice and scope',
      noticeBody:
        'These are research services, not clinical care. We establish whether a candidate treatment is safe and effective before it reaches human trials.',
    },
    'molecular-research': {
      eyebrow: 'Laboratory service line · validated assays',
      badges: [
        { label: 'Coded human samples only' },
        { label: 'Documented chain of custody' },
        { label: 'Method validation on request' },
      ],
      noticeTitle: 'Research samples',
      noticeBody:
        'Human-derived samples must be coded and supplied without direct identifiers, with ethical approval and donor consent in place.',
    },
    'metagenomic-data-analysis': {
      eyebrow: 'Bioinformatics service line · sequencing workflows',
      badges: [
        { label: 'De-identified metadata' },
        { label: 'Reproducible pipeline documentation' },
        { label: 'QC at every stage' },
      ],
      noticeTitle: 'Data handling',
      noticeBody:
        'Human genetic reads from human samples are removed during quality control and are not analysed for any other purpose.',
    },
    'biomedical-omics-data-analysis': {
      eyebrow: 'Computational service line · clinical and omics data',
      badges: [
        { label: 'De-identified by default' },
        { label: 'Validation plan in scope' },
        { label: 'Traceable parameters' },
      ],
      noticeTitle: 'Regulated data',
      noticeBody:
        'Supply de-identified data unless a data-sharing agreement has been agreed before transfer.',
    },
    'evidence-synthesis-technical-reports': {
      eyebrow: 'Evidence service line · decision-ready reporting',
      badges: [
        { label: 'PRISMA-aligned workflows' },
        { label: 'GRADE where applicable' },
        { label: 'Client-owned outputs' },
      ],
      noticeTitle: 'Programme and survey data',
      noticeBody:
        'Health, clinical, survey and programme datasets should be de-identified unless a data-sharing agreement is in place.',
    },
  };
  const hero = heroes[slug];
  if (hero === undefined) return { blockType: 'serviceHero', badges: [] };
  return { blockType: 'serviceHero', ...hero };
}
