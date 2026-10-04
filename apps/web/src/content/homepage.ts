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
  Building2,
  GraduationCap,
  Hospital,
  FileCheck2,
  LineChart,
  Lock,
  MessagesSquare,
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
  /** Optional bullet highlights (Stitch service cards). */
  readonly highlights?: readonly string[];
}

/**
 * Icon choices are presentation-only. Catalogue copy and service slugs are seeded separately in
 * Vendure; the slugs here must stay aligned with that catalogue.
 */
export const HOMEPAGE_SERVICES: readonly ServiceSummary[] = [
  {
    slug: 'preclinical-studies',
    title: 'Preclinical Studies',
    description:
      'Safety and efficacy testing in animal models, cells and computer simulations — scoped with ethics approval before samples move.',
    icon: Microscope,
    highlights: ['In vitro cytotoxicity assays', 'Histopathology tissue microarrays'],
  },
  {
    slug: 'molecular-research',
    title: 'Molecular Research',
    description:
      'Molecular, biochemical and histological analysis of research samples conducted in validated biosafety environments.',
    icon: Dna,
    highlights: ['RT-qPCR, ELISA and Western blotting', 'High-fidelity DNA/RNA extractions'],
  },
  {
    slug: 'metagenomic-data-analysis',
    title: 'Metagenomic Data Analysis',
    description:
      'Microbiome analysis from raw sequencing reads through QC, annotation, and publication-ready figures.',
    icon: Database,
    highlights: ['16S/18S and shotgun metagenomics', 'Alpha and beta diversity calculations'],
  },
  {
    slug: 'biomedical-omics-data-analysis',
    title: 'Biomedical and Omics Data Analysis',
    description:
      'Statistical and computational analysis of biological and clinical datasets with reproducible pipelines.',
    icon: ChartNoAxesCombined,
    highlights: ['RNA-seq differential expression', 'Multi-cohort clinical regression modelling'],
  },
  {
    slug: 'evidence-synthesis-technical-reports',
    title: 'Evidence Synthesis and Technical Reports',
    description:
      'Systematic reviews, meta-analyses, and technical reports that turn evidence into decisions.',
    icon: FileText,
    highlights: ['PRISMA-compliant search workflows', 'GRADE evidence quality grading'],
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
  /** Decorative cover served from `public/images`. */
  readonly coverSrc: string;
}

/** Research insights — slugs match CMS bootstrap posts where deployed. */
export const HOMEPAGE_ARTICLES: readonly ArticleSummary[] = [
  {
    slug: 'planning-metagenomic-submissions',
    category: 'Research methods',
    title: 'Planning a metagenomic submission',
    excerpt:
      'What to agree before transfer: read depth, controls, metadata fields, and how de-identified files should be packaged.',
    coverSrc: '/images/article-cover-data.svg',
  },
  {
    slug: 'omics-quality-control-basics',
    category: 'Data analysis',
    title: 'Omics quality control that reviewers expect',
    excerpt:
      'Documented filtering, batch awareness, and traceable figures — the minimum bar for reproducible biomedical analysis.',
    coverSrc: '/images/article-cover-research.svg',
  },
  {
    slug: 'preclinical-study-handoff',
    category: 'Laboratory',
    title: 'Handing off a preclinical study cleanly',
    excerpt:
      'Ethics approvals, compound safety data, and a written protocol before samples move — how CERA scopes animal and in-vitro work.',
    coverSrc: '/images/article-cover-lab.svg',
  },
];

export interface AudienceSegment {
  readonly title: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly icon: LucideIcon;
}

export const HOMEPAGE_AUDIENCES: readonly AudienceSegment[] = [
  {
    title: 'Universities & institutes',
    description:
      'Support for grant-funded studies that need specialist laboratory or bioinformatics capacity.',
    highlights: [
      'Written scope before work begins',
      'Methods suitable for publication',
      'Secure transfer for large datasets',
    ],
    icon: GraduationCap,
  },
  {
    title: 'Biotech & industry R&D',
    description:
      'Accelerate preclinical and omics programmes without building every capability in-house.',
    highlights: [
      'Confidential handling by default',
      'Coordinated lab and compute workflows',
      'Technical reports for decision-making',
    ],
    icon: Building2,
  },
  {
    title: 'Health & public-sector research',
    description:
      'Evidence synthesis and analysis with clear governance for sensitive or regulated data.',
    highlights: [
      'De-identified enquiry and project data',
      'Retention aligned to policy',
      'Staff-only operational notes',
    ],
    icon: Hospital,
  },
];

export interface MetricHighlight {
  readonly value: string;
  readonly label: string;
  readonly detail?: string;
}

/** Grounded in the published catalogue, process, and FAQ — not revenue or client counts. */
export const HOMEPAGE_METRICS: readonly MetricHighlight[] = [
  { value: '5', label: 'Research service lines', detail: 'End-to-end wet & dry lab' },
  { value: '5', label: 'Agreed project stages', detail: 'Rigorous QC milestones' },
  { value: '3 days', label: 'Target enquiry response', detail: 'Rapid preliminary scoping' },
  { value: '1 team', label: 'Lab, data & reporting', detail: 'Cross-disciplinary alignment' },
];

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
  body: 'CERA Medical partners with universities, biotech teams and health organisations on preclinical studies, molecular laboratory work, metagenomic and omics analysis, and evidence synthesis — with documented methods from scoping through delivery.',
  badge: {
    title: 'Scope before samples move',
    body: 'Every project starts with a written plan, agreed timelines, and outputs you can trace.',
    icon: ClipboardCheck,
  },
} as const;

