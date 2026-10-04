import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Dna,
  FlaskConical,
  Mail,
  Microscope,
  PawPrint,
  Send,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';

import { AppButtonLink, AppLink } from '../link.tsx';

const TRUST = [
  { title: 'SECP-Registered', detail: 'R&D Corporate Entity' },
  { title: 'PhD-Led Team', detail: 'Principal Investigators' },
  { title: 'ISO 15189 / GLP', detail: 'Standard Operating SOPs' },
  { title: 'Client IP Ownership', detail: '100% Data Protection' },
] as const;

const PILLARS = [
  {
    domain: 'Domain 01',
    title: 'Preclinical Evaluation',
    accent: 'border-t-primary-700',
    icon: PawPrint,
    body: 'Rigorous physiological validation testing candidate therapeutics through specialized animal models (mice, rats, rabbits, guinea pigs), high-throughput in vitro cellular assays (glioblastoma, primary somatic cultures), and in silico ligand docking & molecular dynamics.',
    items: [
      'Rodent & Lagomorph Institutional Vivarium',
      'IC50 Cytotoxicity, Apoptosis & Migration Assays',
      'GROMACS & AutoDock Vina In Silico Simulations',
    ],
  },
  {
    domain: 'Domain 02',
    title: 'Molecular Biology & Wet-Lab',
    accent: 'border-t-accent',
    icon: FlaskConical,
    body: 'Validated BSL-2 analytical testing facilities executing Sanger cycle sequencing, QuantStudio RT-qPCR, semi-quantitative Western blotting, high-sensitivity sandwich ELISA, tissue micro-sectioning, and high-fidelity nucleic acid extraction.',
    items: [
      'Applied Biosystems 3500 Capillary Electrophoresis',
      'TaqMan & SYBR Green Real-Time PCR Quantitation',
      'Histological Cryosectioning & Immunofluorescence',
    ],
  },
  {
    domain: 'Domain 03',
    title: 'Bioinformatics & Omics Pipelines',
    accent: 'border-t-primary-700',
    icon: Dna,
    body: 'Petabyte-scale Nextflow pipelines executing 16S/ITS and shotgun metagenomics profiling, differential RNA-seq expression analysis, whole-genome/exome variant calling, phylogenetic reconstruction, and statistically robust biostatistics.',
    items: [
      'nf-core Standardized Nextflow Workflows',
      'DESeq2 / edgeR Normalized Differential Expression',
      'GATK4 Germline & Somatic Variant Annotation',
    ],
  },
  {
    domain: 'Domain 04',
    title: 'Evidence Synthesis & Reports',
    accent: 'border-t-accent',
    icon: BarChart3,
    body: 'PRISMA-compliant systematic reviews, meta-analyses with Cochrane RoB 2 assessments, GRADE certainty grading, clinical guideline synthesis, and authoritative technical whitepapers for global universities and multilateral healthcare NGOs.',
    items: [
      'PROSPERO Protocol Registration & PRISMA Flow',
      'Random-Effects Meta-Analysis & Funnel Plot Audits',
      'Publishable Manuscripts & Policy Brief Deliverables',
    ],
  },
] as const;

const STAGES = [
  {
    n: '01',
    title: 'Written Scoping & Specification',
    body: 'Endpoints, statistical power targets, precise timeline, milestone billing, and explicit deliverables locked in a master services agreement.',
    tag: 'Deliverable Contract',
  },
  {
    n: '02',
    title: 'Protocol Clearance & Statistical Locking',
    body: 'IAEC and IRB institutional ethics clearances obtained. Randomization schedules, blinded codes, and analytical workflows pre-registered.',
    tag: 'Ethics Sanction',
  },
  {
    n: '03',
    title: 'Experimental & Computational Execution',
    body: 'Execution with biological/technical replicates, calibrated instrument controls, and temperature-logged cryogenic chain of custody.',
    tag: 'Standardized Run',
  },
  {
    n: '04',
    title: 'Analysis & Technical Reporting',
    body: 'Generation of publication-ready vector charts, statistical test logs, normalized raw tables, and comprehensive method monographs.',
    tag: 'Formatted Data Pack',
  },
  {
    n: '05',
    title: 'Client Consultation & Revision',
    body: 'Live technical review with study directors and included structured revision rounds to calibrate peer-review or regulatory submission.',
    tag: 'Director Debrief',
  },
] as const;

