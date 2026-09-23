import { ComingSoon } from '../../../components/coming-soon.tsx';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Medical Services',
  description:
    'Explore our range of trusted medical services designed to support your health and wellbeing.',
};

export default function ServicesPage() {
  return (
    <ComingSoon
      title="Our Medical Services"
      lede="Explore our range of trusted medical services designed to support your health and wellbeing."
      plan="Phase 06 loads the service catalogue from Vendure and Phase 07 builds this index with its filters and individual service pages. The six services shown on the homepage are the same records."
    />
  );
}
