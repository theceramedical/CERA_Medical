import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

import { CmsLayout, type LayoutBlock } from '../cms-content-page.tsx';

import { ArticlesSection } from './articles-section.tsx';
import { AudienceSection } from './audience-section.tsx';
import { CapabilitiesSection } from './capabilities-section.tsx';
import { DeliverablesSection } from './deliverables-section.tsx';
import { ExploreSection } from './explore-section.tsx';
import { FaqPreviewSection } from './faq-preview-section.tsx';
import { PrinciplesSection } from './principles-section.tsx';
import { ProcessSection } from './process-section.tsx';
import { ServicesSection } from './services-section.tsx';

function stringField(block: LayoutBlock, key: string): string {
  return typeof block[key] === 'string' ? block[key] : '';
}

function booleanField(block: LayoutBlock, key: string): boolean {
  return block[key] === true;
}

function numberField(block: LayoutBlock, key: string, fallback: number): number {
  const value = block[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function recordArray(block: LayoutBlock, key: string): readonly LayoutBlock[] {
  const value = block[key];
  return Array.isArray(value)
    ? value.filter((item): item is LayoutBlock => item !== null && typeof item === 'object')
    : [];
}

function highlights(feature: LayoutBlock): readonly string[] {
  return recordArray(feature, 'highlights')
    .map((row) => stringField(row, 'text'))
    .filter((line) => line.length > 0);
}

function featureCards(block: LayoutBlock) {
  return recordArray(block, 'features').map((feature) => ({
    title: stringField(feature, 'title'),
    description: stringField(feature, 'description'),
    highlights: highlights(feature),
    href: stringField(feature, 'href'),
    linkLabel: stringField(feature, 'linkLabel'),
  }));
}

function stepCards(block: LayoutBlock) {
  return recordArray(block, 'steps').map((step) => ({
    title: stringField(step, 'title'),
    description: stringField(step, 'description'),
  }));
}

export function HomeMarketingBlocks({
  blocks,
  presentations,
  posts,
  catalogue,
}: {
  readonly blocks: readonly LayoutBlock[];
  readonly presentations: readonly ContentDocument[];
  readonly posts: readonly ContentDocument[];
  readonly catalogue: readonly PublicService[];
}) {
  return blocks.map((block, index) => {
    const key =
      block.id === undefined ? `${block.blockType ?? 'block'}-${index}` : String(block.id);
    if (block.blockType === 'servicesShowcase') {
      return (
        <ServicesSection
          key={key}
          heading={stringField(block, 'heading')}
          subheading={stringField(block, 'body')}
          presentations={presentations}
          catalogue={catalogue}
        />
      );
    }
    if (block.blockType === 'articlesPreview') {
      return (
        <ArticlesSection
          key={key}
          heading={stringField(block, 'heading') || 'Health Insights & Articles'}
          subheading={stringField(block, 'body')}
          viewAllHref={stringField(block, 'viewAllHref') || '/articles'}
          viewAllLabel={stringField(block, 'viewAllLabel') || 'View All Articles'}
          maxPosts={numberField(block, 'maxPosts', 3)}
          posts={posts}
        />
      );
    }
    if (block.blockType === 'faqList') {
      return (
        <FaqPreviewSection
          key={key}
          {...(stringField(block, 'eyebrow') ? { eyebrow: stringField(block, 'eyebrow') } : {})}
          heading={stringField(block, 'heading') || 'Common Questions'}
          subheading={stringField(block, 'body')}
          linkHref={stringField(block, 'linkHref') || '/faqs'}
          linkLabel={stringField(block, 'linkLabel') || 'All FAQs'}
          items={recordArray(block, 'items').map((item) => ({
            question: stringField(item, 'question'),
            answer: stringField(item, 'answer'),
          }))}
        />
      );
    }
    if (block.blockType === 'processSteps') {
      const steps = stepCards(block);
      const heading = stringField(block, 'heading');
      const body = stringField(block, 'body');
      if (steps.length === 4 || heading.toLowerCase().includes('receive')) {
        return (
          <DeliverablesSection
            key={key}
            heading={heading || 'What You Receive'}
            subheading={body}
            items={steps}
          />
        );
      }
      return (
        <ProcessSection
          key={key}
          heading={heading || 'How CERA Works'}
          subheading={body}
          steps={steps}
        />
      );
    }
    if (block.blockType === 'featureGrid') {
      const features = featureCards(block);
      const heading = stringField(block, 'heading');
      const body = stringField(block, 'body');
      const eyebrow = stringField(block, 'eyebrow');
      if (features.some((feature) => feature.href.length > 0)) {
        return (
          <ExploreSection
            key={key}
            items={features.map((feature) => ({
              title: feature.title,
              description: feature.description,
              href: feature.href,
              ...(feature.linkLabel.length > 0 ? { linkLabel: feature.linkLabel } : {}),
            }))}
          />
        );
      }
      if (booleanField(block, 'centered') || heading.toLowerCase().includes('research teams')) {
        return (
          <AudienceSection
            key={key}
            {...(eyebrow.length > 0 ? { eyebrow } : {})}
            heading={heading || 'Built for Research Teams'}
            subheading={body}
            items={features.map((feature) => ({
              title: feature.title,
              description: feature.description,
              highlights: feature.highlights,
            }))}
          />
        );
      }
      if (features.length === 4) {
        return (
          <PrinciplesSection
            key={key}
            {...(eyebrow.length > 0 ? { eyebrow } : {})}
            heading={heading || 'How We Work With Partners'}
            subheading={body}
            items={features}
          />
        );
      }
      if (features.length === 3) {
        return (
          <CapabilitiesSection
            key={key}
            {...(eyebrow.length > 0 ? { eyebrow } : {})}
            heading={heading || 'Built for Rigorous Research'}
            subheading={body}
            items={features}
          />
        );
      }
    }
    return <CmsLayout key={key} blocks={[block]} />;
  });
}
