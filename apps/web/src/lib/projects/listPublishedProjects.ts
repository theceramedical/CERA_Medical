import 'server-only';

import { unstable_cache } from 'next/cache';

import { publicizeCmsMediaUrl } from '../cms/media-url.ts';

export type ProjectCategory =
  | 'Preclinical Studies'
  | 'Molecular Research'
  | 'Biomedical Data Analysis';
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

/** Reads only published, non-fixture project records; CMS outages render an empty state. */
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
        if (!response.ok) return [];
        const payload = (await response.json()) as PayloadList;
        return (payload.docs ?? [])
          .map(mapProject)
          .filter((project): project is PublicProject => project !== null);
      } catch {
        return [];
      }
    },
    ['cms', 'projects', 'published'],
    { tags: ['cms:projects'] },
  );
  return cached();
}
