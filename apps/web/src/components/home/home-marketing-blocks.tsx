import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

import { CmsLayout, type LayoutBlock } from '../cms-content-page.tsx';

import { ArticlesSection } from './articles-section.tsx';
import { ServicesSection } from './services-section.tsx';

function stringField(block: LayoutBlock, key: string): string {
  return typeof block[key] === 'string' ? block[key] : '';
}

function numberField(block: LayoutBlock, key: string, fallback: number): number {
  const value = block[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Renders homepage sections stored in Payload layout (services row, articles preview, etc.).
 */
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
          viewAllHref={stringField(block, 'viewAllHref') || '/services'}
          viewAllLabel={stringField(block, 'viewAllLabel') || 'View All Services'}
          presentations={presentations}
          catalogue={catalogue}
        />
      );
    }
    if (block.blockType === 'articlesPreview') {
      return (
        <ArticlesSection
          key={key}
          heading={stringField(block, 'heading')}
          subheading={stringField(block, 'body')}
          viewAllHref={stringField(block, 'viewAllHref') || '/articles'}
          viewAllLabel={stringField(block, 'viewAllLabel') || 'View All Articles'}
          maxPosts={numberField(block, 'maxPosts', 3)}
          posts={posts}
        />
      );
    }
    return <CmsLayout key={key} blocks={[block]} />;
  });
}
