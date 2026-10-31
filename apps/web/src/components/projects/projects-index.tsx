import { Heading, Text } from '@cera/ui/typography';
import { ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';

import { FacilityMedia } from '../facility-media.tsx';
import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
import { AppButtonLink } from '../link.tsx';

import type { PublicProject, ProjectStatus } from '../../lib/projects/listPublishedProjects.ts';

function ProjectCard({ project }: { readonly project: PublicProject }) {
  const isMouseModel =
    project.category === 'Preclinical Studies' ||
    project.title.toLowerCase().includes('neurotoxicity') ||
    project.title.toLowerCase().includes('morphine') ||
    project.title.toLowerCase().includes('stress') ||
    project.title.toLowerCase().includes('nicotine') ||
    project.summary.toLowerCase().includes('mouse') ||
    project.summary.toLowerCase().includes('rodent');

  return (
    <li
      id={project.slug}
      className="scroll-mt-28 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs transition-all hover:border-primary/40 hover:shadow-card"
    >
      {/* Top category stripe */}
      <div
        className={`h-1.5 w-full ${
          isMouseModel
            ? 'bg-primary'
            : project.category === 'Molecular Research'
              ? 'bg-accent'
              : 'bg-primary-300'
        }`}
      />

      {project.imageUrl ? (
        <div className="relative aspect-[16/9] w-full bg-surface-subtle">
          <FacilityMedia src={project.imageUrl} alt={project.imageAlt ?? ''} />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-surface-tint px-3 py-1 text-caption font-semibold text-heading">
            {project.category}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-caption font-semibold ${
              project.status === 'Running'
                ? 'border border-primary/25 bg-primary-50 text-primary'
                : 'border border-accent/30 bg-teal-50 text-accent'
            }`}
          >
            {project.status === 'Running' ? 'Active Study' : 'Completed Cohort'}
          </span>

          {isMouseModel ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary-50 px-2.5 py-1 text-caption font-bold text-primary">
              <LabMouseIcon size={13} />
              In Vivo Mus musculus
            </span>
          ) : null}
        </div>

        <Heading level={3} size="h4">
          {project.title}
        </Heading>

        <Text tone="muted" className="mt-3 flex-1 text-body-sm leading-relaxed">
          {project.summary}
        </Text>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          {project.status === 'Completed' && project.publicationUrl ? (
            <a
              href={project.publicationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-primary underline hover:text-primary-700"
            >
              <span>View Publication</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : (
            <span className="text-[0.72rem] font-semibold text-muted">
              Haripur Research vivarium & labs
            </span>
          )}

          <AppButtonLink
            href={`/contact?service=preclinical-studies&project=${encodeURIComponent(project.slug)}#contact-form`}
            variant="outline"
            size="sm"
            iconStart={
              <LabMouseIcon
                size={14}
                className="text-primary transition-transform group-hover:scale-110"
              />
            }
          >
            Scope Study
          </AppButtonLink>
        </div>
      </div>
    </li>
  );
}

function ProjectGroup({
  status,
  projects,
}: {
  readonly status: ProjectStatus;
  readonly projects: readonly PublicProject[];
}) {
  const heading =
    status === 'Running'
      ? 'Active In Vivo & Laboratory Studies'
      : 'Completed Cohorts & Metagenomic Projects';
  const id = status.toLowerCase();

  return (
    <section className="mt-14 first:mt-0" aria-labelledby={`${id}-projects-heading`}>
      <div className="flex items-center justify-between">
        <Heading level={2} size="h2" id={`${id}-projects-heading`}>
          {heading}
        </Heading>
        <span className="rounded-full bg-surface-subtle px-3 py-1 text-caption font-semibold text-muted">
          {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
        </span>
      </div>

      {projects.length > 0 ? (
        <ul className="mt-6 grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      ) : (
        <Text tone="muted" className="mt-4">
          There are no {status.toLowerCase()} projects to show right now.
        </Text>
      )}
    </section>
  );
}

export function ProjectsIndex({ projects }: { readonly projects: readonly PublicProject[] }) {
  const runningCount = projects.filter((p) => p.status === 'Running').length;
  const completedCount = projects.filter((p) => p.status === 'Completed').length;

  return (
    <>
      <header className="border-b border-border bg-gradient-to-b from-surface-tint via-surface to-surface-tint-2">
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-surface px-3.5 py-1 text-caption font-semibold text-heading shadow-xs">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary-50 text-primary">
              <LabMouseIcon size={13} />
            </span>
            <span className="text-primary font-bold">Haripur Animal House Vivarium</span>
            <span className="text-muted">•</span>
            <span className="text-accent font-semibold">
              {runningCount} Active Animal & Lab Studies
            </span>
          </div>

          <Heading level={1} size="h1" className="mt-3">
            Our Research Projects
          </Heading>

          <Text size="body-lg" tone="muted" measure className="mt-4 max-w-3xl leading-relaxed">
            A selection of the in vivo disease models, behavioral phenotyping studies, and
            metagenomic cohort analyses running or completed by CERA Medical. All animal protocols
            are governed by Institutional Animal Ethics Committee (IAEC) review.
          </Text>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#running"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-caption font-semibold text-heading no-underline transition-colors hover:border-primary hover:text-primary"
            >
              <LabMouseIcon size={14} className="text-primary" />
              Active Studies ({runningCount})
            </a>
            <a
              href="#completed"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-caption font-semibold text-heading no-underline transition-colors hover:border-accent hover:text-accent"
            >
              <CheckCircle2 size={14} className="text-accent" />
              Completed Cohorts ({completedCount})
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div id="running">
          <ProjectGroup
            status="Running"
            projects={projects.filter((project) => project.status === 'Running')}
          />
        </div>

        <div id="completed" className="mt-14">
          <ProjectGroup
            status="Completed"
            projects={projects.filter((project) => project.status === 'Completed')}
          />
        </div>

        {/* Study Scoping Action Banner */}
        <div className="mt-16 rounded-2xl border border-primary/25 bg-gradient-to-r from-surface to-surface-tint p-6 sm:p-10 shadow-card">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-primary uppercase">
                <ShieldCheck size={16} />
                Collaborative Preclinical Research
              </div>
              <Heading level={2} size="h3" className="mt-2">
                Have a candidate compound or cohort to investigate?
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-2 leading-relaxed">
                We partner with academic investigators, biotech startups, and pharmaceutical firms
                to execute rigorous in vivo animal models and bioinformatic pipelines under written
                protocols.
              </Text>
            </div>
            <AppButtonLink
              href="/contact#contact-form"
              variant="primary"
              size="lg"
              iconStart={
                <LabMouseIcon size={17} className="transition-transform group-hover:scale-110" />
              }
              iconEnd={<ArrowRight size={16} aria-hidden="true" />}
            >
              Start Study Scoping
            </AppButtonLink>
          </div>
        </div>
      </main>
    </>
  );
}
