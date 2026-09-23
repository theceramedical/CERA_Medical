'use client';

import { Alert } from '@cera/ui/alert';
import { Button } from '@cera/ui/button';
import { Field } from '@cera/ui/field';
import { FocusTrap } from '@cera/ui/focus-trap';
import { Input } from '@cera/ui/input';
import { Skeleton, SkeletonRegion } from '@cera/ui/skeleton';
import { useToast } from '@cera/ui/toast';
import { Heading, Text } from '@cera/ui/typography';
import { useState } from 'react';

import { PreviewRow, PreviewStage } from './shell.tsx';

/**
 * The examples that cannot be static.
 *
 * Kept in one client island rather than scattered, so the rest of the page stays a server component
 * and the preview keeps demonstrating what it is previewing: a design system whose components are
 * server-rendered by default. Only three examples genuinely need state - a toast has to be fired, a
 * focus trap has to be operated, and a loading placeholder has to resolve. Everything else renders
 * its states as separate instances, which is also easier to compare side by side.
 */

/** Fires a toast of each tone, including the one that deliberately ignores its own timeout. */
export function ToastDemo() {
  const { show } = useToast();

  return (
    <PreviewRow>
      <Button
        variant="outline"
        onClick={() => {
          show({ tone: 'info', title: 'Draft saved' });
        }}
      >
        Info
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          show({
            tone: 'success',
            title: 'Enquiry submitted',
            description: 'Reference CERA-2026-0001. A confirmation is on its way.',
          });
        }}
      >
        Success
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          show({ tone: 'warning', title: 'Some details still need attention' });
        }}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          show({
            tone: 'danger',
            title: 'We could not submit your enquiry',
            description: 'Nothing was lost. Try again, or call the number in the footer.',
          });
        }}
      >
        Danger (never auto-dismisses)
      </Button>
    </PreviewRow>
  );
}

/**
 * A focus trap in the shape it is really used: a dialog.
 *
 * Interactive rather than a screenshot, because the properties that matter are only observable by
 * operating it - focus moving in on open, Tab wrapping at the last control, Escape closing, and
 * focus returning to the trigger. The keyboard walk in WP-03.8 drives this instance.
 */
export function FocusTrapDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="primary"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open a trapped dialog
      </Button>

      {open && (
        <FocusTrap
          active
          onClose={() => {
            setOpen(false);
          }}
          className="max-w-measure rounded-lg border border-border bg-surface p-6 shadow-lg"
        >
          {/* `aria-modal` is honest here: the trap really does prevent interaction outside. */}
          <div role="dialog" aria-modal="true" aria-labelledby="trap-demo-title">
            <Heading level={4} id="trap-demo-title">
              Confirm your details
            </Heading>
            <Text tone="muted" className="mt-2">
              Tab cycles within this dialog and wraps at the last control. Escape closes it and
              returns focus to the button that opened it.
            </Text>
            <Field label="Full name" hint="As it appears on your ID." className="mt-4">
              <Input autoComplete="name" />
            </Field>
            <div className="mt-4">
              <PreviewRow>
                <Button
                  variant="primary"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </PreviewRow>
            </div>
          </div>
        </FocusTrap>
      )}
    </div>
  );
}

/** The loading placeholder in both states, because the announcement only exists in one of them. */
export function SkeletonDemo() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        onClick={() => {
          setLoading((previous) => !previous);
        }}
      >
        {loading ? 'Finish loading' : 'Start loading again'}
      </Button>
      <PreviewStage>
        <SkeletonRegion loading={loading} label="Loading your enquiries">
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <Alert tone="success" title="Loaded">
              Three enquiries, most recently updated on 23 September 2026.
            </Alert>
          )}
        </SkeletonRegion>
      </PreviewStage>
    </div>
  );
}
