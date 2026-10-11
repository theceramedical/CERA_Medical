import { serviceHeroBootstrapBlock } from './bootstrap-content-hero.ts';

import type { ServicePresentation } from '../payload-types.ts';

type ServiceLayout = NonNullable<ServicePresentation['layout']>;
type LayoutBlock = Record<string, unknown>;

const DEFAULT_ENQUIRY_ASIDE: LayoutBlock = {
  blockType: 'serviceEnquiryAside',
  eyebrow: 'Direct study intake',
  title: 'Start a project conversation',
  body: 'Tell us about your research question, materials or data, expected outputs and timeline. Scope, cost and delivery are agreed in writing before work begins.',
  buttonLabel: 'Request this service',
  trustItems: [
    { label: 'Reply target: within three working days' },
    { label: 'Do not include direct participant identifiers' },
    { label: 'Protocol, timeline and deliverables documented' },
  ],
};

function featureGrid(
  heading: string,
  body: string,
  features: readonly {
    title: string;
    description: string;
    highlights?: readonly { text: string }[];
  }[],
): LayoutBlock {
  return {
    blockType: 'featureGrid',
    heading,
    body,
    tone: 'surface',
    centered: false,
    features: features.map((f) => ({ ...f })),
  };
}

function processSteps(
  heading: string,
  body: string,
  variant: 'grid' | 'timeline' | 'numbered',
  steps: readonly { title: string; description: string }[],
): LayoutBlock {
  return {
    blockType: 'processSteps',
    heading,
    body,
    tone: 'surface',
    variant,
    steps: steps.map((s) => ({ ...s })),
  };
}

