'use client';

import { Heading, Text } from '@cera/ui/typography';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { AppLink } from '../link.tsx';

export interface ProductSlide {
  readonly sku: string;
  readonly title: string;
  readonly summary: string;
  readonly price: string | null;
  readonly href: string;
  readonly imageUrl: string | null;
  readonly imageAlt: string;
  readonly videoUrl: string | null;
}

const GAP = 16;
const AUTOPLAY_MS = 4800;

function shortName(title: string): string {
  const head = title.split(':')[0]?.trim();
  return head !== undefined && head.length > 0 ? head : title;
}

function perViewFor(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function ProductCarousel({ products }: { readonly products: readonly ProductSlide[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [perView, setPerView] = useState(1);
  const [sliding, setSliding] = useState(true);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    if (viewport === null) return;
    const width = viewport.clientWidth;
    const nextPer = Math.min(perViewFor(width), Math.max(count, 1));
    const card = (width - GAP * (nextPer - 1)) / nextPer;
    setPerView(nextPer);
    setCardWidth(card);
  }, [count]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    const pause = () => setPaused(true);
    const resume = (event: FocusEvent) => {
      if (!root.contains(event.relatedTarget as Node | null)) setPaused(false);
    };
    const resumePointer = () => setPaused(false);
    root.addEventListener('pointerenter', pause);
    root.addEventListener('pointerleave', resumePointer);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', resume);
    return () => {
      root.removeEventListener('pointerenter', pause);
      root.removeEventListener('pointerleave', resumePointer);
      root.removeEventListener('focusin', pause);
      root.removeEventListener('focusout', resume);
    };
  }, []);

  const advance = useCallback(() => {
    setSliding(true);
    setIndex((current) => (current >= count ? current : current + 1));
  }, [count]);

  useEffect(() => {
    if (paused || count <= perView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(advance, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [advance, paused, count, perView]);

  useEffect(() => {
    if (sliding) return;
    const frame = window.requestAnimationFrame(() => setSliding(true));
    return () => window.cancelAnimationFrame(frame);
  }, [sliding]);

  if (count === 0) return null;

  const slides = [...products, ...products];
  const step = cardWidth + GAP;
  const offset = step === GAP ? 0 : -index * step;
  const active = index % count;

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-4 flex items-center justify-between gap-3 px-6 md:px-10">
        <div className="mx-auto flex w-full max-w-site items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-heading shadow-sm transition hover:border-accent hover:text-accent"
            aria-label="Previous product"
            onClick={() => {
              setSliding(true);
              setIndex((current) => (current <= 0 ? count - 1 : current - 1));
            }}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-heading shadow-sm transition hover:border-accent hover:text-accent"
            aria-label="Next product"
            onClick={advance}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="overflow-hidden px-6 md:px-10"
        aria-roledescription="carousel"
        aria-label="Catalogue products"
      >
        <ul
          className="flex list-none p-0"
          style={{
            gap: GAP,
            transform: `translate3d(${offset}px, 0, 0)`,
            transition: sliding ? 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          }}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget || event.propertyName !== 'transform') return;
            if (index < count) return;
            setSliding(false);
            setIndex(0);
          }}
        >
          {slides.map((product, position) => (
            <li
              key={`${product.sku}-${position < count ? 'a' : 'b'}`}
              className="shrink-0"
              style={{ width: cardWidth > 0 ? cardWidth : '100%' }}
              aria-hidden={position >= count}
            >
              <AppLink
                href={product.href}
                tabIndex={position >= count ? -1 : undefined}
                className="cera-card block h-full overflow-hidden rounded-lg border border-border bg-surface no-underline shadow-card"
              >
                {product.videoUrl !== null && position >= index && position < index + perView ? (
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    <video
                      src={product.videoUrl}
                      poster={product.imageUrl ?? undefined}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="h-full w-full object-cover"
                      aria-label={position < count ? product.imageAlt : undefined}
                    />
                  </div>
                ) : product.imageUrl !== null && product.imageUrl.length > 0 ? (
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    <img
                      src={product.imageUrl}
                      alt={position < count ? product.imageAlt : ''}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] flex-col justify-between bg-primary-900 p-5">
                    <Text size="caption" className="font-mono text-on-primary/80">
                      {product.sku}
                    </Text>
                    <Text className="text-lg font-semibold text-on-primary">
                      {shortName(product.title)}
                    </Text>
                  </div>
                )}
                <div className="p-4">
                  <Heading level={3} size="h4" className="mb-1 line-clamp-2">
                    {product.title}
                  </Heading>
                  <Text size="body-sm" tone="muted" className="line-clamp-2">
                    {product.summary}
                  </Text>
                  {product.price !== null ? (
                    <Text size="body-sm" className="mt-3 font-semibold">
                      {product.price}
                    </Text>
                  ) : null}
                </div>
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto mt-5 flex max-w-site items-center gap-3 px-6 md:px-10">
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            key={paused ? `paused-${active}` : active}
            className={
              paused
                ? 'h-full w-full origin-left scale-x-0 bg-accent'
                : 'cera-progress h-full bg-accent'
            }
          />
        </div>
        <ol className="flex list-none gap-1.5 p-0">
          {products.map((product, dot) => (
            <li key={product.sku}>
              <button
                type="button"
                aria-label={`Show ${shortName(product.title)}`}
                aria-current={dot === active ? 'true' : undefined}
                className={`h-2 rounded-full transition-all ${dot === active ? 'w-6 bg-accent' : 'w-2 bg-border'}`}
                onClick={() => {
                  setSliding(true);
                  setIndex(dot);
                }}
              />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
