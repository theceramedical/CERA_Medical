import { Heading } from '@cera/ui/typography';

import { CmsContentPage } from '../../../components/cms-content-page.tsx';
import { CmsPageUnavailable } from '../../../components/cms-page-unavailable.tsx';
import { ContactSitePanel } from '../../../components/contact-site-panel.tsx';
import { EnquiryForm } from '../../../components/enquiry-form.client.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { getCurrentDocument, getPublicGlobal } from '../../../lib/cms/client.ts';
import { sectionHeadingFromLayout } from '../../../lib/cms-page-hero.ts';
import { contactFromSiteSettings } from '../../../lib/contact-settings.ts';
import { loadEnquiryFormData } from '../../../lib/enquiry-form-server.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact CERA Medical',
  description:
    'Contact CERA Medical by email or visit its laboratory and office in Haripur, Pakistan.',
};

export default async function ContactPage() {
  const [document, settings, enquiryData] = await Promise.all([
    getCurrentDocument('page', 'contact'),
    getPublicGlobal('site-settings'),
    loadEnquiryFormData(),
  ]);
  if (document === null) return <CmsPageUnavailable slug="contact" />;

  const hero = sectionHeadingFromLayout(document.layout);
  const blocks = Array.isArray(document.layout)
    ? (document.layout as { blockType?: string }[]).filter(
        (block) => block.blockType !== 'sectionHeading',
      )
    : [];
  const contact = contactFromSiteSettings(settings);

  return (
    <>
      <MarketingPageHeader
        title={hero?.title ?? document.title}
        lede={hero?.lede ?? document.excerpt ?? ''}
        eyebrow={hero?.eyebrow ?? 'Study scoping and contact'}
      />
      <ContactSitePanel locations={contact.locations} enquiry={contact.enquiry} />
      {contact.enquiry.showInlineForm ? (
        <section
          aria-labelledby="contact-inline-enquiry"
          className="border-t border-border bg-surface-tint px-6 py-12 md:px-10 lg:py-16"
        >
          <div className="mx-auto max-w-site">
            <Heading level={2} size="h3" id="contact-inline-enquiry">
              {contact.enquiry.formSectionTitle ?? 'Service request form'}
            </Heading>
            <div className="mt-8">
              <EnquiryForm
                startedAt={new Date().toISOString()}
                source="web_contact_page"
                {...enquiryData}
              />
            </div>
          </div>
        </section>
      ) : null}
      {blocks.length > 0 || document.body ? (
        <CmsContentPage document={{ ...document, layout: blocks }} skipPageHeader />
      ) : null}
    </>
  );
}
