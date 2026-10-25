/**
 * Public copy from the October 2026 website brief.
 * The older shop catalogue (Mosscent, Activ-P, Zest) stays off the site.
 */

export interface ServiceChip {
  readonly label: string;
  readonly href: string;
}

export interface ServiceCategory {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly intro: string;
  readonly chips: readonly ServiceChip[];
  readonly sections: readonly {
    readonly id: string;
    readonly title: string;
    readonly body: readonly string[];
  }[];
  readonly closing?: string;
}

export const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  {
    slug: 'preclinical-studies',
    title: 'Preclinical Studies',
    summary: 'Testing candidate treatments in animal models, in cells and by computer simulation.',
    intro:
      'We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies are carried out in animal models, in cell-based systems or by computer simulation. Animal studies begin only after the institutional animal ethics committee has approved the written protocol, and all studies are designed, conducted and documented in line with the principles of Good Laboratory Practice. These are research services, not clinical care.',
    chips: [
      { label: 'In vivo studies', href: '/services/preclinical-studies#in-vivo' },
      { label: 'In vitro studies', href: '/services/preclinical-studies#in-vitro' },
      { label: 'In silico studies', href: '/services/preclinical-studies#in-silico' },
    ],
    sections: [
      {
        id: 'in-vivo',
        title: 'In vivo studies',
        body: [
          'Studies in animal models of disease, carried out in our Animal House.',
          'Safety assessment: systematic evaluation of adverse effects and risk profiling.',
          'Efficacy testing: measurement of treatment effect under controlled laboratory conditions.',
          'Toxicology: toxic thresholds and dose-response relationships.',
          'Behavioural testing: memory, anxiety-like behaviour and locomotor activity.',
          'Available research animals: mice, rats, rabbits and guinea pigs.',
        ],
      },
      {
        id: 'in-vitro',
        title: 'In vitro studies',
        body: [
          'Cell-based models of disease, run in our Cell Culture Lab.',
          'Cell-based disease models that reproduce the disease environment.',
          'Cellular assays of viability, proliferation and function.',
          'Pathway analysis of signalling cascades and disease mechanisms.',
          'Therapeutic screening of natural products and other candidate treatments.',
          'Available cell lines: glioblastoma and other cell lines held in the Cell Culture Lab.',
        ],
      },
      {
        id: 'in-silico',
        title: 'In silico studies',
        body: [
          'Computational prediction of how a compound interacts with its protein targets, run on our GPU infrastructure.',
          'Target selection from the disease pathway, prepared from published structures.',
          'Molecular docking predicts binding site, pose and affinity, and is validated against known reference ligands.',
          'Molecular dynamics tests whether the predicted complex is stable over time.',
          'Binding energy analysis estimates binding free energy and the residues that contribute most.',
        ],
      },
      {
        id: 'why-it-matters',
        title: 'Why it matters',
        body: [
          'Preclinical testing reduces risk before human trials, identifies suitable dosing strategies, generates data that can support regulatory submissions and shortens drug development timelines.',
        ],
      },
    ],
  },
  {
    slug: 'molecular-research',
    title: 'Molecular Research',
    summary: 'Molecular, biochemical and histological analysis of research samples.',
    intro:
      'We provide molecular, biochemical and histological analysis of research samples in our Genomics, Histopathology and Microscopy Labs. Human-derived samples must be coded and supplied without direct identifiers, with ethical approval and donor consent in place.',
    chips: [
      { label: 'PCR and RT-qPCR', href: '/services/molecular-research#pcr' },
      { label: 'ELISA', href: '/services/molecular-research#elisa' },
      { label: 'Western blot', href: '/services/molecular-research#western-blot' },
      { label: 'Sequencing', href: '/services/molecular-research#sequencing' },
      { label: 'Histopathology', href: '/services/molecular-research#histopathology' },
      {
        label: 'Immunohistochemistry and immunofluorescence',
        href: '/services/molecular-research#ihc',
      },
      { label: 'Biochemical assays', href: '/services/molecular-research#biochemical-assays' },
      {
        label: 'Nucleic acid extraction',
        href: '/services/molecular-research#nucleic-acid-extraction',
      },
    ],
    sections: [
      {
        id: 'pcr',
        title: 'PCR and RT-qPCR',
        body: [
          'Quantification of gene expression by RT-qPCR, and PCR-based characterisation of genetic variants associated with disease.',
        ],
      },
      {
        id: 'elisa',
        title: 'ELISA',
        body: [
          'Quantification of protein biomarkers, including inflammatory markers, in serum, tissue homogenates and cell samples.',
        ],
      },
      {
        id: 'western-blot',
        title: 'Western blot',
        body: [
          'Detection and semi-quantitative analysis of protein expression in tissue and cell lysates.',
        ],
      },
      {
        id: 'sequencing',
        title: 'Sequencing',
        body: ['Sanger sequencing for confirmation of PCR products and targeted genetic variants.'],
      },
      {
        id: 'histopathology',
        title: 'Histopathology',
        body: [
          'Tissue processing and sectioning, H&E and Nissl staining, and quantitative image analysis of tissue sections.',
        ],
      },
      {
        id: 'ihc',
        title: 'Immunohistochemistry and immunofluorescence',
        body: [
          'Detection and localisation of target proteins in tissue sections, imaged by brightfield and fluorescence microscopy.',
        ],
      },
      {
        id: 'biochemical-assays',
        title: 'Biochemical assays',
        body: [
          'Detection and quantification of biomarkers in tissue, serum and cell samples, including markers of oxidative stress and inflammation.',
        ],
      },
      {
        id: 'nucleic-acid-extraction',
        title: 'Nucleic acid extraction',
        body: [
          'DNA and RNA extraction from tissue, cells and blood, with quality control before downstream analysis.',
        ],
      },
      {
        id: 'sending-samples',
        title: 'Sending samples',
        body: [
          'Please contact us before sending any material so that we can confirm the samples, hazards, shipping arrangements and timing for your project. Remaining samples are returned on request or destroyed under our Data Retention Policy.',
        ],
      },
    ],
  },
  {
    slug: 'biomedical-data-analysis',
    title: 'Biomedical Data Analysis',
    summary: 'Metagenomic, health and omics data analysed through to publication-ready results.',
    intro:
      'We analyse biomedical data from raw files through to publication-ready figures, tables and results text, with metagenomics as our speciality. Data are supplied de-identified, remain the client’s property, are kept confidential and are deleted in line with our Data Retention Policy.',
    chips: [
      {
        label: 'Metagenomics and microbiome analysis',
        href: '/services/biomedical-data-analysis#metagenomics',
      },
      {
        label: 'Health and clinical data analysis',
        href: '/services/biomedical-data-analysis#health-data',
      },
      {
        label: 'Omics and genomic data analysis',
        href: '/services/biomedical-data-analysis#omics',
      },
      {
        label: 'Evidence synthesis and technical reports',
        href: '/services/biomedical-data-analysis#evidence',
      },
      {
        label: 'Image and behaviour analysis',
        href: '/services/biomedical-data-analysis#image-analysis',
      },
    ],
    sections: [
      {
        id: 'metagenomics',
        title: 'Metagenomics and microbiome analysis',
        body: [
          'Whole metagenome shotgun analysis provides full characterisation of the microbial community from raw reads.',
          'Genome-resolved metagenomics recovers, assesses the quality of and classifies metagenome-assembled genomes.',
          '16S and ITS amplicon analysis profiles bacteria, fungi and eukaryotes.',
          'Functional annotation maps pathways and gene ontology in microbial communities.',
          'Comparative metagenomics analyses alpha and beta diversity and differential abundance across sample groups.',
          'Data deposition includes preparation and submission of raw reads and metadata to NCBI SRA.',
        ],
      },
      {
        id: 'from-data-to-manuscript',
        title: 'From your data to your manuscript',
        body: [
          'We retrieve data directly from your sequencing provider’s server or cloud link, or from public repositories such as NCBI SRA and ENA by accession number. You do not need to transfer files yourself.',
          'Analysis includes quality control, profiling, statistics and visualisation with the pipeline agreed for your study.',
          'Delivery is typically within three weeks and includes publication-ready figures, result tables, a methods text and a written description of the results.',
          'Figures, analyses and text are revised with you over multiple rounds. We remain available for questions from co-authors and journal reviewers until the work is completed.',
          'Data we work with: Illumina and DNBSEQ shotgun reads; 16S rRNA and ITS amplicon reads; human gut, oral and salivary samples; environmental samples; cross-sectional and longitudinal cohorts; and new or published datasets. Accepted formats are FASTQ, FASTA or SRA accession numbers, with sample metadata in a spreadsheet.',
        ],
      },
      {
        id: 'health-data',
        title: 'Health and clinical data analysis',
        body: [
          'Biostatistics of patient, cohort, survey and laboratory datasets.',
          'Programme and survey data analysed for technical and donor reports, with charts, maps and annexed tables.',
          'Predictive models and biomarker panels with documented validation.',
        ],
      },
      {
        id: 'omics',
        title: 'Omics and genomic data analysis',
        body: [
          'Genomic variant analysis: annotation and prioritisation of variants from whole-genome and exome sequencing against clinical and population databases.',
          'RNA-seq differential expression and pathway analysis, and other omics on request.',
          'Retrieval and re-analysis of published datasets for new questions and meta-analyses.',
        ],
      },
      {
        id: 'evidence',
        title: 'Evidence synthesis and technical reports',
        body: [
          'Systematic reviews and meta-analyses reported to the PRISMA standard.',
          'Situation analyses and health-sector assessments of a health problem, service or facility.',
          'Technical and donor reports written in the client’s format, and short policy briefs for decision-makers.',
        ],
      },
      {
        id: 'image-analysis',
        title: 'Image and behaviour analysis',
        body: ['Automated quantification of histology images and of animal behaviour recordings.'],
      },
      {
        id: 'who-this-is-for',
        title: 'Who this is for',
        body: [
          'Research groups and professors with data awaiting analysis; hospitals and clinical laboratories; pharmaceutical and biotech companies; public health institutions; UN agencies, international NGOs, ministries and donor-funded programmes.',
        ],
      },
    ],
  },
];