const MOLECULAR_LAYOUT: readonly LayoutBlock[] = [
  serviceHeroBootstrapBlock('molecular-research'),
  {
    blockType: 'sectionHeading',
    heading: 'Wet-lab infrastructure and analytical rigor',
    body: 'CERA Medical provides molecular, biochemical and histological analysis through its Genomics, Histopathology and Microscopy Labs. Methods and handling requirements are agreed for each project.',
  },
  featureGrid(
    'Core laboratory assay capabilities',
    'Sequencing, gene and protein expression, biochemical assays, microscopy and method development for research projects.',
    [
      {
        title: 'Sanger sequencing and fragment analysis',
        description:
          'Capillary electrophoresis, plasmid validation, PCR product confirmation, targeted mutation screening, and microsatellite genotyping with trace file outputs.',
      },
      {
        title: 'Quantitative real-time PCR (RT-qPCR)',
        description:
          'SYBR Green and TaqMan probe-based gene expression profiling, copy number variation, viral load quantification, and RNA-seq validation.',
      },
      {
        title: 'Protein biochemistry and immunoassays',
        description:
          'Western blotting, sandwich and competitive ELISA, total protein quantification (BCA/Bradford), and microplate multiplexing.',
      },
      {
        title: 'Histopathology and tissue micro-sectioning',
        description:
          'FFPE and cryo-sectioning, microtomy, H&E staining, and specialized histological staining.',
      },
      {
        title: 'Microscopy and immunofluorescence',
        description:
          'Brightfield, phase contrast, and multi-channel fluorescence microscopy for subcellular localization and co-localization analysis.',
      },
      {
        title: 'High-fidelity nucleic acid extraction',
        description:
          'DNA, RNA, miRNA, and dual extractions from tissues, cell pellets, blood, FFPE scrolls, and biopsies with fluorometric and spectrophotometric QC.',
      },
    ],
  ),
  processSteps(
    '4-tier sample governance and chain-of-custody',
    'Rigorous tracking from specimen intake to archiving.',
    'numbered',
    [
      {
        title: 'Sample reception and de-identification verification',
        description:
          'Intake checking cryogenic barcodes and verified lack of personally identifiable information. Un-coded clinical samples are rejected at intake.',
      },
      {
        title: 'Cold-chain integrity and storage monitoring',
        description:
          'Preservation via calibrated ultra-low freezers and liquid nitrogen storage with redundant telemetry alarms.',
      },
      {
        title: 'Quality control and baseline viability gate',
        description:
          'Fluorometric quantification, purity ratios, RNA integrity scores, and protein validation prior to assay allocation.',
      },
      {
        title: 'Post-study sample return or destruction',
        description:
          'Remaining samples are returned at the client’s request or destroyed under the Data Retention Policy and applicable laboratory procedures.',
      },
    ],
  ),
  processSteps(
    '5-stage molecular project lifecycle',
    'Standard operating timeline for scoping, assay execution, and deliverable packaging.',
    'timeline',
    [
      {
        title: 'Scoping and assay matrix agreement',
        description:
          'Definition of endpoints, replicates, biological power, volume tolerances, and limits of detection documented in a signed study charter.',
      },
      {
        title: 'Ethics clearance and coded sample reception',
        description:
          'Receipt of IRB/IEC approval, transfer of anonymized barcodes, and verification of cold-chain transit logs.',
      },
      {
        title: 'Extraction, reagent verification and QC',
        description:
          'Lysis, batch lot traceability, negative extraction controls, and yield verification before main run.',
      },
      {
        title: 'Experimental assay execution',
        description:
          'Blinded operator replicates, calibrated thermal cycler runs, and continuous digital raw data collection.',
      },
      {
        title: 'Technical dossier and publication-ready figures',
        description:
          'Delivery of normalized data matrices, standard curves, instrument raw files, and peer-review ready charts.',
      },
    ],
  ),
  {
    blockType: 'keyValueList',
    heading: 'Research laboratory facilities',
    items: [
      { label: 'Genomics Lab', detail: 'Sanger sequencing and PCR-based characterisation' },
      { label: 'Histopathology Lab', detail: 'Tissue processing and staining' },
      { label: 'Microscopy Lab', detail: 'Imaging and quantitative analysis' },
    ],
  },
  DEFAULT_ENQUIRY_ASIDE,
  {
    blockType: 'serviceSidebarCard',
    title: 'Delivery specifications and handling',
    items: [
      {
        label: 'Tissue and cell pellets',
        detail:
          'Snap-frozen in liquid nitrogen or RNAlater. Shipped on dry ice with temperature logger.',
      },
      {
        label: 'Whole blood and biofluids',
        detail: 'EDTA or PAXgene tubes, minimum volume. Verified non-infectious, coded barcoding.',
      },
      {
        label: 'Receiving protocol',
        detail: 'Notify laboratory reception 48 hours prior to dry ice courier dispatch.',
      },
    ],
  },
  {
    blockType: 'serviceSidebarCard',
    title: 'Study standards and consent',
    bullets: [
      { text: 'Documented, reproducible methods' },
      { text: 'Coded human samples with required donor consent and ethical approval' },
      { text: 'Project-specific handling and retention agreed in writing' },
    ],
  },
];

