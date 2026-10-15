'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { Mail } from 'lucide-react';
import { useState } from 'react';

import { AppButtonLink } from './link.tsx';

function replySubject(reference: string, serviceTitle: string): string {
  return `Re: ${reference} — ${serviceTitle}`;
}

/** Leave the address unencoded so mail clients recognise the recipient. */
export function enquiryReplyHref(email: string, reference: string, serviceTitle: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(replySubject(reference, serviceTitle))}`;
}

export function EnquiryReplyActions({
  email,
  reference,
  serviceTitle,
}: {
  readonly email: string;
  readonly reference: string;
  readonly serviceTitle: string;
}) {
  const subject = replySubject(reference, serviceTitle);
  const [copied, setCopied] = useState<'email' | 'subject' | null>(null);

  async function copy(value: string, kind: 'email' | 'subject') {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
  }

  return (
    <div className="flex flex-col gap-3">
      <AppButtonLink
        href={enquiryReplyHref(email, reference, serviceTitle)}
        variant="primary"
        className="self-start"
      >
        <Mail aria-hidden className="size-4" />
        Reply to enquiry
      </AppButtonLink>
      <Text size="body-sm" tone="muted">
        Opens a draft in your email app when one is configured. If nothing opens, copy the address
        and subject below and paste them into your mail. Sending the draft does not record the reply
        here — add an internal note after you send it.
      </Text>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void copy(email, 'email')}>
          Copy email
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void copy(subject, 'subject')}
        >
          Copy subject
        </Button>
      </div>
      {copied !== null ? (
        <Text size="caption" role="status">
          {copied === 'email' ? 'Email address copied.' : 'Subject copied.'}
        </Text>
      ) : null}
    </div>
  );
}
