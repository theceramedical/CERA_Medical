import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Dna,
  FlaskConical,
  Mail,
  Microscope,
  Send,
} from 'lucide-react';

import type { ContentDocument } from '@cera/contracts';

import {
  SERVICE_DOMAINS,
  SERVICE_PORTFOLIO,
  type ServiceDomain,
} from '../../content/service-portfolio.ts';
import { serviceCardIcon } from '../../lib/service-card-icon';
import { AppButtonLink, AppLink } from '../link.tsx';

import type { ServicesCatalogueLabels, ServicesPageHero } from '../../lib/services-page-layout.ts';
import type { LucideIcon } from 'lucide-react';

const FALLBACK_ICONS: Record<string, LucideIcon> = {
  'preclinical-studies': FlaskConical,
  'molecular-research': Dna,
  'metagenomic-data-analysis': Microscope,
  'biomedical-omics-data-analysis': BarChart3,
  'evidence-synthesis-technical-reports': ClipboardList,
};

const DEFAULT_HERO: ServicesPageHero = {
  eyebrow: 'CLINICAL RESEARCH INFRASTRUCTURE',
  heading: 'Complete Service Portfolio',
  body: 'CERA Medical provides biomedical research and development services. We support principal investigators, biopharma developers, and academic institutions through validated analytical protocols and strict ethical frameworks.',
  badges: [
    'Institutional Animal Ethics Board',
    'BSL-2 Validated Biosafety',
    'Reproducible Omics Pipelines',
  ],
};

