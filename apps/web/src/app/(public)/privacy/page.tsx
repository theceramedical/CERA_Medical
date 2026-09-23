import { Alert } from '@cera/ui/alert';
import { Text } from '@cera/ui/typography';

import { PolicyDocument } from '../../../components/policy-document.tsx';

import type { PolicySection } from '../../../components/policy-document.tsx';
import type { Metadata } from 'next';

/**
 * The privacy notice.
 *
 * **The text is a placeholder and the page says so at the top.** A privacy notice is a legal document,
 * and drafting a convincing one that has not been reviewed is worse than an obvious placeholder: a
 * visitor would rely on it, and the organisation would be bound by wording nobody approved.
 *
 * What is not placeholder is the substance of what the platform actually does with data. Those claims
 * are drawn from the data model in `packages/db` and the redaction rules in `@cera/observability`, so
 * they are true as written and are the part legal review should start from rather than invent.
 */

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: 'What personal information CERA Medical collects, why, and how long it is kept.',
};

const SECTIONS: readonly PolicySection[] = [
  {
    heading: 'What we collect',
    paragraphs: [
      'When you submit an enquiry we collect your name, your email address, an optional phone number, the service you are asking about, and the message you write. We record that you gave consent, and when.',
      'We do not collect clinical information. There is no field anywhere in this platform for symptoms, conditions, medications, or test results, and no document upload. This is a structural limit rather than a policy one: the information has nowhere to go.',
    ],
  },
  {
    heading: 'What we do not store',
    paragraphs: [
      'We do not store your IP address. Where we need to limit how many enquiries come from one place, we store a salted hash that cannot be reversed to an address.',
      'We do not store card details, because we take no payments. We do not store passwords: sign-in is handled by a separate identity service, and this application never sees one.',
    ],
  },
  {
    heading: 'Why we process it',
    paragraphs: [
      'To respond to your enquiry, to keep a record of what was asked and answered, and to let you see the progress of your own enquiries when you sign in.',
      'We also keep an audit record of actions taken on an enquiry by our staff. That record is append-only - it cannot be edited or deleted after the fact - because a history that can be rewritten is not a history.',
    ],
  },
  {
    heading: 'Who we share it with',
    paragraphs: [
      'Your enquiry is passed to our customer relationship system so that the team handling it can see it, and to our email provider so that we can send you a confirmation. Both act on our instructions and for no other purpose.',
      'We do not sell personal information and we do not use it for advertising. There are no analytics or advertising trackers on this site.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'Retention periods are being confirmed as part of the review noted above. They will be stated here as specific periods per record type, not as "as long as necessary".',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'You can ask for a copy of the information we hold about you, ask us to correct it, or ask us to delete it. You can also withdraw consent for future contact.',
      'The contact details for making any of those requests will be confirmed alongside the review noted above.',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'We set one cookie, and only after you sign in: it is what keeps you signed in. It is not used for tracking, it is not shared, and there is nothing to consent to because the site does not function as an account without it.',
      'We set no analytics, advertising, or third-party cookies, which is why this site has no cookie banner.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <PolicyDocument
      title="Privacy Notice"
      lede="What we collect when you use this site, why we collect it, and what we will not collect at all."
      updated="2026-09-23"
      notice={
        <Alert tone="warning" title="This wording is a placeholder">
          <Text size="body-sm">
            The statements below describe what the platform genuinely does, drawn from its data
            model, but the notice has not yet been through legal review. It must not be relied on as
            the final notice.
          </Text>
        </Alert>
      }
      sections={SECTIONS}
    />
  );
}