export function serviceCategoryBySlug(slug: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((category) => category.slug === slug);
}

export interface ProjectCard {
  readonly title: string;
  readonly category: string;
  readonly status: 'Running' | 'Completed' | 'Laboratory record';
  readonly summary: string;
  readonly slug: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly video?: string;
}

const mousePhoto = {
  image: '/images/facility/preclinical-handling.jpg',
  imageAlt: 'Gloved handling of a laboratory mouse during a preclinical procedure.',
} as const;

export const RUNNING_PROJECTS: readonly ProjectCard[] = [
  {
    slug: 'methamphetamine-neurotoxicity',
    ...mousePhoto,
    title: 'Methamphetamine-induced neurotoxicity',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'A mouse model of methamphetamine exposure in which a natural compound is tested for protective and restorative effects on recognition memory, neuroinflammation and neuronal cell death.',
  },
  {
    slug: 'social-isolation-stress',
    ...mousePhoto,
    title: 'Social isolation stress',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'The effect of early-life social isolation on the brain and on behaviour, including vulnerability to drug dependence in later life.',
  },
  {
    slug: 'morphine-dependence',
    ...mousePhoto,
    title: 'Morphine dependence',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'Mouse models of morphine dependence and withdrawal, used to test candidate treatments and the signalling pathways through which they act.',
  },
  {
    slug: 'nicotine',
    ...mousePhoto,
    title: 'Nicotine',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'Rodent models of nicotine exposure, in which candidate products are evaluated for their neuroprotective and behavioural effects.',
  },
  {
    slug: 'synthetic-compounds',
    image: '/images/facility/molecular-bench.jpg',
    imageAlt: 'Tubes and reagents laid out for compound preparation.',
    title: 'Synthetic compounds in neuroscience',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'Newly synthesised compounds, and compounds modified from a base compound, screened for activity in neurological and behavioural models.',
  },
  {
    slug: 'gut-induced-depression',
    image: '/images/products/tube-preparation.jpg',
    imageAlt: 'Labelled tubes prepared before a microbiome-related assay.',
    video: '/videos/products/tube-preparation.mp4',
    title: 'Gut-induced depression',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'Models in which disturbance of the gut microbiota produces depression-like behaviour, used to study the gut-brain axis and to test interventions.',
  },
  {
    slug: 'natural-products-glioblastoma',
    image: '/images/products/cell-imaging.jpg',
    imageAlt: 'Microscopy workstation reviewing a prepared cell sample.',
    video: '/videos/products/cell-imaging.mp4',
    title: 'Natural products in glioblastoma',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'Natural products tested against glioblastoma cell lines for their effect on cell viability and proliferation.',
  },
  {
    slug: 'in-silico-target-studies',
    image: '/images/facility/confocal-workstation.jpg',
    imageAlt: 'Laboratory workstation used alongside computational target studies.',
    title: 'In silico target studies',
    category: 'Preclinical Studies',
    status: 'Running',
    summary:
      'Docking and molecular dynamics studies that test whether a compound under investigation binds the inflammatory and cell-death proteins implicated by our animal studies.',
  },
];

