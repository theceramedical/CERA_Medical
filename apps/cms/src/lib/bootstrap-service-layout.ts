import { serviceHeroBootstrapBlock } from './bootstrap-content-hero.ts';

import type { ServicePresentation } from '../payload-types.ts';

type ServiceLayout = NonNullable<ServicePresentation['layout']>;
type LayoutBlock = Record<string, unknown>;

const DEFAULT_ENQUIRY_ASIDE: LayoutBlock = {
  blockType: 'serviceEnquiryAside',
  eyebrow: 'Project inquiry',
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
  features: readonly { title: string; description: string }[],
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
    body: 'CERA Medical provides molecular, biochemical, and histological analysis for academic, biotech, and pharmaceutical programmes in validated BSL-2 suites.',
  },
  featureGrid(
    'Core laboratory assay capabilities',
    'Validated assay methodologies conducted in accordance with international GLP and ISO 15189 analytical standards.',
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
        title: 'Post-study specimen archival or certified destruction',
        description:
          'Standard retention post dossier transmission, followed by certified destruction or secure return shipment.',
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
    heading: 'Laboratory instrumentation roster',
    items: [
      {
        label: 'Applied Biosystems Genetic Analyzer 3500 Series',
        detail: 'Capillary Sanger and fragment',
      },
      {
        label: 'Applied Biosystems QuantStudio 5 Real-Time PCR System',
        detail: '96-well fluorescent block',
      },
      {
        label: 'Esco Airstream Class II Type A2 biosafety cabinets',
        detail: 'BSL-2 sterile extraction',
      },
      {
        label: 'Leica RM2235 rotary microtome and cryostat',
        detail: 'FFPE and frozen sectioning',
      },
      {
        label: 'Bio-Rad ChemiDoc MP imaging system',
        detail: 'Chemiluminescent and multiplex IF',
      },
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
    title: 'Laboratory accreditations',
    bullets: [
      { text: 'ISO 15189 aligned quality architecture' },
      { text: 'OECD principles of Good Laboratory Practice (GLP)' },
      { text: 'IAEC/IRB coordinated protocol compliance' },
    ],
  },
];

const PRECLINICAL_LAYOUT: readonly LayoutBlock[] = [
  serviceHeroBootstrapBlock('preclinical-studies'),
  {
    blockType: 'sectionHeading',
    heading: 'Ethical preclinical research infrastructure',
    body: 'In vivo and in vitro models conducted under institutional animal ethics approval with documented welfare, dosing, and analytical endpoints.',
  },
  featureGrid(
    'Therapeutic area and model capabilities',
    'Representative study designs CERA supports for candidate screening and mechanistic validation.',
    [
      {
        title: 'Social isolation stress',
        description:
          'Neurochemical adaptations, anhedonia-like manifestations, and HPA-axis endocrine dysregulation in controlled cohorts.',
      },
      {
        title: 'Morphine and nicotine dependence',
        description:
          'Conditioned place preference, withdrawal escalation paradigms, and assessment of cessation or anti-relapse candidates.',
      },
      {
        title: 'Synthetic compounds in neuroscience',
        description:
          'Screening novel small molecules for CNS receptor binding, blood-brain barrier permeability, and acute toxicity.',
      },
      {
        title: 'Gut-induced depression models',
        description:
          'Microbiome-gut-brain axis, systemic inflammatory mediators, and therapeutic interventions for mood disorders.',
      },
      {
        title: 'Natural products in glioblastoma',
        description:
          'Secondary plant metabolites, selective cytotoxic potency, and synergistic apoptosis induction in human glioblastoma lines.',
      },
      {
        title: 'In vitro cytotoxicity and histopathology',
        description:
          'Cell-line panels, tissue microarrays, and quantitative histopathology with blinded scoring.',
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
          'Define candidate treatment, endpoints, model requirements, sample sizes, budget, and milestone timelines in writing.',
      },
      {
        title: 'Protocol clearance and statistical locking',
        description:
          'Formal submission to IAEC or biosafety committee. Protocol versioning and statistical power calculations locked.',
      },
      {
        title: 'In-life study execution and welfare monitoring',
        description:
          'Daily welfare checks, dosing logs, adverse event recording, and interim data review against charter.',
      },
      {
        title: 'Terminal analytics and histopathology',
        description:
          'Blinded histology, biomarker assays, and statistical analysis against pre-registered endpoints.',
      },
      {
        title: 'Study report and data package',
        description:
          'GLP-aligned study report, raw data tables, and publication-ready figures under client ownership.',
      },
    ],
  ),
  DEFAULT_ENQUIRY_ASIDE,
  {
    blockType: 'serviceSidebarCard',
    title: 'Ethics and welfare requirements',
    items: [
      {
        label: 'IAEC approval',
        detail: 'Institutional Animal Ethics Committee clearance required before any in vivo work.',
      },
      {
        label: '3Rs alignment',
        detail: 'Replacement, reduction, and refinement documented in every protocol.',
      },
    ],
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
