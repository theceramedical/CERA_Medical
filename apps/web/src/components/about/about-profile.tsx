import { Heading, Text } from '@cera/ui/typography';

import type { ContentDocument } from '@cera/contracts';

import { AppLink } from '../link.tsx';
import { TeamSection } from '../team-section.tsx';

/**
 * All 6 team profiles confirmed with client roles, designations, photos, and contact info.
 */
export interface ConfirmedTeamMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly designation?: string;
  readonly photo: {
    readonly url: string;
    readonly alt: string;
  };
  readonly biography?: string;
  readonly links?: readonly {
    readonly label: string;
    readonly url: string;
  }[];
}

export const CONFIRMED_TEAM_MEMBERS: readonly ConfirmedTeamMember[] = [
  {
    id: 'muhammad-imran-khan',
    name: 'Dr. Muhammad Imran Khan',
    role: 'PI, Head of Drug Testing',
    designation: 'Assistant Professor, Department of Biomedical Sciences, PAF-IAST',
    photo: {
      url: '/images/team/muhammad-imran-khan.jpg',
      alt: 'Dr. Muhammad Imran Khan',
    },
    biography:
      'Principal Investigator leading preclinical drug evaluation, behavioral neuroscience assays, neurotoxicity modeling, and pharmacological screening.',
    links: [],
  },
  {
    id: 'fazal-wahab',
    name: 'Dr. Fazal Wahab',
    role: 'Lead Animal Studies',
    designation: 'Associate Professor',
    photo: {
      url: '/images/team/fazal-wahab.jpg',
      alt: 'Dr. Fazal Wahab',
    },
    biography:
      'Expert in laboratory animal house operations, rodent disease models, physiological biomarkers, and ethical animal research governance.',
    links: [],
  },
  {
    id: 'waqar-khalid-saeed',
    name: 'Dr. Waqar Khalid Saeed',
    role: 'Lead Disease Modeling and Clinical Studies',
    designation: 'Assistant Professor',
    photo: {
      url: '/images/team/waqar-khalid-saeed.jpg',
      alt: 'Dr. Waqar Khalid Saeed',
    },
    biography:
      'Lead in translational disease modeling, pathology mechanisms, metabolic pathways, and protocol development for research studies.',
    links: [],
  },
  {
    id: 'habab-ali-ahmad',
    name: 'Habab Ali Ahmad',
    role: 'Community Lead / Research Scientist',
    designation: 'Research Scientist',
    photo: {
      url: '/images/team/habab-ali-ahmad.jpg',
      alt: 'Habab Ali Ahmad',
    },
    biography:
      'Research scientist coordinating academic and industrial partnerships, study delivery pipelines, and biomedical research collaborations.',
    links: [],
  },
  {
    id: 'ayesha-khan',
    name: 'Ayesha Khan',
    role: 'Preclinical Researcher',
    designation: 'Preclinical Researcher',
    photo: {
      url: '/images/team/ayesha-khan.jpg',
      alt: 'Ayesha Khan',
    },
    biography:
      'Preclinical researcher specializing in animal handling, behavioral testing, in vivo dosing protocols, tissue harvesting, and cellular assays.',
    links: [
      {
        label: 'Iayshak.han8@gmail.com',
        url: 'mailto:Iayshak.han8@gmail.com',
      },
    ],
  },
  {
    id: 'jalal-khan-utman',
    name: 'Jalal Khan Utman',
    role: 'Research Assistant',
    designation: 'In-silico studies',
    photo: {
      url: '/images/team/jalal-khan-utman.jpg',
      alt: 'Jalal Khan Utman',
    },
    biography:
      'Research assistant conducting computational molecular docking, drug-target interaction screening, and GPU-accelerated molecular dynamics simulations.',
    links: [],
  },
];

export const ABOUT_TEAM_PROFILE_DESIGN = CONFIRMED_TEAM_MEMBERS.map((m) => ({
  name: m.name,
  requiresConfirmation: false,
}));

/** Client has confirmed all 6 profiles; empty set allows all members to render immediately. */
export const ABOUT_TEAM_PROFILES_REQUIRING_CONFIRMATION = new Set<string>();

const FACILITIES = [
  'Animal House',
  'Cell Culture Lab',
  'Genomics Lab with Sanger sequencing',
  'Histopathology Lab',
  'Microscopy Lab',
] as const;

const REASONS = [
  {
    title: 'Expert team',
    body: 'PhD-level researchers and bioinformaticians with active biomedical research backgrounds.',
  },
  {
    title: 'Validated pipelines',
    body: 'Established tools in reproducible, fully documented workflows.',
  },
  {
    title: 'Strict confidentiality',
    body: 'All data handled securely; a non-disclosure agreement is available on request.',
  },
  {
    title: 'Publication-ready output',
    body: 'Figures, methods text and reports suitable for direct use in a manuscript.',
  },
  {
    title: 'Transparent process',
    body: 'Regular updates, with full data ownership retained by the client.',
  },
  {
    title: 'Revision rounds included',
    body: 'Outputs are revised until they meet your research requirements.',
  },
] as const;

