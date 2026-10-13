import { Heading } from '@cera/ui/typography';

import type { ContentDocument } from '@cera/contracts';

export function ContentGallery({
  images,
  heading = 'Gallery',
}: {
  readonly images: ContentDocument['gallery'];
  readonly heading?: string | undefined;
}) {
  if (!images?.length) return null;
  return (
    <section className="mx-auto max-w-site px-6 py-12 md:px-10" aria-label={heading || 'Gallery'}>
      <Heading level={2} size="h3" className="mb-8">
        {heading || 'Gallery'}
      </Heading>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <figure
            key={image.url}
            className="overflow-hidden rounded-lg border border-border bg-surface"
          >
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open image ${index + 1}: ${image.alt || 'Gallery image'} (new tab)`}
            >
              {/* Original uploads also work with local SSD storage. */}
              <img
                src={image.url}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-contain"
              />
            </a>
            {image.alt ? (
              <figcaption className="border-t border-border p-4 text-body-sm text-copy-muted">
                {image.alt}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
