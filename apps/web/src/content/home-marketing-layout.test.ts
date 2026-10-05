import { describe, expect, it } from 'vitest';

import { defaultHomeMarketingBlocks } from './home-marketing-layout.ts';

describe('defaultHomeMarketingBlocks', () => {
  it('matches the Stitch homepage section stack', () => {
    const blocks = defaultHomeMarketingBlocks();
    expect(blocks.map((block) => block.blockType)).toEqual([
      'servicesShowcase',
      'featureGrid',
      'featureGrid',
      'processSteps',
      'processSteps',
      'featureGrid',
      'articlesPreview',
      'faqList',
      'featureGrid',
    ]);
  });
});
