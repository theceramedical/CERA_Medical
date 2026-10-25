'use client';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

import { AppButtonLink } from '../link.tsx';

export function ScrollHero() {
  const copyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    const copy = copyRef.current;
    const video = videoRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (video !== null && reduced) video.pause();
    if (copy === null || reduced) return undefined;

    const intro = gsap.from(copy, {
      y: 28,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
    });
    return () => {
      intro.kill();
    };
  }, []);

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-primary-900 text-on-primary">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/products/tube-preparation.mp4"
        poster="/images/hero-frames/frame_001.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-linear-to-b from-primary-900/75 via-primary-900/25 to-primary-900/70" />
      <div
        ref={copyRef}
        className="relative z-10 mx-auto flex min-h-[100dvh] max-w-site flex-col justify-end px-6 pt-28 pb-16 md:px-10 md:pb-20"
      >
        <p className="mb-3 text-caption font-semibold tracking-wider text-on-primary/80 uppercase">
          Mouse research at the centre of the laboratory
        </p>
        <h1 className="max-w-3xl font-wordmark text-4xl leading-tight font-bold text-balance text-on-primary md:text-6xl">
          Research that moves health forward
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-on-primary/90">
          CERA Medical is an SECP-registered biomedical research and development company based in
          Haripur, Pakistan. We carry out preclinical and molecular laboratory studies and analyse
          biomedical and metagenomic data through to publication-ready results.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <AppButtonLink
            href="/services/preclinical-studies"
            variant="accent"
            data-cursor="Mouse research"
          >
            Explore Services
          </AppButtonLink>
          <AppButtonLink href="/contact#enquiry" variant="outline" data-cursor="Make an enquiry">
            Make an Enquiry
          </AppButtonLink>
        </div>
      </div>
    </section>
  );
}
