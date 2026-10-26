import { Heading, Text } from '@cera/ui/typography';

import type { ContentDocument } from '@cera/contracts';

import { AppLink } from '../link.tsx';
import { TeamSection } from '../team-section.tsx';

/**
 * Design inventory only. No roles or photos are supplied here, so none of these entries are
 * displayed by the static fallback. Public biographies belong in the existing editable CMS fields
 * after client confirmation.
 */
export const ABOUT_TEAM_PROFILE_DESIGN = [
  { name: 'Dr. Muhammad Imran Khan', requiresConfirmation: true },
  { name: 'Dr. Fazal Wahab', requiresConfirmation: true },
  { name: 'Dr. Waqar Khalid Saeed', requiresConfirmation: true },
  { name: 'Habab Ali Ahmad', requiresConfirmation: true },
  { name: 'Ayesha Khan', requiresConfirmation: true },
  { name: 'Jalal Khan Utman', requiresConfirmation: true },
] as const;

/** Keep known profiles in the CMS, but hide them until the client approves current roles and photos. */
export const ABOUT_TEAM_PROFILES_REQUIRING_CONFIRMATION = new Set([
  'Dr. Muhammad Imran Khan',
  'Dr. Fazal Wahab',
  'Dr. Waqar Khalid Saeed',
  'Habab Ali Ahmad',
  'Ayesha Khan',
  'Jalal Khan Utman',
]);

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
          <span aria-current="page" className="font-semibold text-heading">About CERA Medical</span>
        </div>
      </nav>

      <section className="border-b border-border bg-surface-tint">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Text size="eyebrow" className="font-semibold tracking-[0.15em] text-accent uppercase">CERA Medical</Text>
          <Heading level={1} size="h1" className="mt-3">About CERA Medical</Heading>
          <Text size="body-lg" measure className="mt-6 max-w-4xl leading-relaxed">
            CERA Medical is an SECP-registered biomedical research and development company based at
            the Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST),
            Haripur, Pakistan. We test candidate treatments in animal models, in cells and by
            computer simulation, run the molecular laboratory work that supports those studies, and
            analyse metagenomic, omics and health data through to publication-ready results.
          </Text>
        </div>
      </section>

      <section aria-labelledby="mission-heading" className="border-b border-border bg-surface py-12 md:py-16">
        <div className="mx-auto grid max-w-site gap-8 px-6 md:grid-cols-2 md:px-10">
          <article className="border-s-2 border-primary ps-5">
            <Heading id="mission-heading" level={2} size="h3">Mission</Heading>
            <Text size="body-lg" tone="muted" className="mt-3">
              To provide rigorous preclinical, molecular and data analysis services that help
              researchers move candidate treatments and health findings closer to practical use.
            </Text>
          </article>
          <article className="border-s-2 border-accent ps-5">
            <Heading level={2} size="h3">Vision</Heading>
            <Text size="body-lg" tone="muted" className="mt-3">
              To be a trusted research partner for universities, industry and health organisations
              in Pakistan and abroad.
            </Text>
          </article>
        </div>
      </section>

      {teamDocument ? <TeamSection document={teamDocument} /> : null}

      <section aria-labelledby="facilities-heading" className="border-b border-border bg-surface-tint-2 py-12 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <Heading id="facilities-heading" level={2} size="h2">Facilities</Heading>
          <div className="mt-7 grid gap-8 md:grid-cols-2">
            <div>
              <Heading level={3} size="h4">Our labs</Heading>
              <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
                {FACILITIES.map((item) => (
                  <li key={item} className="border border-border bg-surface px-4 py-3 text-body-sm">{item}</li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-surface p-5 sm:p-6">
              <Heading level={3} size="h4">Computational infrastructure</Heading>
              <Text tone="muted" className="mt-3">
                NVIDIA Tesla V100 GPU and Intel Xeon Gold processor, used for molecular dynamics
                simulation, sequencing data analysis and other compute-intensive work.
              </Text>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="why-heading" className="border-b border-border bg-surface py-12 md:py-16">
        <div className="mx-auto max-w-site px-6 md:px-10">
          <Heading id="why-heading" level={2} size="h2">Why CERA Medical</Heading>
          <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((reason) => (
              <li key={reason.title} className="border-t-2 border-primary bg-surface-subtle p-5">
                <Heading level={3} size="h4">{reason.title}</Heading>
                <Text size="body-sm" tone="muted" className="mt-2">{reason.body}</Text>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
