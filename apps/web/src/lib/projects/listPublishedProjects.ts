import 'server-only';

import { unstable_cache } from 'next/cache';

import { publicizeCmsMediaUrl } from '../cms/media-url.ts';

export type ProjectCategory =
  'Preclinical Studies' | 'Molecular Research' | 'Biomedical Data Analysis';
export type ProjectStatus = 'Running' | 'Completed';

export interface PublicProject {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly category: ProjectCategory;
  readonly status: ProjectStatus;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  readonly publicationUrl?: string;
}

interface PayloadMedia {
  readonly url?: string | null;
  readonly alt?: string | null;
}

interface PayloadProject {
  readonly id?: string | number;
  readonly slug?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly category?: string;
  readonly projectStatus?: string;
  readonly image?: PayloadMedia | string | number | null;
  readonly imageAlt?: string | null;
  readonly publicationUrl?: string | null;
}

interface PayloadList {
  readonly docs?: readonly PayloadProject[];
}

const CMS_TIMEOUT_MS = 4000;
const CATEGORY_LABELS: readonly string[] = [
  'Preclinical Studies',
  'Molecular Research',
  'Biomedical Data Analysis',
];

function cmsApiUrl(): string {
  return process.env.CMS_API_URL ?? process.env.CMS_URL ?? 'http://localhost:3001/api';
}

function mapProject(project: PayloadProject): PublicProject | null {
  if (
    (typeof project.id !== 'string' && typeof project.id !== 'number') ||
    typeof project.slug !== 'string' ||
    typeof project.title !== 'string' ||
    typeof project.summary !== 'string' ||
    !CATEGORY_LABELS.includes(project.category ?? '') ||
    (project.projectStatus !== 'Running' && project.projectStatus !== 'Completed')
  ) {
    return null;
  }

  const base: PublicProject = {
    id: project.slug,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    category: project.category as ProjectCategory,
    status: project.projectStatus,
    ...(project.publicationUrl?.startsWith('https://')
      ? { publicationUrl: project.publicationUrl }
      : {}),
  };
  if (project.image !== null && typeof project.image === 'object') {
    const imageUrl = publicizeCmsMediaUrl(project.image.url ?? null);
    if (imageUrl !== null) {
      return {
        ...base,
        imageUrl,
        imageAlt: project.imageAlt ?? project.image.alt ?? '',
      };
    }
  }
  return project.imageAlt ? { ...base, imageAlt: project.imageAlt } : base;
}

export const FALLBACK_CLIENT_PROJECTS: readonly PublicProject[] = [
  {
    id: 'methamphetamine-induced-neurotoxicity',
    slug: 'methamphetamine-induced-neurotoxicity',
    title: 'Methamphetamine-induced neurotoxicity',
    summary:
      'A mouse model of methamphetamine exposure in which a natural compound is tested for protective and restorative effects on recognition memory, neuroinflammation and neuronal cell death.',
    category: 'Preclinical Studies',
    status: 'Running',
  },
  {
    id: 'social-isolation-stress',
    slug: 'social-isolation-stress',
    title: 'Social isolation stress',
    summary:
      'The effect of early-life social isolation on the brain and on behaviour, including vulnerability to drug dependence in later life.',
    category: 'Preclinical Studies',
    status: 'Running',
  },
  {
    id: 'morphine-dependence',
    slug: 'morphine-dependence',
    title: 'Morphine dependence',
    summary:
      'Mouse models of morphine dependence and withdrawal, used to test candidate treatments and the signalling pathways through which they act.',
    category: 'Preclinical Studies',
    status: 'Running',
  },
  {
    id: 'nicotine-models',
    slug: 'nicotine-models',
    title: 'Nicotine harm-reduction models',
    summary:
      'Rodent models of nicotine exposure, in which candidate products are tested for harm-reduction potential.',
    category: 'Preclinical Studies',
    status: 'Running',
  },
  {
    id: 'natural-products-in-glioblastoma',
    slug: 'natural-products-in-glioblastoma',
    title: 'Natural products in glioblastoma',
    summary:
      'In vitro and in silico evaluation of bioactive plant extracts against human glioblastoma multiforme cell lines.',
    category: 'Preclinical Studies',
    status: 'Running',
  },
  {
    id: 'in-silico-target-identification',
    slug: 'in-silico-target-identification',
    title: 'In silico target identification',
    summary:
      'Molecular docking and molecular dynamics simulation of natural compounds against targets in metabolic disease and neurodegeneration.',
    category: 'Preclinical Studies',
    status: 'Running',
  },
  {
    id: 'infant-gut-microbiome-development',
    slug: 'infant-gut-microbiome-development',
    title: 'Infant gut microbiome development',
    summary:
      'A longitudinal study tracking microbiome maturation from birth through the first year of life in a Pakistani cohort.',
    category: 'Biomedical Data Analysis',
    status: 'Completed',
  },
  {
    id: 'mother-infant-gut-microbiome-transmission',
    slug: 'mother-infant-gut-microbiome-transmission',
    title: 'Mother-infant gut microbiome transmission',
    summary: 'Metagenomic analysis of microbial transfer during vaginal and caesarean delivery.',
    category: 'Biomedical Data Analysis',
    status: 'Completed',
  },
  {
    id: 'oral-microbiome-of-pre-school-children',
    slug: 'oral-microbiome-of-pre-school-children',
    title: 'Oral microbiome of pre-school children',
    summary:
      'Metagenomic profiling of the oral microbiome in relation to dental caries and nutritional status.',
    category: 'Biomedical Data Analysis',
    status: 'Completed',
  },
];

/** Reads published project records; falls back to verified client projects when CMS is offline. */
export async function listPublishedProjects(): Promise<readonly PublicProject[]> {
  const cached = unstable_cache(
    async (): Promise<readonly PublicProject[]> => {
      const url = new URL(`${cmsApiUrl().replace(/\/$/, '')}/projects`);
      url.searchParams.set('where[fixture][not_equals]', 'true');
      url.searchParams.set('limit', '100');
      url.searchParams.set('depth', '1');
      url.searchParams.set('sort', 'projectStatus,sortOrder,slug');
      try {
        const response = await fetch(url, {
          headers: { accept: 'application/json' },
          next: { tags: ['cms:projects'] },
          signal: AbortSignal.timeout(CMS_TIMEOUT_MS),
        });
        if (!response.ok) return FALLBACK_CLIENT_PROJECTS;
        const payload = (await response.json()) as PayloadList;
        const mapped = (payload.docs ?? [])
          .map(mapProject)
          .filter((project): project is PublicProject => project !== null);
        return mapped.length > 0 ? mapped : FALLBACK_CLIENT_PROJECTS;
      } catch {
        return FALLBACK_CLIENT_PROJECTS;
      }
    },
    ['cms', 'projects', 'published'],
    { tags: ['cms:projects'] },
  );
  return cached();
}
