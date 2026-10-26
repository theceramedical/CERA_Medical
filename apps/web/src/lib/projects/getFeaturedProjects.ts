import 'server-only';

import { unstable_cache } from 'next/cache';

import { publicizeCmsMediaUrl } from '../cms/media-url.ts';

export interface FeaturedProjectCard {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly href: string;
  readonly imageUrl?: string;
  readonly imageAlt?: string;
  readonly category?: 'Preclinical Studies' | 'Molecular Research' | 'Biomedical Data Analysis';
  readonly status?: 'Running' | 'Completed';
}

interface PayloadMedia {
  readonly url?: string | null;
  readonly alt?: string | null;
}

interface PayloadProject {
  readonly id: string | number;
  readonly slug?: string;
  readonly title?: string;
  readonly summary?: string;
  readonly category?: string;
  readonly projectStatus?: 'Running' | 'Completed';
  readonly image?: PayloadMedia | string | number | null;
  readonly imageAlt?: string | null;
}

const PROJECT_CATEGORIES = [
  'Preclinical Studies',
  'Molecular Research',
  'Biomedical Data Analysis',
] as const;

interface PayloadList {
  readonly docs?: readonly PayloadProject[];
}

const CMS_TIMEOUT_MS = 4000;

function cmsApiUrl(): string {
  return process.env.CMS_API_URL ?? process.env.CMS_URL ?? 'http://localhost:3001/api';
}

function positiveLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return 6;
  return Math.min(24, Math.max(0, Math.floor(limit)));
}

function mapProject(project: PayloadProject): FeaturedProjectCard | null {
  if (
    (typeof project.id !== 'string' && typeof project.id !== 'number') ||
    typeof project.slug !== 'string' ||
    typeof project.title !== 'string' ||
    typeof project.summary !== 'string'
  )
    return null;

  const card: FeaturedProjectCard = {
    id: project.slug,
    title: project.title,
    summary: project.summary,
    href: `/projects#${project.slug}`,
    ...(PROJECT_CATEGORIES.some((category) => category === project.category)
      ? { category: project.category as NonNullable<FeaturedProjectCard['category']> }
      : {}),
    ...(project.projectStatus === 'Running' || project.projectStatus === 'Completed'
      ? { status: project.projectStatus }
      : {}),
  };
  if (project.image !== null && typeof project.image === 'object') {
    const imageUrl = publicizeCmsMediaUrl(project.image.url ?? null);
    if (imageUrl !== null) {
      return {
        ...card,
        imageUrl,
        imageAlt: project.imageAlt ?? project.image.alt ?? '',
      };
    }
  }
  return project.imageAlt ? { ...card, imageAlt: project.imageAlt } : card;
}

/** Published, homepage-selected project cards. CMS failures intentionally degrade to an empty selection. */
export async function getFeaturedProjects(limit?: number): Promise<readonly FeaturedProjectCard[]> {
  const boundedLimit = positiveLimit(limit);
  if (boundedLimit === 0) return [];

  const cached = unstable_cache(
    async (): Promise<readonly FeaturedProjectCard[]> => {
      const url = new URL(`${cmsApiUrl().replace(/\/$/, '')}/projects`);
      url.searchParams.set('where[featuredOnHome][equals]', 'true');
      url.searchParams.set('where[fixture][not_equals]', 'true');
      url.searchParams.set('limit', String(boundedLimit));
      url.searchParams.set('depth', '1');
      url.searchParams.set('sort', 'sortOrder,slug');

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
          .filter((project): project is FeaturedProjectCard => project !== null);
      } catch {
        return [];
      }
    },
    ['cms', 'projects', 'featured', String(boundedLimit)],
    { tags: ['cms:projects'] },
  );

  return cached();
}