const WHY = [
  {
    title: 'PhD-Level Scientific Leadership',
    body: 'Every study is planned, executed, and supervised directly by specialized principal investigators with extensive track records in peer-reviewed biomedical literature.',
  },
  {
    title: 'Traceable & Reproducible Workflows',
    body: 'Every analysis includes explicit random seeds, container SHA tags, exact software version numbers, and documented parameter files to enable effortless external validation.',
  },
  {
    title: 'Absolute Client Ownership',
    body: 'You own 100% of all generated experimental data, raw sequencing files, code scripts, and intellectual property. No royalty claims, no hidden encumbrances.',
  },
  {
    title: 'Transparent Scoping & Pricing',
    body: 'Detailed work orders define turnaround times, statistical parameters, and fixed pricing prior to sample accessioning. No surprise overrun invoices.',
  },
  {
    title: 'Included Revision Rounds',
    body: 'Structured post-delivery consultation with study directors to adjust figure aesthetics, recalibrate colorways, or re-run statistical tests for journal submission.',
  },
  {
    title: 'Zero Clinical Data on Public Systems',
    body: 'Patient biospecimens are strictly de-identified with 2D cryptographic barcode hashes before facility intake. We operate strictly isolated, air-gapped compute clusters.',
  },
] as const;

export function AboutProfile() {
  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-site items-center gap-2 px-6 py-3 text-caption text-muted md:px-10">
          <AppLink href="/">Home</AppLink>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-heading">About CERA Medical</span>
        </div>
      </nav>

      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="mb-4 inline-flex items-center gap-2 rounded-sm border border-accent bg-surface px-3 py-1 text-caption font-semibold tracking-wider text-accent uppercase">
            INSTITUTIONAL PROFILE · BIOMEDICAL RESEARCH & DEVELOPMENT
          </p>
          <Heading level={1} size="h1" className="mb-4">
            About CERA Medical
          </Heading>
          <Text size="body-lg" className="mb-3 max-w-4xl font-medium">
            A biomedical research and development company providing laboratory, computational and
            evidence services.
          </Text>
          <Text tone="muted" className="mb-8 max-w-4xl">
            Bridging bench wet-lab experimentation with advanced in silico computational analysis to
            deliver reproducible, publication-ready findings for research teams, universities, and
            biotech innovators globally.
          </Text>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-card"
              >
                <Icon icon={ShieldCheck} size="lg" className="text-accent" />
                <div>
                  <Heading level={2} size="h4">
                    {item.title}
                  </Heading>
                  <Text size="caption" tone="muted">
                    {item.detail}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="text-caption font-semibold tracking-wider text-accent uppercase">
            Core Capabilities & Services
          </p>
          <Heading level={2} size="h2" className="mt-1 mb-4">
            Integrated Biomedical Pipelines from Bench to In Silico
          </Heading>
          <Text tone="muted" className="mb-12 max-w-3xl">
            CERA Medical is an SECP-registered biomedical research and development company. We test
            candidate treatments in animal models, cells and computer simulations; run molecular
            laboratory work; analyse microbiome, omics and clinical data; and prepare evidence
            reviews and technical reports for health research and decision-making.
          </Text>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.domain}
                className={`relative overflow-hidden rounded-lg border border-border border-t-4 bg-surface p-6 shadow-card ${pillar.accent}`}
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-lg bg-surface-tint text-primary-700">
                  <Icon icon={pillar.icon} size="lg" />
                </div>
                <span className="rounded-sm bg-surface-tint px-2 py-0.5 text-xs font-semibold tracking-wide text-primary uppercase">
                  {pillar.domain}
                </span>
                <Heading level={3} size="h3" className="mt-2 mb-3">
                  {pillar.title}
                </Heading>
                <Text tone="muted" className="mb-6">
                  {pillar.body}
                </Text>
                <ul className="space-y-2 border-t border-border pt-4">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-caption">
                      <Icon icon={CheckCircle2} size="sm" className="text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="text-caption font-semibold tracking-wider text-accent uppercase">
            Governance & Standard Operating Procedures
          </p>
          <Heading level={2} size="h2" className="mt-1 mb-4">
            How Every Project Runs: The 5-Stage Governance Lifecycle
          </Heading>
          <Text tone="muted" className="mb-12 max-w-3xl">
            Every project follows five stages: scoping, protocol, execution, analysis and reporting,
            then follow-up. Animal studies begin only after institutional animal ethics committee
            (IAEC) approval. Deliverables are defined in writing before materials or data move.
          </Text>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {STAGES.map((stage) => (
              <div
                key={stage.n}
                className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-card"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-on-primary">
                      {stage.n}
                    </span>
                    <span className="text-[11px] tracking-wider text-muted uppercase">Phase</span>
                  </div>
                  <Heading level={3} size="h4" className="mb-2">
                    {stage.title}
                  </Heading>
                  <Text size="caption" tone="muted">
                    {stage.body}
                  </Text>
                </div>
                <div className="mt-4 border-t border-border pt-3 text-xs font-semibold text-accent">
                  {stage.tag}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-r-lg border border-l-4 border-l-accent border-border bg-surface p-4">
            <Text size="caption">
              <strong className="text-heading">Zero Unapproved Protocol Deviations:</strong> Any
              modification to sample preparation, primer concentrations, or animal dosing regimens
              requires formal written study director and client addendum sign-off before proceeding.
            </Text>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="text-caption font-semibold tracking-wider text-accent uppercase">
            Physical Infrastructure
          </p>
          <Heading level={2} size="h2" className="mt-1 mb-4">
            Facilities & Laboratory Infrastructure
          </Heading>
          <Text tone="muted" className="mb-12 max-w-3xl">
            Headquartered at the Pak-Austria Fachhochschule: Institute of Applied Sciences and
            Technology (PAF-IAST) in Haripur, Pakistan, our physical laboratories and
            high-performance computing clusters satisfy international GLP and BSL-2 biocontainment
            requirements.
          </Text>
          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <FacilityShowcase
              src="/images/article-cover-lab.svg"
              caption="Robotic Pipetting & Digital Microscopy Suite (Haripur)"
              title="Automated High-Throughput Screening Suite"
              body="Multi-channel robotic liquid handling workstations paired with fluorescence imaging enable automated cell-based phenotyping, serial microplate dilutions, and real-time kinetic assay readings under continuous laminar air purification."
              tags={['BSL-2 Laminar Flow', 'Tecan Automation', 'Sub-micron Optics']}
            />
            <FacilityShowcase
              src="/images/article-cover-research.svg"
              caption="Cellular Pharmacology & Inverted Phase Microscopy Lab"
              title="Primary Somatic & Glioblastoma Culture Suite"
              body="Controlled climate cell culture incubation facilities equipped for continuous primary cell maintenance, drug resistance screening, and live-cell morphological tracking with validated containment against cross-lineage mycoplasma contamination."
              tags={[
                'Mycoplasma-Certified',
                'High-Density Plate Formats',
                'Phase-Contrast Logging',
              ]}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <InfraCard
              title="Controlled Animal Vivarium"
              body="Institutional Animal Ethics Committee (IAEC) approved facility with HEPA-filtered individually ventilated cages (IVC), strict diurnal light cycling, and dedicated treatment/quarantine units for rodents and lagomorphs."
              meta="Location: Haripur Research Campus"
            />
            <InfraCard
              title="Cell Culture Cleanrooms"
              body="Dedicated Class II Type A2 biosafety cabinets, CO₂ water-jacketed incubators, liquid nitrogen cryogenic cell banking, and inverted phase-contrast digital microscopy units."
              meta="Specification: BSL-2 Registered"
            />
            <InfraCard
              title="Genomics & Molecular Suite"
              body="Applied Biosystems 3500 Genetic Analyzer for Sanger sequencing, QuantStudio 5 Real-Time qPCR, Qubit 4 fluorometric quantitation, and bioanalyzer microfluidic RNA integrity verification."
              meta="Capabilities: Capillary & Quantitative PCR"
            />
            <InfraCard
              title="Histopathology Laboratory"
              body="Rotary microtomes, cryostats, automated tissue infiltration processors, and multi-channel immunofluorescence slide preparation for rodent and human biopsies."
              meta="Micro-sectioning: 2μm to 10μm Precision"
            />
            <div className="rounded-lg border border-border bg-surface p-5 md:col-span-2">
              <Heading level={3} size="h4" className="mb-3">
                Computational Research Cluster & Secure Data Vault
              </Heading>
              <Text size="caption" tone="muted" className="mb-3">
                Enterprise server nodes provisioned with high-memory GPUs for Amber/GROMACS
                atomistic simulations. Containerized Docker and Singularity runtimes executing
                locked Nextflow workflows with cryptographic hashing of intermediate and primary raw
                outputs.
              </Text>
              <Text size="caption">
                • Air-gapped Cold Archival · SHA-256 Checksum Data Integrity · Isolated Compute
              </Text>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="text-caption font-semibold tracking-wider text-accent uppercase">
              Institutional Reliability
            </p>
            <Heading level={2} size="h2" className="mt-1 mb-3">
              Why Work with CERA Medical
            </Heading>
            <Text tone="muted">
              Scientific rigor, total client intellectual property rights, and uncompromising
              analytical reproducibility at every milestone.
            </Text>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {WHY.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-surface p-6 shadow-card"
              >
                <Heading level={3} size="h4" className="mb-2">
                  {item.title}
                </Heading>
                <Text size="caption" tone="muted">
                  {item.body}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-caption font-semibold tracking-wider text-accent uppercase">
                Institutional Access
              </p>
              <Heading level={2} size="h2" className="mt-1 mb-4">
                Getting in Touch with CERA Medical
              </Heading>
              <Text tone="muted" className="mb-6">
                Use our service enquiry forms or reach our administrative and laboratory base
                directly. Please do not submit direct patient identifiers when transferring initial
                case summaries.
              </Text>
              <div className="mb-6 rounded-lg border border-border bg-surface-tint p-4">
                <div className="mb-2 flex items-center gap-3 text-heading">
                  <Icon icon={Mail} size="md" className="text-accent" />
                  Direct Communications
                </div>
                <p className="mb-1">
                  <a className="font-semibold text-primary" href="mailto:contact@ceramedical.org">
                    contact@ceramedical.org
                  </a>
                </p>
                <Text size="caption" tone="muted">
                  Secondary: <a href="mailto:theceramedica@gmail.com">theceramedica@gmail.com</a>
                </Text>
              </div>
              <AppButtonLink href="/enquiry" variant="primary">
                <Icon icon={Send} size="sm" />
                Make an Enquiry
              </AppButtonLink>
            </div>
            <div className="rounded-lg border border-border bg-surface p-6 shadow-card lg:col-span-7 lg:p-8">
              <Heading level={3} size="h4" className="mb-6 flex items-center gap-2">
                <Icon icon={Building2} size="md" className="text-accent" />
                Institutional Base & Laboratory Coordinates
              </Heading>
              <div className="space-y-6">
                <div className="flex items-start gap-4 border-b border-border pb-5">
                  <div className="rounded-lg bg-surface-tint p-2.5 text-primary">
                    <Icon icon={Microscope} size="lg" />
                  </div>
                  <div>
                    <Heading level={4} size="h4">
                      Physical Laboratory & Specimen Intake
                    </Heading>
                    <Text className="mt-1">
                      Room B2-105, B2 Building, Department of Biological and Health Sciences
                    </Text>
                    <Text size="caption" tone="muted" className="mt-0.5">
                      Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology
                      (PAF-IAST), Khanpur Road, Mang, Haripur, Khyber Pakhtunkhwa, Pakistan.
                    </Text>
                    <span className="mt-2 inline-block rounded-sm bg-surface-tint px-2 py-0.5 text-xs font-semibold text-primary">
                      Specimen Receiving: Mon–Fri (09:00 - 16:00 PKT)
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-surface-tint p-2.5 text-accent">
                    <Icon icon={Building2} size="lg" />
                  </div>
                  <div>
                    <Heading level={4} size="h4">
                      Administrative & Executive Directorate
                    </Heading>
                    <Text className="mt-1">
                      2nd Floor, Business Incubation Center (BIC), C2 Building
                    </Text>
                    <Text size="caption" tone="muted" className="mt-0.5">
                      Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology
                      (PAF-IAST), Mang, Haripur, Pakistan.
                    </Text>
                    <span className="mt-2 inline-block rounded-sm bg-surface-tint px-2 py-0.5 text-xs font-semibold text-accent">
                      Corporate Reg: SECP Islamabad Jurisdiction
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-700 py-12 text-on-primary">
        <div className="mx-auto flex max-w-site flex-col items-center justify-between gap-6 px-6 md:flex-row md:px-10">
          <div className="max-w-2xl">
            <Heading level={2} size="h3" className="mb-2 text-on-primary">
              Ready to Advance Your Research?
            </Heading>
            <Text className="text-on-primary/90">
              Discuss your study protocol, sequencing run, or evidence synthesis needs with our
              study directors. We reply within three working days.
            </Text>
          </div>
          <AppButtonLink href="/enquiry" variant="accent">
            Start a Project Conversation
          </AppButtonLink>
        </div>
      </section>
    </>
  );
}

function FacilityShowcase({
  src,
  caption,
  title,
  body,
  tags,
}: {
  readonly src: string;
  readonly caption: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="relative h-72 w-full overflow-hidden bg-surface-tint">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="absolute bottom-3 left-3 rounded-sm bg-primary-900/85 px-3 py-1 text-xs text-on-primary">
          {caption}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <Heading level={3} size="h4" className="mb-2">
            {title}
          </Heading>
          <Text size="caption" tone="muted" className="mb-4">
            {body}
          </Text>
        </div>
        <div className="flex flex-wrap gap-4 border-t border-border pt-3 text-xs font-semibold text-accent">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function InfraCard({
  title,
  body,
  meta,
}: {
  readonly title: string;
  readonly body: string;
  readonly meta: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <Heading level={3} size="h4" className="mb-3">
        {title}
      </Heading>
      <Text size="caption" tone="muted" className="mb-3">
        {body}
      </Text>
      <Text size="caption">{meta}</Text>
    </div>
  );
}
