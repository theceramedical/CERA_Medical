import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

export interface EnquiryServiceOption {
  readonly slug: string;
  readonly title: string;
}

const PUBLIC_ENQUIRY_OPTIONS: readonly EnquiryServiceOption[] = [
  { slug: 'preclinical-studies', title: 'Preclinical Studies' },
  { slug: 'molecular-research', title: 'Molecular Research' },
  { slug: 'biomedical-data-analysis', title: 'Biomedical Data Analysis' },
  { slug: 'product-enquiry', title: 'Product enquiry' },
  { slug: 'research-collaboration', title: 'Research collaboration' },
  { slug: 'other-enquiry', title: 'Other enquiry' },
];

export function enquiryServiceOptions(
  _catalogue: readonly PublicService[],
  _presentations: readonly ContentDocument[],
  _settings: unknown,
): readonly EnquiryServiceOption[] {
  return PUBLIC_ENQUIRY_OPTIONS;
}
