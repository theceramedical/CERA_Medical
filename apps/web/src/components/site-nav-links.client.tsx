'use client';

import { cn } from '@cera/ui/cn';
import { ArrowRight, BarChart3, ChevronDown, Dna } from 'lucide-react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

import { LabMouseIcon } from './icons/lab-mouse-icon.tsx';
import { isCurrent } from './navigation.ts';

import type { NavItem } from './navigation.ts';

const SERVICE_META: Record<string, { desc: string; icon: typeof Dna }> = {
  '/services/preclinical-studies': {
    desc: 'In vivo rodent animal models (Mus musculus), in vitro & in silico',
    icon: LabMouseIcon as unknown as typeof Dna,
  },
  '/services/molecular-research': {
    desc: 'PCR, RT-qPCR, ELISA, Western blot, sequencing & histopathology',
    icon: Dna,
  },
  '/services/biomedical-data-analysis': {
    desc: 'Metagenomics, clinical statistics, omics & PRISMA reports',
    icon: BarChart3,
  },
};

export function DesktopNavLinks({ items }: { readonly items: readonly NavItem[] }) {
  const pathname = usePathname();

  const linkClass = (current: boolean) =>
    cn(
      'inline-flex min-h-11 items-center rounded-md px-3 text-button no-underline transition-colors',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
      current ? 'text-foreground font-semibold' : 'text-neutral-700 hover:text-foreground',
    );

  return (
    <ul className="flex list-none items-center gap-1 p-0">
      {items.map((item) => {
        const current = isCurrent(item.href, pathname);

        if (item.children && item.children.length > 0) {
          return (
            <li key={item.href} className="group relative">
              <NextLink
                href={item.href}
                aria-current={current ? 'page' : undefined}
                aria-haspopup="true"
                className={cn(
                  linkClass(current),
                  'gap-1.5 transition-colors group-hover:text-primary',
                )}
              >
                <span>{item.label}</span>
                <ChevronDown
                  aria-hidden="true"
                  size={15}
                  className="text-muted transition-transform duration-200 group-hover:rotate-180 group-hover:text-primary"
                />
              </NextLink>

              <div className="invisible pointer-events-none absolute top-full left-0 z-50 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                <div className="w-[26rem] rounded-xl border border-border bg-surface p-3 shadow-xl ring-1 ring-black/5">
                  <div className="mb-2 flex items-center justify-between border-b border-border/60 px-3 py-2 text-caption">
                    <span className="font-semibold tracking-[0.12em] text-accent uppercase">
                      Research Pillars
                    </span>
                    <NextLink
                      href="/services"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      All Services
                      <ArrowRight size={13} aria-hidden="true" />
                    </NextLink>
                  </div>

                  <ul className="list-none space-y-1.5 p-0">
                    {item.children.map((child) => {
                      const meta = SERVICE_META[child.href];
                      const IconComponent = meta?.icon ?? Dna;
                      const isPreclinical = child.href.includes('preclinical');
                      return (
                        <li key={child.href}>
                          <NextLink
                            href={child.href}
                            className="group/item flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-surface-tint"
                          >
                            <span
                              className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
                                isPreclinical
                                  ? 'border-primary/30 bg-primary-50 text-primary group-hover/item:bg-primary group-hover/item:text-on-primary'
                                  : 'border-accent/30 bg-accent-fill/10 text-accent group-hover/item:bg-accent-fill group-hover/item:text-on-accent',
                              )}
                            >
                              <IconComponent size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-body-sm font-semibold text-heading group-hover/item:text-primary">
                                  {child.label}
                                </span>
                                {isPreclinical ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                                    <LabMouseIcon size={11} />
                                    In Vivo
                                  </span>
                                ) : null}
                              </div>
                              {meta?.desc ? (
                                <p className="mt-0.5 text-caption leading-relaxed text-muted line-clamp-2">
                                  {meta.desc}
                                </p>
                              ) : null}
                            </div>
                          </NextLink>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-2 flex items-center justify-between rounded-lg border border-border/60 bg-surface-subtle p-2.5">
                    <div className="flex items-center gap-2 text-caption text-muted">
                      <LabMouseIcon size={15} className="text-primary" />
                      <span>SPF Animal House facility ready</span>
                    </div>
                    <NextLink
                      href="/contact#contact-form"
                      className="inline-flex items-center gap-1 text-caption font-semibold text-accent hover:underline"
                    >
                      Request Scoping
                      <ArrowRight size={12} aria-hidden="true" />
                    </NextLink>
                  </div>
                </div>
              </div>
            </li>
          );
        }

        return (
          <li key={item.href}>
            <NextLink
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className={linkClass(current)}
            >
              <span
                className={cn(
                  'border-b-2 py-0.5',
                  current ? 'border-primary' : 'border-transparent',
                )}
              >
                {item.label}
              </span>
            </NextLink>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileNavLinks({
  items,
  onNavigate,
}: {
  readonly items: readonly NavItem[];
  readonly onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile Navigation">
      <ul className="flex list-none flex-col gap-1 p-0">
        {items.map((item) => {
          const current = isCurrent(item.href, pathname);

          if (item.children && item.children.length > 0) {
            return (
              <li key={item.href} className="border-b border-border/60 pb-2">
                <NextLink
                  href={item.href}
                  {...(onNavigate !== undefined ? { onClick: onNavigate } : {})}
                  aria-current={current ? 'page' : undefined}
                  className="flex items-center justify-between py-2 text-body font-semibold text-foreground no-underline"
                >
                  <span>{item.label}</span>
                  <ArrowRight size={16} aria-hidden="true" className="text-muted" />
                </NextLink>

                <ul className="ml-3 mt-1 flex list-none flex-col gap-1 border-l-2 border-border/60 pl-3">
                  {item.children.map((child) => {
                    const childCurrent = isCurrent(child.href, pathname);
                    const isPreclinical = child.href.includes('preclinical');
                    return (
                      <li key={child.href}>
                        <NextLink
                          href={child.href}
                          {...(onNavigate !== undefined ? { onClick: onNavigate } : {})}
                          aria-current={childCurrent ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2 py-1.5 text-body-sm no-underline',
                            childCurrent
                              ? 'font-bold text-primary'
                              : 'text-muted hover:text-foreground',
                          )}
                        >
                          {isPreclinical ? (
                            <LabMouseIcon size={14} className="text-primary" />
                          ) : null}
                          <span>{child.label}</span>
                        </NextLink>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <NextLink
                href={item.href}
                {...(onNavigate !== undefined ? { onClick: onNavigate } : {})}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-between py-2.5 text-body font-medium no-underline',
                  current ? 'font-bold text-primary' : 'text-foreground hover:text-primary',
                )}
              >
                <span>{item.label}</span>
                {current ? <span className="size-1.5 rounded-full bg-primary" /> : null}
              </NextLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