export function ServicePortfolio({
  query,
  domain,
  degraded,
  presentations,
  hero,
  catalogueLabels,
}: {
  readonly query?: string;
  readonly domain?: string;
  readonly degraded?: boolean;
  readonly presentations: readonly ContentDocument[];
  readonly hero?: ServicesPageHero;
  readonly catalogueLabels?: ServicesCatalogueLabels;
}) {
  const pageHero = hero ?? DEFAULT_HERO;
  const labels = catalogueLabels;
  const presentationBySlug = new Map(presentations.map((item) => [item.slug, item]));
  const activeDomain = (domain ?? 'all') as 'all' | ServiceDomain;
  const q = query?.trim().toLowerCase() ?? '';

  const lines = SERVICE_PORTFOLIO.filter((line) => {
    if (activeDomain !== 'all' && line.domain !== activeDomain) return false;
    const copy = presentationBySlug.get(line.slug);
    const title = copy?.title ?? line.title;
    const description = copy?.excerpt ?? line.description;
    if (q.length === 0) return true;
    return (
      title.toLowerCase().includes(q) ||
      description.toLowerCase().includes(q) ||
      line.capabilities.some((item) => item.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {degraded ? (
        <div className="border-b border-border bg-surface-tint">
          <div className="mx-auto flex max-w-site items-center gap-2.5 px-6 py-2.5 text-caption text-muted md:px-10">
            {labels?.degradedAlert ??
              'Live catalogue data is temporarily unavailable. Showing the last known services.'}
          </div>
        </div>
      ) : null}

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="mb-4 inline-flex items-center gap-2 rounded-sm border border-border bg-surface-tint px-2.5 py-1 text-caption font-semibold text-accent uppercase">
                {pageHero.eyebrow}
              </p>
              <Heading level={1} size="h1" className="mb-3">
                {pageHero.heading}
              </Heading>
              <Text size="body-lg" tone="muted" className="max-w-2xl">
                {pageHero.body}
              </Text>
              <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-4">
                {pageHero.badges.map((badge) => (
                  <Text key={badge} size="caption" tone="muted">
                    {badge}
                  </Text>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-tint p-5 shadow-card lg:col-span-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-caption tracking-wide text-heading">LAB ACCREDITATION</span>
                <span className="rounded-sm border border-accent/30 bg-surface px-2 py-0.5 text-[11px] font-semibold text-accent">
                  VALIDATED
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {[
                  ['5', 'Core Disciplines'],
                  ['100%', 'Pre-scoped SLAs'],
                  ['<72h', 'Scoping Turnaround'],
                  ['GLP', 'Quality Directives'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <div className="text-h3 font-bold tabular-nums text-heading">{value}</div>
                    <div className="text-caption text-muted">{label}</div>
                  </div>
                ))}
              </div>
              <Text size="caption" tone="muted" className="mt-4 border-t border-border pt-3">
                Batch records & code preserved per project
              </Text>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-40 border-b border-border bg-surface shadow-sm">
        <div className="mx-auto max-w-site px-6 py-4 md:px-10">
          <form
            method="get"
            className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="w-full lg:max-w-md">
              <label
                className="mb-1 block text-caption text-heading"
                htmlFor="service-search-input"
              >
                {labels?.searchLabel ?? 'Search services'}
              </label>
              <div className="relative">
                <input
                  id="service-search-input"
                  name="q"
                  defaultValue={query ?? ''}
                  placeholder="e.g. sequencing, preclinical, histopathology, omics..."
                  className="h-11 w-full rounded-md border border-border bg-surface px-3 pr-24 text-body"
                />
                <button
                  type="submit"
                  className="absolute top-1 right-1 bottom-1 rounded-md bg-primary-700 px-4 text-caption font-semibold text-on-primary"
                >
                  {labels?.applyLabel ?? 'Apply'}
                </button>
              </div>
            </div>
            {activeDomain !== 'all' ? (
              <input type="hidden" name="domain" value={activeDomain} />
            ) : null}
          </form>
          <div
            className="mt-4 flex items-center gap-2 overflow-x-auto"
            role="tablist"
            aria-label="Research Domains"
          >
            {SERVICE_DOMAINS.map((tab) => {
              const selected = tab.id === activeDomain;
              const href =
                tab.id === 'all'
                  ? '/services'
                  : `/services?domain=${tab.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
              return (
                <AppLink
                  key={tab.id}
                  href={href}
                  aria-current={selected ? 'page' : undefined}
                  className={
                    selected
                      ? 'whitespace-nowrap rounded-md bg-primary-700 px-3.5 py-2 text-caption font-semibold text-on-primary no-underline'
                      : 'whitespace-nowrap rounded-md border border-border px-3.5 py-2 text-caption text-muted no-underline hover:bg-surface-tint'
                  }
                >
                  {tab.label}
                </AppLink>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-site px-6 py-12 md:px-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            {lines.map((line) => {
              const copy = presentationBySlug.get(line.slug);
              const LucideIcon =
                serviceCardIcon(copy?.cardIcon) ?? FALLBACK_ICONS[line.slug] ?? FlaskConical;
              const highlights =
                copy?.cardHighlights !== undefined && copy.cardHighlights.length > 0
                  ? copy.cardHighlights
                  : line.capabilities;
              const border =
                line.accent === 'secondary' ? 'border-t-accent' : 'border-t-primary-700';
              return (
                <article
                  key={line.slug}
                  className={`rounded-lg border border-border border-t-4 bg-surface p-6 shadow-card ${border}`}
                >
                  <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-tint-2 text-primary-700">
                        <Icon icon={LucideIcon} size="lg" />
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold tracking-wider text-accent uppercase">
                          {line.line}
                        </span>
                        <Heading level={2} size="h3">
                          {copy?.title ?? line.title}
                        </Heading>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-sm border border-accent bg-surface-tint px-2.5 py-1 text-caption font-semibold text-accent">
                      <span className="size-1.5 rounded-full bg-accent" />
                      {line.badge}
                    </span>
                  </div>
                  <Text tone="muted" className="mb-5">
                    {copy?.excerpt ?? line.description}
                  </Text>
                  <div className="mb-5">
                    <h3 className="mb-2.5 text-caption tracking-wider text-muted uppercase">
                      Key Capabilities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {highlights.map((cap) => (
                        <span
                          key={cap}
                          className="rounded-md border border-border bg-surface-subtle px-3 py-1 text-caption text-heading"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6 flex items-center gap-2 rounded-md border border-border bg-surface-tint px-4 py-2.5">
                    <Text size="caption" className="font-medium">
                      {line.note}
                    </Text>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <AppButtonLink href={`/services/${line.slug}`} variant="outline">
                      Learn More
                      <Icon icon={ArrowRight} size="sm" />
                    </AppButtonLink>
                    <AppButtonLink href={`/enquiry?service=${line.slug}`} variant="primary">
                      Request Scoping
                    </AppButtonLink>
                  </div>
                </article>
              );
            })}

            <div className="rounded-lg border border-dashed border-border bg-surface-subtle p-6 text-center">
              <Heading level={3} size="h4" className="mb-1">
                Looking for a custom laboratory or bioinformatics assay?
              </Heading>
              <Text tone="muted" className="mx-auto mb-4 max-w-xl">
                Can&apos;t find the specific protocol? Contact our study directors directly for
                custom bioinformatics workflows or specialized in-vitro assays.
              </Text>
              <AppLink href="/contact" className="inline-flex items-center gap-1 font-semibold">
                Direct consultation with Study Directors
                <Icon icon={ArrowRight} size="sm" />
              </AppLink>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="sticky top-44 rounded-lg border border-border bg-surface p-6 shadow-md">
              <p className="mb-2 text-caption tracking-wider text-accent uppercase">
                INITIAL SCOPING
              </p>
              <Heading level={3} size="h4" className="mb-3">
                Start a project conversation
              </Heading>
              <Text tone="muted" className="mb-5">
                Tell us about your research question, materials or data, expected outputs and
                timeline. Scope, cost and delivery are agreed in writing before work begins.
              </Text>
              <AppButtonLink href="/enquiry" variant="primary" fullWidth className="mb-6">
                Request a Service Consultation
                <Icon icon={Send} size="sm" />
              </AppButtonLink>
              <div className="space-y-3.5 border-t border-border pt-5">
                <h4 className="text-caption tracking-wide text-heading uppercase">
                  Core Assurances
                </h4>
                <Text size="caption" className="font-medium">
                  Reply target: within three working days
                </Text>
                <Text size="caption" className="font-medium">
                  Do not include direct participant identifiers
                </Text>
                <Text size="caption" className="font-medium">
                  Protocol, timeline and deliverables documented
                </Text>
              </div>
              <div className="-mx-6 -mb-6 mt-6 rounded-b-lg border-t border-border bg-surface-tint p-6">
                <span className="mb-1 block text-caption uppercase text-muted">
                  Institutional Direct Inquiries
                </span>
                <a
                  href="mailto:contact@ceramedical.org"
                  className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary"
                >
                  <Icon icon={Mail} size="sm" className="text-accent" />
                  contact@ceramedical.org
                </a>
                <Text size="caption" tone="muted" className="mt-1">
                  Haripur, KPK, Pakistan Facility
                </Text>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-tint p-5">
              <Heading level={4} size="h4" className="mb-2">
                Chain of Custody
              </Heading>
              <Text size="caption" tone="muted">
                All biological specimens and sequencing libraries logged with digital cryogenic
                tracking systems and immutable checksum verification.
              </Text>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
