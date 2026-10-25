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

import { FacilityMedia } from '../facility-media.tsx';
import { AppButtonLink, AppLink } from '../link.tsx';

const TRUST = [
  { title: 'SECP-Registered', detail: 'R&D Corporate Entity' },
  { title: 'Expert Team', detail: 'PhD-level researchers' },
  { title: 'Documented Methods', detail: 'Reproducible workflows' },
  { title: 'Client Data Ownership', detail: 'Confidential handling' },
] as const;

const TEAM = [
  {
    name: 'Dr. Muhammad Imran Khan',
    role: 'PI, Head of Drug Testing',
    detail: 'Assistant Professor, Department of Biomedical Sciences, PAF-IAST',
    photo: '/images/team/muhammad-imran-khan.jpg',
  },
  {
    name: 'Dr. Fazal Wahab',
    role: 'Lead Animal Studies',
    detail: 'Associate Professor',
    photo: '/images/team/fazal-wahab.jpg',
  },
  {
    name: 'Dr. Waqar Khalid Saeed',
    role: 'Lead Disease Modeling and Clinical Studies',
    detail: 'Assistant Professor',
    photo: '/images/team/waqar-khalid-saeed.jpg',
  },
  {
    name: 'Habab Ali Ahmad',
    role: 'Community Lead and Research Scientist',
    detail: '',
    photo: '/images/team/habab-ali-ahmad.jpg',
  },
  {
    name: 'Ayesha Khan',
    role: 'Preclinical Researcher',
    detail: '',
    photo: '/images/team/ayesha-khan.jpg',
  },
  {
    name: 'Jalal Khan Utman',
    role: 'Research Assistant',
    detail: 'In-silico studies',
    photo: '/images/team/jalal-khan-utman.jpg',
  },
] as const;

const PILLARS = [
  {
    domain: 'Domain 01',
    title: 'Preclinical Evaluation',
    accent: 'border-t-primary-700',
    icon: PawPrint,
    body: 'Safety and efficacy testing in animal models, cell-based systems and computer simulations. Studies may combine in vivo, in vitro and in silico methods to investigate a candidate treatment.',
    items: [
      'Animal models of disease',
      'Cell viability, proliferation and function assays',
      'Molecular docking and dynamics simulations',
    ],
  },
  {
    domain: 'Domain 02',
    title: 'Molecular Biology & Wet-Lab',
    accent: 'border-t-accent',
    icon: FlaskConical,
    body: 'Molecular, biochemical and histological analysis of research samples, including Sanger sequencing, PCR, RT-PCR, Western blot, ELISA, tissue staining and microscopy.',
    items: [
      'Sequencing and genetic analysis',
      'Gene and protein expression analysis',
      'Histopathology and quantitative microscopy',
    ],
  },
  {
    domain: 'Domain 03',
    title: 'Bioinformatics & Omics Pipelines',
    accent: 'border-t-primary-700',
    icon: Dna,
    body: 'Analysis of shotgun metagenomic and 16S/ITS sequencing data, genomic variants, and other biological and clinical datasets, with documented methods and publication-ready results.',
    items: [
      'Read-based and genome-resolved metagenomics',
      'Diversity and differential abundance analysis',
      'Genomic variant annotation and biostatistics',
    ],
  },
  {
    domain: 'Domain 04',
    title: 'Evidence Synthesis & Reports',
    accent: 'border-t-accent',
    icon: BarChart3,
    body: 'Systematic reviews, meta-analyses, health-sector assessments and technical reports that turn published evidence and programme data into usable findings.',
    items: [
      'Reviews reported to the PRISMA standard',
      'Situation analyses and health-sector assessments',
      'Technical reports and policy briefs',
    ],
  },
] as const;