export const COMPLETED_PROJECTS: readonly ProjectCard[] = [
  {
    slug: 'infant-gut-microbiome',
    image: '/images/products/qpcr-assay.jpg',
    imageAlt: 'qPCR amplification plot from a laboratory assay run.',
    video: '/videos/products/qpcr-assay.mp4',
    title: 'Infant gut microbiome development',
    category: 'Biomedical Data Analysis',
    status: 'Completed',
    summary:
      'A longitudinal shotgun metagenomic study of infants in a population-based birth cohort in Pakistan, sampled from birth to twelve months, with a data descriptor manuscript and deposition of the raw reads in NCBI SRA.',
  },
  {
    slug: 'mother-infant-gut-microbiome',
    image: '/images/products/sample-tubes.jpg',
    imageAlt: 'Capped sample tubes loaded for nucleic acid work.',
    video: '/videos/products/sample-tubes.mp4',
    title: 'Mother and infant gut microbiome',
    category: 'Biomedical Data Analysis',
    status: 'Completed',
    summary:
      'Species-level profiling of a longitudinal mother-infant cohort, published in a peer-reviewed nutrition journal.',
  },
  {
    slug: 'oral-microbiome-preschool',
    image: '/images/facility/dry-bath.jpg',
    imageAlt: 'A dry bath used while samples are prepared for amplicon analysis.',
    title: 'Oral microbiome of pre-school children',
    category: 'Biomedical Data Analysis',
    status: 'Completed',
    summary:
      'A 16S rRNA amplicon study of the salivary microbiome of Pakistani pre-school children, including a comparison of stunted and normal-weight children.',
  },
];

