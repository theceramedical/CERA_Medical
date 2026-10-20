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
  'confocal-imaging-in-the-laboratory': [
    {
      heading: 'What the STELLARIS bench is used for',
      paragraphs: [
        'CERA uses a Leica STELLARIS 8 confocal on a DMi8 workstation for molecular and histological imaging. The instrument supports fluorescence work that bright-field microscopy cannot resolve, including labelled sections and cultured samples agreed in the study protocol.',
        'The microscope is laboratory equipment used inside the molecular research service. It is not a product offered for sale.',
      ],
    },
    {
      heading: 'What to send before imaging starts',
      paragraphs: [
        'Imaging time is scheduled after the sample type, labels, and expected outputs are written down. Unlabelled slides and missing fluorophore details are the usual cause of a delayed session.',
      ],
      bullets: [
        'Sample type, fixation, and mounting medium',
        'Fluorophores or stains, and the channels you need reported',
        'Whether the deliverable is representative fields, a z-stack, or annotated figures',
      ],
    },
  ],
  'plate-based-assays-and-readout': [
    {
      heading: 'From incubation to a plate read',
      paragraphs: [
        'Many molecular assays move from labelled tubes on a temperature-controlled dry bath to a microplate. CERA reads those plates on a Thermo Scientific Multiskan SkyHigh when the protocol calls for absorbance or fluorescence.',
        'The dry bath and plate reader stay in the laboratory. Sponsors receive the agreed data and methods notes, not the instruments.',
      ],
    },
    {
      heading: 'Handoff details that change the result',
      paragraphs: [
        'Plate layout, blank wells, and the incubation temperature have to match the protocol version on file. A photograph of the loaded plate is kept with the run record when the method calls for it.',
      ],
      bullets: [
        'Plate map with sample codes, standards, and blanks',
        'Incubation temperature and time',
        'Read mode and wavelengths named in the protocol',
      ],
    },
  ],
  'documenting-laboratory-methods': [
    {
      heading: 'A record that matches the bench',
      paragraphs: [
        'Methods sections fail when the written steps drift from what was actually done. CERA keeps a small documentation kit — a camera, a scale card, and labelled tubes — so preparation steps can be checked against the protocol.',
      ],
    },
    {
      heading: 'What belongs in the methods note',
      paragraphs: [
        'The note names the instrument, the reagent lot when it matters, and the person who ran the step. Photographs support the note; they do not replace sample codes or the protocol version.',
      ],
      bullets: [
        'Sample codes visible on the tube, not participant names',
        'Scale reference in frame when size matters',
        'Instrument name and the protocol version used that day',
      ],
    },
  ],
};

export function extendedArticleSections(slug: string): readonly ArticleSection[] | undefined {
  return EXTENDED[slug];
}
