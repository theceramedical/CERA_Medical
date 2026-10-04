import { listPublicServices } from './catalogue/client.ts';
import { listPublishedDocuments, getPublicGlobal } from './cms/client.ts';
import { enquiryFormCopyFromSettings } from './enquiry-form-copy.ts';
import { enquiryServiceOptions } from './enquiry-service-options.ts';

export async function loadEnquiryFormData() {
  const [settings, presentations, catalogue] = await Promise.all([
    getPublicGlobal('site-settings'),
    listPublishedDocuments('servicePresentation'),
    listPublicServices(),
  ]);
  const copy = enquiryFormCopyFromSettings(settings);
  const services = enquiryServiceOptions(catalogue.items, presentations, settings);
  return {
    ...(copy !== undefined ? { copy } : {}),
    services,
  };
}
