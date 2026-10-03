import {
  Microscope,
  Dna,
  Database,
  ChartNoAxesCombined,
  FileText,
  ClipboardCheck,
  Search,
  ShieldCheck,
  FlaskConical,
  Users,
  Workflow,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

/**
 * Public-facing CERA Medical content supplied by the client.
 *
 * **Why this is not `@cera/contracts/fixtures`.** The fixture package says plainly that nothing in it
 * is imported by application code, and it is right to: every fixture is wrapped in a `Fixture` marker,
 * carries test email domains and synthetic subject ids, and pulls twelve enquiries and their histories
 * along with it. Bundling that into a client build to render six card titles would be a poor trade, and
 * the marker exists precisely so fixture data cannot be mistaken for real data at runtime.
 *
 * Real catalogue descriptions come from the client-approved CERA service brief.
 */

export interface ServiceSummary {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

/**
 * Icon choices are presentation-only. Catalogue copy and service slugs are seeded separately in
 * Vendure; the slugs here must stay aligned with that catalogue.
 */
export const HOMEPAGE_SERVICES: readonly ServiceSummary[] = [
  {
    slug: 'preclinical-studies',
    title: 'Preclinical Studies',
    description: 'Safety and efficacy testing in animal models, cells and computer simulations.',
    icon: Microscope,
  },
  {
    slug: 'molecular-research',
    title: 'Molecular Research',
    description: 'Molecular, biochemical and histological analysis of research samples.',
    icon: Dna,
  },
  {
    slug: 'metagenomic-data-analysis',
    title: 'Metagenomic Data Analysis',
    description: 'Microbiome analysis from raw sequencing reads to publication-ready results.',
    icon: Database,
  },
  {
    slug: 'biomedical-omics-data-analysis',
    title: 'Biomedical and Omics Data Analysis',
    description: 'Statistical and computational analysis of biological and clinical datasets.',
    icon: ChartNoAxesCombined,
  },
  {
    slug: 'evidence-synthesis-technical-reports',
    title: 'Evidence Synthesis and Technical Reports',
    description: 'Reviews, assessments and reports that turn evidence into decisions.',
    icon: FileText,
  },
];

export interface ProcessStepContent {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export const HOMEPAGE_PROCESS: readonly ProcessStepContent[] = [
  {
    title: 'Scoping',
    description:
      'Agree the research question, available data or materials, scope, timeline and cost.',
    icon: Search,
  },
  {
    title: 'Protocol',
    description: 'Prepare the study protocol or analysis plan before work begins.',
    icon: ClipboardCheck,
  },
  {
    title: 'Execution',
    description: 'Carry out the agreed work with defined controls, replicates and quality checks.',
    icon: FlaskConical,
  },
  {
    title: 'Analysis and reporting',
    description: 'Deliver results with figures, tables and documented methods.',
    icon: Workflow,
  },
  {
    title: 'Follow-up',
    description: 'Discuss delivered work and complete included revision rounds.',
    icon: Users,
  },
];

export interface ArticleSummary {
  readonly slug: string;
  readonly category: string;
  readonly title: string;
  readonly excerpt: string;
}

export const HOMEPAGE_ARTICLES: readonly ArticleSummary[] = [];

export interface TrustItem {
  readonly label: string;
  readonly icon: LucideIcon;
}

/** The three-item row beneath the hero's buttons. */
export const HERO_TRUST_ITEMS: readonly TrustItem[] = [
  { label: 'Documented methods', icon: ClipboardCheck },
  { label: 'Reproducible analysis', icon: ShieldCheck },
  { label: 'Research team support', icon: Users },
];

/**
 * The hero's words, as data rather than inline JSX.
 *
 * The headline is split because the reference sets line one in navy and line two in teal, and the two
 * have to render inside a single `<h1>`. Keeping the halves as separate strings makes that explicit -
 * and makes it obvious that the split is a colour decision, not two headings.
 */
export const HERO = {
  eyebrow: 'Biomedical Research and Development',
  headlinePrimary: 'Research Services,',
  headlineAccent: 'From Study to Report.',
  body: 'Preclinical studies, molecular laboratory work, data analysis and evidence synthesis for research teams and health organisations.',
  badge: {
    title: 'Research with clear methods',
    body: 'Documented workflows and outputs agreed for your project.',
    icon: ClipboardCheck,
  },
} as const;

export const CTA_BAND = {
  heading: 'Ready to advance your research?',
  body: 'Tell us about your project and the service you need.',
} as const;
