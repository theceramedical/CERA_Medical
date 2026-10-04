export type ServiceDomain = 'preclinical' | 'molecular' | 'omics' | 'evidence';

export interface ServicePortfolioLine {
  readonly slug: string;
  readonly line: string;
  readonly title: string;
  readonly badge: string;
  readonly description: string;
  readonly capabilities: readonly string[];
  readonly note: string;
  readonly domain: ServiceDomain;
  readonly accent: 'primary' | 'secondary';
}

export const SERVICE_DOMAINS: readonly { id: 'all' | ServiceDomain; label: string }[] = [
  { id: 'all', label: 'All Services (5)' },
  { id: 'preclinical', label: 'Preclinical & Animal Work' },
  { id: 'molecular', label: 'Molecular & Wet Lab' },
  { id: 'omics', label: 'Bioinformatics & Omics' },
  { id: 'evidence', label: 'Evidence Synthesis & Reports' },
];

export const SERVICE_PORTFOLIO: readonly ServicePortfolioLine[] = [
  {
    slug: 'preclinical-studies',
    line: 'SERVICE LINE 01',
    title: 'Preclinical Studies',
    badge: 'Ethical Scoping Validated',
    description:
      'Safety and efficacy testing in animal models, cells and computer simulations — scoped with ethics approval before samples move.',
    capabilities: [
      'In vivo animal models (mice, rats, rabbits)',
      'In vitro cell culture',
      'In silico docking & dynamics',
      'Institutional animal ethics approval',
    ],
    note: 'Scope, timeline and cost agreed in writing for each project',
    domain: 'preclinical',
    accent: 'primary',
  },
  {
    slug: 'molecular-research',
    line: 'SERVICE LINE 02',
    title: 'Molecular Research',
    badge: 'Sterile Biosafety BSL-2',
    description:
      'Molecular, biochemical and histological analysis of research samples conducted in validated sterile biosafety environments.',
    capabilities: [
      'Sanger sequencing',
      'RT-qPCR',
      'Western blot',
      'ELISA',
      'Histopathology & Microscopy',
      'Coded human sample handling',
    ],
    note: 'Wet-lab protocols validated with defined controls and replicates',
    domain: 'molecular',
    accent: 'secondary',
  },
  {
    slug: 'metagenomic-data-analysis',
    line: 'SERVICE LINE 03',
    title: 'Metagenomic Data Analysis',
    badge: 'Reproducible BioCompute',
    description:
      'Microbiome analysis from raw sequencing reads to publication-ready results with rigorous QC, taxonomic profiling, and functional annotation.',
    capabilities: [
      'Whole-metagenome shotgun',
      '16S/ITS rRNA',
      'MAGs assembly',
      'Alpha/Beta diversity',
      'FASTQ/FASTA pipelines',
    ],
    note: 'Typical delivery target: within 3 weeks, subject to project scope',
    domain: 'omics',
    accent: 'primary',
  },
  {
    slug: 'biomedical-omics-data-analysis',
    line: 'SERVICE LINE 04',
    title: 'Biomedical and Omics Data Analysis',
    badge: 'Secure Governance',
    description:
      'Statistical and computational analysis of biological and clinical datasets with fully reproducible pipelines and code repositories.',
    capabilities: [
      'WGS/Exome variant calling',
      'RNA-seq differential expression',
      'Biostatistics',
      'Multi-cohort regression modeling',
    ],
    note: 'De-identified data handling under strict data governance protocols',
    domain: 'omics',
    accent: 'secondary',
  },
  {
    slug: 'evidence-synthesis-technical-reports',
    line: 'SERVICE LINE 05',
    title: 'Evidence Synthesis and Technical Reports',
    badge: 'PRISMA & GRADE',
    description:
      'Systematic reviews, meta-analyses, and regulatory whitepapers that transform clinical evidence into actionable strategic decisions.',
    capabilities: [
      'PRISMA-compliant systematic reviews',
      'GRADE evidence grading',
      'UN/NGO/donor reports',
      'Policy briefs',
    ],
    note: 'Proposal, timeline and cost agreed for each project',
    domain: 'evidence',
    accent: 'primary',
  },
];
