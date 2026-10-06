/**
 * CMS and catalogue URLs are absolute third-party origins. Plain `<img>` avoids
 * `/_next/image` 500s when the optimizer cannot reach R2/Vendure or the URL
 * contains characters the optimizer mishandles.
 */
export function ArticleCoverImage({
  src,
  alt,
  className,
  priority,
  sizes,
  width,
  height,
  fill,
}: {
  readonly src: string;
  readonly alt: string;
  readonly className?: string;
  readonly priority?: boolean;
  readonly sizes?: string;
  readonly width?: number;
  readonly height?: number;
  readonly fill?: boolean;
}) {
  const resolved = (() => {
    try {
      return new URL(src).href;
    } catch {
      return src;
    }
  })();

  if (fill === true) {
    return (
      <img
        src={resolved}
        alt={alt}
        className={className}
        decoding={priority === true ? 'sync' : 'async'}
        fetchPriority={priority === true ? 'high' : undefined}
        sizes={sizes}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      width={width}
      height={height}
      className={className}
      decoding={priority === true ? 'sync' : 'async'}
      fetchPriority={priority === true ? 'high' : undefined}
    />
  );
}