const PRECLINICAL_LAYOUT: readonly LayoutBlock[] = [
  serviceHeroBootstrapBlock('preclinical-studies'),
  {
    blockType: 'sectionHeading',
    heading: 'Service overview and laboratory capabilities',
    body: 'We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies may be in vivo in animal models, in vitro in cell-based systems, or in silico through computer simulation. Animal studies are designed under IAEC-approved written protocols.',
  },
  featureGrid(
    'Three investigation modalities',
    'Cross-modal workflows from computational molecular prediction to biological verification.',
    [
      {
        title: 'In vivo models',
        description:
          'Animal models of disease with safety, efficacy, toxicology and behavioural endpoints under ethics-approved protocols.',
        highlights: [
          { text: 'Mice and rats' },
          { text: 'Rabbits and guinea pigs' },
          { text: 'Behavioral assays and neurotoxicity' },
          { text: 'Toxicology and dose-response studies' },
        ],
      },
      {
        title: 'In vitro assays',
        description:
          'Cell-based disease models, viability and proliferation assays, and pathway analysis in the Cell Culture Lab.',
        highlights: [
          { text: 'Glioblastoma and other cell lines' },
          { text: 'Cellular viability and proliferation assays' },
          { text: 'Gene and protein expression analysis' },
          { text: 'Western blot and RT-qPCR profiling' },
        ],
      },
      {
        title: 'In silico dynamics',
        description:
          'Computational screening and molecular dynamics simulations to test drug-receptor affinity prior to wet-lab synthesis.',
        highlights: [
          { text: 'Molecular docking against selected targets' },
          { text: 'Molecular dynamics (MD) trajectories' },
          { text: 'Binding free-energy analysis' },
          { text: 'Pose inspection and trajectory analysis' },
        ],
      },
    ],
  ),
  featureGrid(
    'Active research focus areas',
    'Current work centres on neuroscience and oncology, with projects selected according to the compound or product under test.',
    [
      {
        title: 'Methamphetamine neurotoxicity',
        description:
          'Evaluating striatal dopaminergic neurodegeneration, microglial activation, and neuroprotective therapeutic leads in rodent models.',
      },
      {
        title: 'Social isolation stress',
        description:
          'Studying the effect of early-life social isolation on the brain and behaviour, including later vulnerability to drug dependence.',
      },
      {
        title: 'Morphine and nicotine dependence',
        description:
          'Conditioned place preference, withdrawal escalation paradigms, and assessment of novel cessation or anti-relapse candidates.',
      },
      {
        title: 'Synthetic compounds in neuroscience',
        description:
          'Screening novel small-molecule synthetic compounds for CNS receptor binding, blood-brain barrier permeability, and acute toxicity.',
      },
      {
        title: 'Gut-induced depression models',
        description:
          'Investigating the microbiome-gut-brain axis, systemic inflammatory mediators, and therapeutic interventions for mood disorders.',
      },
      {
        title: 'Natural products in glioblastoma',
        description:
          'Assessing secondary plant metabolites, selective cytotoxic potency, and synergistic apoptosis induction in human glioblastoma lines.',
      },
    ],
  ),
  processSteps(
    '5-stage project lifecycle',
    'Standard operating procedure governing every CERA Medical preclinical engagement.',
    'numbered',
    [
      {
        title: 'Project scoping and commercial agreement',
        description:
          'Define candidate treatment, analytical endpoints, animal/cell model requirements, statistical sample sizes, total budget, and milestone timelines in writing.',
      },
      {
        title: 'Protocol clearance and statistical locking',
        description:
          'A written protocol defines controls, doses, endpoints and analysis. Animal studies begin only after approval by the institutional animal ethics committee.',
      },
      {
        title: 'Experimental execution and chain-of-custody',
        description:
          'The assigned scientist carries out the study with the controls, replicates and quality checks defined in the approved protocol.',
      },
      {
        title: 'Data curation, histology and biostatistics',
        description:
          'Raw data verification, blinded histopathological micro-imaging scoring, ANOVA/multivariate statistics, and compilation into publication-grade graphical summaries.',
      },
      {
        title: 'Technical reporting and scientific review',
        description:
          'Delivery of results as a documented report with figures, tables and methods text. A consultation call and revision rounds are available.',
      },
    ],
  ),
  {
    blockType: 'keyValueList',
    heading: 'Mandatory compliance and investigator requirements',
    body: 'To ensure compliance with national biomedical regulations and global publication integrity, all external sponsor projects must fulfill the following mandatory checkpoints before laboratory work commences:',
    items: [
      {
        label: 'Institutional Animal Ethics Committee (IAEC) pre-clearance protocol',
        detail: 'Required before animal acquisition or experiment initiation.',
      },
      {
        label: 'Strict de-identification: zero participant or sponsor confidential identifiers',
        detail: 'No direct identifiers in correspondence or sample labels.',
      },
      {
        label: 'Safety Data Sheet (SDS) submission for all synthetic or extracted test items',
        detail: 'Submitted before compound receipt.',
      },
      {
        label: 'Strict biohazard chain-of-custody and hazardous biological waste destruction SOPs',
        detail: 'Documented handover at intake and disposal.',
      },
    ],
  },
  {
    blockType: 'ctaBand',
    headline: 'Ready to scope your preclinical study?',
    body: 'Discuss candidate compounds, cellular models, or in vivo animal paradigms with our study directors. We respond within three working days.',
    href: '/enquiry',
    label: 'Request preclinical scoping',
  },
  DEFAULT_ENQUIRY_ASIDE,
  {
    blockType: 'serviceSidebarCard',
    title: 'Animal welfare governance',
    body: 'Animal studies begin only after the written protocol is approved by the institutional animal ethics committee. Study design, conduct and records follow the principles of Good Laboratory Practice.',
  },
];