export const LABORATORY_RECORDS: readonly ProjectCard[] = [
  {
    slug: 'confocal-imaging',
    title: 'Confocal imaging on the laboratory bench',
    category: 'Molecular Research',
    status: 'Laboratory record',
    summary:
      'The Leica confocal workstation is used for fluorescence imaging of tissue and cells. It is laboratory equipment, not a product for sale.',
    image: '/images/facility/confocal-stellaris.jpg',
    imageAlt: 'Leica STELLARIS 8 confocal microscope on the CERA laboratory bench.',
  },
  {
    slug: 'reagent-weighing',
    title: 'Weighing reagents for assay preparation',
    category: 'Molecular Research',
    status: 'Laboratory record',
    summary:
      'Reagents are weighed on the analytical balance before they go into extraction kits, buffers and plate assays.',
    image: '/images/facility/analytical-balance.jpg',
    imageAlt: 'Analytical balance with reagent bottles on the laboratory bench.',
    video: '/videos/products/weighed-reagent.mp4',
  },
  {
    slug: 'plate-readout',
    title: 'Plate readout for biomarker panels',
    category: 'Preclinical Studies',
    status: 'Laboratory record',
    summary:
      'The microplate reader records the biomarker panel used alongside mouse neurotoxicity studies.',
    image: '/images/facility/plate-reader.jpg',
    imageAlt: 'Microplate reader used to read a biomarker panel.',
  },
  {
    slug: 'documented-methods',
    title: 'Documenting methods before the report',
    category: 'Biomedical Data Analysis',
    status: 'Laboratory record',
    summary:
      'Camera, tubes and written notes from a study file. Methods are recorded so the report can name what was actually done.',
    image: '/images/facility/methods-documentation.jpg',
    imageAlt: 'Camera and tubes beside written laboratory notes.',
  },
];

export function allProjects(): readonly ProjectCard[] {
  return [...RUNNING_PROJECTS, ...COMPLETED_PROJECTS, ...LABORATORY_RECORDS];
}

export function projectBySlug(slug: string): ProjectCard | undefined {
  return allProjects().find((project) => project.slug === slug);
}

export const HOME_PROJECTS: readonly ProjectCard[] = [
  RUNNING_PROJECTS[0],
  COMPLETED_PROJECTS[0],
  RUNNING_PROJECTS[6],
].filter((item): item is ProjectCard => item !== undefined);

export const ENQUIRY_SERVICE_OPTIONS = [
  { slug: 'preclinical-studies', title: 'Preclinical Studies' },
  { slug: 'molecular-research', title: 'Molecular Research' },
  { slug: 'biomedical-data-analysis', title: 'Biomedical Data Analysis' },
  { slug: 'product-enquiry', title: 'Product enquiry' },
  { slug: 'research-collaboration', title: 'Research collaboration' },
  { slug: 'other-enquiry', title: 'Other enquiry' },
] as const;

/** Held until donor consent and ethics approval are confirmed. */
export const HELD_PRODUCT_SKUS = ['CR-CEL-8402'] as const;
