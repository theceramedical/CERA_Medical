import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

export interface EnquiryServiceOption {
  readonly slug: string;
  readonly title: string;
}

export function enquiryServiceOptions(
  catalogue: readonly PublicService[],
  presentations: readonly ContentDocument[],
  settings: unknown,
): readonly EnquiryServiceOption[] {
  const presentationBySlug = new Map(presentations.map((item) => [item.slug, item]));
  const fromCatalogue = catalogue
    .filter((service) => service.enquiryEnabled)
    .map((service) => ({
      slug: service.slug,
      title: presentationBySlug.get(service.slug)?.title ?? service.title,
    }));

  const extras: EnquiryServiceOption[] = [];
  if (settings !== null && typeof settings === 'object') {
    const enquiryForm = (settings as { enquiryForm?: unknown }).enquiryForm;
    if (enquiryForm !== null && typeof enquiryForm === 'object') {
      const raw = (enquiryForm as { extraServices?: unknown }).extraServices;
      if (Array.isArray(raw)) {
        for (const row of raw) {
          if (row === null || typeof row !== 'object') continue;
          const slug = (row as { slug?: unknown }).slug;
          const title = (row as { title?: unknown }).title;
          if (typeof slug === 'string' && slug.length > 0 && typeof title === 'string') {
            extras.push({ slug, title });
          }
        }
      }
    }
  }

  const seen = new Set<string>();
  return [...fromCatalogue, ...extras].filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}