function genericLayout(
  slug: string,
  capabilityHeading: string,
  capabilities: readonly string[],
): LayoutBlock[] {
  return [
    serviceHeroBootstrapBlock(slug),
    featureGrid(
      capabilityHeading,
      'Scope, timeline and cost are agreed in writing for each engagement.',
      capabilities.map((line) => {
        const [title, ...rest] = line.split(' — ');
        return {
          title: title ?? line,
          description: rest.join(' — ') || line,
        };
      }),
    ),
    processSteps(
      'How we deliver',
      'A consistent workflow from scoping through documented deliverables.',
      'grid',
      [
        {
          title: 'Scoping conversation',
          description: 'Clarify research question, inputs, outputs, and constraints.',
        },
        {
          title: 'Written plan',
          description: 'Methods, timeline, quality checks, and commercial terms agreed.',
        },
        {
          title: 'Execution and QC',
          description: 'Work proceeds against the charter with traceable parameters.',
        },
        {
          title: 'Delivery and support',
          description: 'Data package, report, and follow-up questions within agreed window.',
        },
      ],
    ),
    DEFAULT_ENQUIRY_ASIDE,
  ];
}

const LAYOUT_BY_SLUG: Record<string, readonly LayoutBlock[]> = {
  'molecular-research': MOLECULAR_LAYOUT,
  'preclinical-studies': PRECLINICAL_LAYOUT,
  'metagenomic-data-analysis': genericLayout(
    'metagenomic-data-analysis',
    'Bioinformatics capabilities',
    [
      '16S/18S amplicon profiling — Diversity metrics and taxonomic assignment.',
      'Shotgun metagenomics — Assembly, annotation, and functional profiling.',
      'Quality control — Host read removal and reproducible pipeline documentation.',
    ],
  ),
  'biomedical-omics-data-analysis': genericLayout(
    'biomedical-omics-data-analysis',
    'Computational omics capabilities',
    [
      'RNA-seq differential expression — Multi-cohort designs with documented parameters.',
      'Clinical regression modelling — De-identified clinical and omics integration.',
      'Validation planning — Hold-out sets and sensitivity analyses in scope.',
    ],
  ),
  'evidence-synthesis-technical-reports': genericLayout(
    'evidence-synthesis-technical-reports',
    'Evidence synthesis capabilities',
    [
      'Systematic review workflows — PRISMA-aligned search and screening.',
      'GRADE assessment — Transparent certainty ratings where applicable.',
      'Decision-ready reporting — Client-owned outputs for policy and programme teams.',
    ],
  ),
};

/** Full CMS layout for a Vendure catalogue service (public product page). */
export function buildServicePresentationLayout(slug: string): ServiceLayout {
  const blocks = LAYOUT_BY_SLUG[slug];
  if (blocks !== undefined) return blocks as ServiceLayout;
  return [serviceHeroBootstrapBlock(slug), DEFAULT_ENQUIRY_ASIDE] as ServiceLayout;
}
