import { ServicesOverview } from '../../../components/services/services-overview.tsx';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: 'Our Services',
    description:
      'Preclinical studies, molecular research and biomedical data analysis from CERA Medical in Haripur, Pakistan.',
    path: '/services',
  });
}

export default function ServicesPage() {
  return <ServicesOverview />;
}
