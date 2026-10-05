export interface ArticleSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly string[];
}

const EXTENDED: Record<string, readonly ArticleSection[]> = {
  'omics-quality-control-basics': [
    {
      heading: 'Why reviewers ask about QC first',
      paragraphs: [
        'Omics datasets fail peer review more often on traceability than on novelty. Reviewers expect to see how low-quality reads were removed, how batch structure was assessed, and how every figure maps back to a filtered table.',
        'CERA Medical documents these steps in the analysis plan before compute work begins, then mirrors them in the results package so sponsors can answer methodology questions without reconstructing the pipeline from memory.',
      ],
    },
    {
      heading: 'Minimum QC documentation',
      paragraphs: [
        'A defensible QC appendix typically includes software names and versions, parameter choices, and the order of filtering steps. Ambiguous phrases such as “standard filtering” are avoided in favour of explicit thresholds.',
      ],
      bullets: [
        'Read-level QC with documented cut-offs (quality scores, adapter trimming, duplicate handling)',
        'Sample-level QC plots retained (depth, complexity, contamination screens where relevant)',
        'Batch or run-order effects tested and either modelled or ruled out with rationale',
        'Figure panels keyed to table row identifiers or sample codes agreed in the scope',
      ],
    },
    {
      heading: 'Batch awareness without overfitting',
      paragraphs: [
        'Batch correction is applied only when diagnostics support it and the study design allows. When correction is inappropriate, that decision is recorded so reviewers understand why raw or partially adjusted models were reported.',
        'Sensitivity analyses—running key contrasts with and without batch terms—are often included so sponsors can show robustness without hiding uncertainty.',
      ],
    },
    {
      heading: 'Handover that survives audit',
      paragraphs: [
        'Deliverables include normalized count or variant tables, session logs or workflow reports, and README-style notes for non-bioinformatician collaborators. The goal is that a new analyst could reproduce the headline findings from the archived materials within the agreed retention period.',
      ],
    },
  ],
  'planning-metagenomic-submissions': [
    {
      heading: 'Scope before the first gigabyte moves',
      paragraphs: [
        'Metagenomic projects stall when read depth, controls, and metadata conventions are agreed only after transfer. CERA scopes these items in writing so bioinformatics time is not spent reconciling incompatible sample sheets.',
      ],
      bullets: [
        'Target depth and library type (16S, ITS, shotgun) aligned to the research question',
        'Positive and negative controls named in the sample manifest',
        'De-identified sample codes with no participant names in filenames or free text',
      ],
    },
    {
      heading: 'Packaging and transfer',
      paragraphs: [
        'FASTQ or BAM bundles are accompanied by a machine-readable sample sheet and checksum manifest. Large transfers use encrypted channels agreed in the project contract; public links without access control are discouraged for research material.',
      ],
    },
  ],
  'preclinical-study-handoff': [
    {
      heading: 'Ethics and safety before shipment',
      paragraphs: [
        'Animal and in vitro studies require institutional ethics approval and compound safety documentation before CERA accepts material. A draft protocol defines endpoints, group sizes, and reporting expectations.',
      ],
      bullets: [
        'IAEC or equivalent approval references supplied by the sponsor',
        'Safety data sheets for all test compounds and known hazards disclosed',
        'Shipping instructions and chain-of-custody labels agreed with the study director',
      ],
    },
    {
      heading: 'Clean handoff reduces rework',
      paragraphs: [
        'Incomplete handoffs delay cage allocation and assay scheduling. A single checklist—approvals, compounds, protocol version, and contact for biological questions—keeps the study on the timeline agreed at scoping.',
      ],
    },
  ],
};

export function extendedArticleSections(slug: string): readonly ArticleSection[] | undefined {
  return EXTENDED[slug];
}