export function AboutProfile({ teamDocument }: { readonly teamDocument?: ContentDocument }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-site items-center gap-2 px-6 py-3 text-caption text-muted md:px-10">
          <AppLink href="/">Home</AppLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-semibold text-heading">
            About CERA Medical
          </span>
        </div>
      </nav>

      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
            CERA Medical
          </Text>
          <Heading level={1} size="h1" className="mt-3">
            About CERA Medical
          </Heading>
          <Text size="body-lg" measure className="mt-6 max-w-4xl leading-relaxed">
            CERA Medical is an SECP-registered biomedical research and development company based at
            the Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST),
            Haripur, Pakistan. We test candidate treatments in animal models, in cells and by
            computer simulation, run the molecular laboratory work that supports those studies, and
            analyse metagenomic, omics and health data through to publication-ready results.
          </Text>
        </div>
      </section>

      <section
        aria-labelledby="mission-heading"
        className="border-b border-border bg-surface py-12 md:py-16"
      >
        <div className="mx-auto grid max-w-site gap-8 px-6 md:grid-cols-2 md:px-10">
          <article className="border-s-2 border-primary ps-5">
            <Heading id="mission-heading" level={2} size="h3">
              Mission
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-3">
              To provide rigorous preclinical, molecular and data analysis services that help
              researchers move candidate treatments and health findings closer to practical use.
            </Text>
          </article>
          <article className="border-s-2 border-accent ps-5">
            <Heading level={2} size="h3">
              Vision
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-3">
              To be a trusted research partner for universities, industry and health organisations
              in Pakistan and abroad.
            </Text>
          </article>
        </div>
      </section>

      <TeamSection document={teamDocument} />

      <section
        aria-labelledby="facilities-heading"
        className="border-b border-border bg-surface-tint-2 py-12 md:py-16"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <Heading id="facilities-heading" level={2} size="h2">
            Facilities
          </Heading>
          <div className="mt-7 grid gap-8 md:grid-cols-2">
            <div>
              <Heading level={3} size="h4">
                Our labs
              </Heading>
              <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
                {FACILITIES.map((item) => (
                  <li key={item} className="border border-border bg-surface px-4 py-3 text-body-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-surface p-5 sm:p-6">
              <Heading level={3} size="h4">
                Computational infrastructure
              </Heading>
              <Text tone="muted" className="mt-3">
                NVIDIA Tesla V100 GPU and Intel Xeon Gold processor, used for molecular dynamics
                simulation, sequencing data analysis and other compute-intensive work.
              </Text>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="collaborators-heading"
        className="border-b border-border bg-surface py-12 md:py-16"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <div className="max-w-3xl">
            <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">
              Collaborations & Alliances
            </Text>
            <Heading id="collaborators-heading" level={2} size="h2" className="mt-2">
              Institutional Partners
            </Heading>
            <Text size="body-lg" tone="muted" className="mt-3">
              CERA Medical works in close partnership with veterinary healthcare providers,
              pharmaceutical innovators, and public-sector science and technology directorates.
            </Text>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-subtle p-6 text-center">
              <div className="flex h-20 w-full items-center justify-center overflow-hidden">
                <img
                  src="/images/partners/vet-tec.jpg"
                  alt="Vet Tec Health Care Logo"
                  className="max-h-16 w-auto object-contain"
                  loading="lazy"
                />
              </div>
              <Heading level={3} size="h4" className="mt-4">
                Vet Tec Health Care
              </Heading>
              <Text size="caption" tone="muted" className="mt-1">
                Veterinary Healthcare & Preclinical In Vivo Partner
              </Text>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-subtle p-6 text-center">
              <div className="flex h-20 w-full items-center justify-center overflow-hidden">
                <img
                  src="/images/partners/sequel-pharma.png"
                  alt="Sequel Pharma Logo"
                  className="max-h-16 w-auto object-contain"
                  loading="lazy"
                />
              </div>
              <Heading level={3} size="h4" className="mt-4">
                Sequel Pharma
              </Heading>
              <Text size="caption" tone="muted" className="mt-1">
                Pharmaceutical Research & Formulation Collaborator
              </Text>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-subtle p-6 text-center">
              <div className="flex h-20 w-full items-center justify-center overflow-hidden">
                <img
                  src="/images/partners/dost-kp.png"
                  alt="Directorate General of Science and Technology KP Logo"
                  className="max-h-16 w-auto object-contain"
                  loading="lazy"
                />
              </div>
              <Heading level={3} size="h4" className="mt-4">
                DG Science & Technology KP
              </Heading>
              <Text size="caption" tone="muted" className="mt-1">
                Government of Khyber Pakhtunkhwa Scientific Directorate
              </Text>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="why-heading"
        className="border-b border-border bg-surface-tint py-12 md:py-16"
      >
        <div className="mx-auto max-w-site px-6 md:px-10">
          <Heading id="why-heading" level={2} size="h2">
            Why CERA Medical
          </Heading>
          <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((reason) => (
              <li key={reason.title} className="border-t-2 border-primary bg-surface-subtle p-5">
                <Heading level={3} size="h4">
                  {reason.title}
                </Heading>
                <Text size="body-sm" tone="muted" className="mt-2">
                  {reason.body}
                </Text>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
