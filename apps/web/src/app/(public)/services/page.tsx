import { ServicePortfolio } from '../../../components/services/service-portfolio.tsx';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Our Services',
    description:
      'Preclinical studies, molecular research and biomedical data analysis from CERA Medical.',
    path: '/services',
  });
}
export default function ServicesPage() {
  return <ServicePortfolio />;
}