export const CTA_BAND = {
  heading: 'Ready to advance your research?',
  body: 'Share your research question, materials or datasets. We respond within three working days with next steps — no clinical records on this form.',
} as const;

export interface PrincipleItem {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export const HOMEPAGE_PRINCIPLES: readonly PrincipleItem[] = [
  {
    title: 'Written scope first',
    description:
      'Every engagement records the research question, materials, deliverables, timeline and cost before laboratory or analysis work begins.',
    icon: FileCheck2,
  },
  {
    title: 'Traceable methods',
    description:
      'Protocols, software versions and parameters are documented so results can be reviewed, reproduced, or extended in a follow-on study.',
    icon: ClipboardCheck,
  },
  {
    title: 'Confidential handling',
    description:
      'Project data and samples are handled under agreed retention and access rules. The public website never collects clinical records.',
    icon: Lock,
  },
  {
    title: 'Clear communication',
    description:
      'You receive a named reference for enquiries, status updates through your account when claimed, and a defined path for revisions.',
    icon: MessagesSquare,
  },
];

export interface DeliverableItem {
  readonly title: string;
  readonly description: string;
}

export const HOMEPAGE_DELIVERABLES: readonly DeliverableItem[] = [
  {
    title: 'Study or analysis plan',
    description: 'Agreed endpoints, controls, and acceptance criteria before execution.',
  },
  {
    title: 'Results package',
    description: 'Figures, tables, and methods text suitable for internal review or publication.',
  },
  {
    title: 'Data handover',
    description: 'Processed outputs and metadata transferred through agreed secure channels.',
  },
  {
    title: 'Revision round',
    description: 'Included discussion and one structured revision cycle on delivered reporting.',
  },
];

export interface FaqPreviewItem {
  readonly question: string;
  readonly answer: string;
}

export const HOMEPAGE_FAQ_PREVIEW: readonly FaqPreviewItem[] = [
  {
    question: 'How does a project begin?',
    answer:
      'We discuss your research question, available data or materials, required outputs, scope, timeline and cost. The agreed scope is recorded in writing before work begins.',
  },
  {
    question: 'What should I include in an enquiry?',
    answer:
      'Describe the service you need, timeline, and outputs. Do not include participant names or other direct identifiers in the website form.',
  },
  {
    question: 'How quickly will you reply?',
    answer: 'We aim to respond within three working days with next steps or clarifying questions.',
  },
];

export interface ExploreLink {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly icon: LucideIcon;
}

export const HOMEPAGE_EXPLORE: readonly ExploreLink[] = [
  {
    title: 'How we work',
    description:
      'Five project stages from scoping through follow-up, with quality checks at each step.',
    href: '/methodology',
    icon: Workflow,
  },
  {
    title: 'About CERA Medical',
    description:
      'Laboratory, computational, and reporting capabilities for biomedical research partners.',
    href: '/about',
    icon: LineChart,
  },
  {
    title: 'Get started',
    description: 'Contact details, service request guidance, and what happens after you submit.',
    href: '/contact',
    icon: MessagesSquare,
  },
];
