import { ComingSoon } from '../../../components/coming-soon.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Health Insights & Articles',
  description: 'Helpful information to support your health and wellbeing.',
};

export default function ArticlesPage() {
  return (
    <ComingSoon
      title="Health Insights & Articles"
      lede="Helpful information to support your health and wellbeing."
      plan="Phase 05 brings the articles under Payload CMS, with drafts and an approval step, and Phase 07 builds this index and the article pages."
    />
  );
}