const STAGES = [
  {
    n: '01',
    title: 'Scoping',
    body: 'We discuss your research question, available materials or data, and required output, then agree the scope, timeline and cost in writing.',
    tag: 'Agreed scope',
  },
  {
    n: '02',
    title: 'Protocol',
    body: 'We prepare the study protocol or analysis plan before work starts. Animal studies require institutional animal ethics committee approval first.',
    tag: 'Written plan',
  },
  {
    n: '03',
    title: 'Execution',
    body: 'The assigned scientist carries out the work with the controls, replicates and quality checks defined in the protocol.',
    tag: 'Quality checks',
  },
  {
    n: '04',
    title: 'Analysis & Reporting',
    body: 'Results are analysed with documented methods and delivered with figures, tables and methods text suitable for a report or manuscript.',
    tag: 'Research report',
  },
  {
    n: '05',
    title: 'Follow-up',
    body: 'A consultation call is available on delivery, and revision rounds are included.',
    tag: 'Review & revisions',
  },
] as const;

const WHY = [
  {
    title: 'PhD-Level Scientific Leadership',
    body: 'PhD-level researchers and bioinformaticians bring active biomedical research experience to each project.',
  },
  {
    title: 'Traceable & Reproducible Workflows',
    body: 'Established tools are used in documented, reproducible analysis workflows. Methods state the tools, versions and parameters used.',
  },
  {
    title: 'Client Data Ownership',
    body: 'Client files, samples and generated results remain the client’s property. Research collaborations may set separate ownership and authorship terms in writing.',
  },
  {
    title: 'Transparent Scoping & Pricing',
    body: 'The scope, timeline, cost and expected outputs are agreed in writing before work starts.',
  },
  {
    title: 'Included Revision Rounds',
    body: 'A consultation call is available on delivery, and revision rounds help bring the outputs in line with the agreed research requirements.',
  },
  {
    title: 'Confidential Data Handling',
    body: 'Clients are asked to provide de-identified data and coded samples. A non-disclosure agreement is available on request before transfer.',
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
          <p className="mb-4 inline-flex items-center gap-2 rounded-sm border border-accent bg-surface px-3 py-1 text-caption font-semibold tracking-wider text-accent-fill uppercase">
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
                <Icon icon={ShieldCheck} size="lg" className="text-accent-fill" />
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

      <section className="border-b border-border bg-surface" aria-labelledby="team-heading">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="text-caption font-semibold tracking-wider text-accent-fill uppercase">
            Our team
          </p>
          <Heading level={2} size="h2" id="team-heading" className="mt-1 mb-4">
            The people behind the work
          </Heading>
          <Text tone="muted" className="mb-10 max-w-3xl">
            Preclinical, molecular and computational research at CERA Medical is led by this team.
          </Text>
          <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map((person) => (
              <li
                key={person.name}
                className="overflow-hidden rounded-lg border border-border bg-surface shadow-card"
              >
                <img
                  src={person.photo}
                  alt=""
                  className="aspect-[4/5] w-full object-cover object-top"
                />
                <div className="p-5">
                  <Heading level={3} size="h4">
                    {person.name}
                  </Heading>
                  <Text size="body-sm" className="mt-1 font-semibold text-accent-fill">
                    {person.role}
                  </Text>
                  {person.detail.length > 0 ? (
                    <Text size="caption" tone="muted" className="mt-1">
                      {person.detail}
                    </Text>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="text-caption font-semibold tracking-wider text-accent-fill uppercase">
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
                      <Icon icon={CheckCircle2} size="sm" className="text-accent-fill" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="text-caption font-semibold tracking-wider text-accent-fill uppercase">
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
                <div className="mt-4 border-t border-border pt-3 text-xs font-semibold text-accent-fill">
                  {stage.tag}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-r-lg border border-l-4 border-l-accent border-border bg-surface p-4">
            <Text size="caption">
              <strong className="text-heading">Protocol-led studies:</strong> Controls, replicates
              and quality checks are defined before work begins. Animal studies start only after the
              institutional animal ethics committee approves the protocol.
            </Text>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <p className="text-caption font-semibold tracking-wider text-accent-fill uppercase">
            Physical Infrastructure
          </p>
          <Heading level={2} size="h2" className="mt-1 mb-4">
            Facilities & Laboratory Infrastructure
          </Heading>
          <Text tone="muted" className="mb-12 max-w-3xl">
            Our facilities at PAF-IAST in Haripur include an Animal House, Cell Culture Lab,
            Genomics Lab with Sanger sequencing, Histopathology Lab and Microscopy Lab. Computing
            resources support molecular simulations and sequencing analysis.
          </Text>
          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <FacilityShowcase
              src="/images/article-cover-lab.svg"
              caption="Illustration of laboratory research"
              title="Genomics & Microscopy Labs"
              body="Molecular analysis and tissue imaging support studies through sequencing, gene and protein expression work, histopathology and quantitative microscopy."
              tags={['Sanger Sequencing', 'Histopathology', 'Microscopy']}
            />
            <FacilityShowcase
              src="/images/article-cover-research.svg"
              caption="Illustration of cell-based research"
              title="Cell Culture Lab"
              body="Cell-based disease models, including glioblastoma cell lines, support quantitative testing of viability, proliferation and treatment effects."
              tags={['Cell-Based Models', 'Cellular Assays', 'Therapeutic Testing']}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <InfraCard
              title="Animal House"
              body="Studies in animal models of disease use mice, rats, rabbits and guinea pigs. Each animal study requires an approved institutional animal ethics protocol before work begins."
              meta="Location: Haripur, Pakistan"
            />
            <InfraCard
              title="Cell Culture Lab"
              body="Cell-based models and assays measure viability, proliferation, function and molecular pathways relevant to a study."
              meta="Capability: In vitro studies"
            />
            <InfraCard
              title="Genomics Lab"
              body="Sanger sequencing and PCR-based genetic analysis, with RT-PCR for gene expression and supporting molecular assays."
              meta="Capabilities: Sequencing & PCR"
            />
            <InfraCard
              title="Histopathology Laboratory"
              body="Tissue processing and staining, including H&E, Nissl and immunohistochemistry, followed by imaging and quantitative analysis."
              meta="Capability: Tissue analysis"
            />
            <div className="rounded-lg border border-border bg-surface p-5 md:col-span-2">
              <Heading level={3} size="h4" className="mb-3">
                Computational Research Infrastructure
              </Heading>
              <Text size="caption" tone="muted" className="mb-3">
                GPU resources support molecular dynamics simulation, sequencing data analysis and
                other compute-intensive research. The agreed analysis plan defines the tools and
                outputs for each project.
              </Text>
              <Text size="caption">• Molecular dynamics · Metagenomics · Omics analysis</Text>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="text-caption font-semibold tracking-wider text-accent-fill uppercase">
              Institutional Reliability
            </p>
            <Heading level={2} size="h2" className="mt-1 mb-3">
              Why Work with CERA Medical
            </Heading>
            <Text tone="muted">
              Scientific expertise, documented workflows, confidential handling and
              publication-ready outputs.
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
              <p className="text-caption font-semibold tracking-wider text-accent-fill uppercase">
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
                  <Icon icon={Mail} size="md" className="text-accent-fill" />
                  Direct Communications
                </div>
                <p className="mb-1">
                  <a className="font-semibold text-primary" href="mailto:contact@ceramedical.org">
                    contact@ceramedical.org
                  </a>
                </p>
                <Text size="caption" tone="muted">
                  Secondary: <a href="mailto:theceramedical@gmail.com">theceramedical@gmail.com</a>
                </Text>
              </div>
              <AppButtonLink href="/enquiry" variant="primary">
                <Icon icon={Send} size="sm" />
                Make an Enquiry
              </AppButtonLink>
            </div>
            <div className="rounded-lg border border-border bg-surface p-6 shadow-card lg:col-span-7 lg:p-8">
              <Heading level={3} size="h4" className="mb-6 flex items-center gap-2">
                <Icon icon={Building2} size="md" className="text-accent-fill" />
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
                      Contact us before sending samples
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-surface-tint p-2.5 text-accent-fill">
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
                    <span className="mt-2 inline-block rounded-sm bg-surface-tint px-2 py-0.5 text-xs font-semibold text-accent-fill">
                      SECP-registered company
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
        <FacilityMedia src={src} alt="" />
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
        <div className="flex flex-wrap gap-4 border-t border-border pt-3 text-xs font-semibold text-accent-fill">
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
