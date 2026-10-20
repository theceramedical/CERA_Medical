/**
 * Laboratory photographs and short clips are files on this site.
 * The image optimiser answers 400 for those files in production, so the
 * browser loads them directly.
 */
export function FacilityMedia({
  src,
  alt,
  videoSrc,
  className = 'object-cover',
  priority = false,
  fill = true,
}: {
  readonly src: string;
  readonly alt: string;
  readonly videoSrc?: string | undefined;
  readonly className?: string;
  readonly priority?: boolean;
  readonly fill?: boolean;
}) {
  const frame = fill
    ? `absolute inset-0 h-full w-full ${className}`
    : `h-auto max-h-[28rem] w-full ${className}`;
  if (videoSrc !== undefined && videoSrc.length > 0) {
    return (
      <video
        src={videoSrc}
        poster={src}
        muted
        loop
        playsInline
        autoPlay
        aria-label={alt}
        className={frame}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={frame}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
}
