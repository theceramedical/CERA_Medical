import type { ContentDocument } from '@cera/contracts';
import type { PublicService } from '@cera/contracts/projections';

import { ENQUIRY_SERVICE_OPTIONS } from '../content/public-revision.ts';

export interface EnquiryServiceOption {
  readonly slug: string;
  readonly title: string;
}

export function enquiryServiceOptions(
  _catalogue: readonly PublicService[],
  _presentations: readonly ContentDocument[],
  _settings: unknown,
): readonly EnquiryServiceOption[] {
  return ENQUIRY_SERVICE_OPTIONS;
}
