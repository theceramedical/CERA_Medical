'use client';

import { Button } from '@cera/ui/button';
import { Field } from '@cera/ui/field';
import { Input } from '@cera/ui/input';
import { Heading, Text } from '@cera/ui/typography';
import { VisuallyHidden } from '@cera/ui/visually-hidden';
import { useId, useState } from 'react';

/**
 * The footer newsletter block (design-language.md section 5.9).
 *
 * **There is no backend yet, and the form says so rather than pretending.** Submitting reports that
 * subscriptions are not open. That is a deliberate choice over the two alternatives: a form that
 * silently discards an address is a lie, and a disabled control with no explanation reads as broken.
 * The shape is final, so Phase 10 replaces one function body with a server action and the
 * accessibility behaviour - the label, the error wiring, the live region - is already proved.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  /**
   * A validation error and an outcome notice are kept apart, because they are announced differently.
   *
   * The error belongs to the field: `Field` ties it to the input with `aria-describedby`, sets
   * `aria-invalid`, and renders it in the danger ink - which is the contract design-language.md
   * section 5.10 specifies, and reimplementing any of it here would be a second, worse copy. The
   * notice belongs to the form as a whole and goes to a live region.
   */
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeId = useId();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (email.trim().length === 0) {
          setError('Enter an email address to subscribe.');
          setNotice(null);
          return;
        }

        setError(null);
        setNotice('Subscriptions are not open yet. Nothing has been sent or stored.');
      }}
      className="flex flex-col gap-3"
    >
      <Heading level={2} size="h4">
        Subscribe to Our Newsletter
      </Heading>

      <Text size="caption" tone="muted">
        Get the latest health insights and updates.
      </Text>

      {/*
       * A real `<label>`, visually hidden. The heading above reads "Subscribe to Our Newsletter",
       * which names the block rather than the control - pointing `aria-labelledby` at it would tell a
       * screen reader the input is called "Subscribe to Our Newsletter", which is not what to type
       * into it. Section 5.10 forbids placeholder-only labelling outright.
       */}
      <Field label={<VisuallyHidden>Email address</VisuallyHidden>} error={error ?? undefined}>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/*
           * `type="email"` with no `noValidate` on the form, so the browser's own check runs first.
           * The native bubble is not a great message, but it arrives before submission, is already
           * translated into the user's language, and is announced. Writing a better one is worth it
           * for the enquiry form in Phase 08; here it would be a worse message maintained twice.
           */}
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            className="sm:flex-1"
          />

          <Button type="submit" variant="primary">
            Subscribe
          </Button>
        </div>
      </Field>

      {/*
       * The live region exists before there is anything to announce, and that is the whole point.
       *
       * A region created in the same render as its text produces no mutation for assistive technology
       * to observe, so the message is never announced - the defect found in the toast viewport in
       * Phase 03 WP-03.8. `empty:hidden` keeps it from occupying space while silent.
       *
       * `polite`, never `assertive`: a subscription result is not worth interrupting whatever the user
       * is currently having read to them.
       */}
      <div id={noticeId} role="status" aria-live="polite" className="empty:hidden">
        {notice !== null && (
          <Text size="caption" tone="muted">
            {notice}
          </Text>
        )}
      </div>
    </form>
  );
}
