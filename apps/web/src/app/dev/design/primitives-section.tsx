import { Alert } from '@cera/ui/alert';
import { Badge, Pill } from '@cera/ui/badge';
import { Breadcrumbs } from '@cera/ui/breadcrumbs';
import { Button, ButtonLink } from '@cera/ui/button';
import { Card, CardSpacer } from '@cera/ui/card';
import { Checkbox, Radio, RadioGroup } from '@cera/ui/choice';
import { Divider, SectionRule } from '@cera/ui/divider';
import { EmptyState } from '@cera/ui/empty-state';
import { Field } from '@cera/ui/field';
import { Icon } from '@cera/ui/icon';
import { IconDisc } from '@cera/ui/icon-disc';
import { Input, Select, Textarea } from '@cera/ui/input';
import { Link } from '@cera/ui/link';
import { Pagination } from '@cera/ui/pagination';
import { Spinner } from '@cera/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@cera/ui/table';
import { Heading, Text } from '@cera/ui/typography';
import { VisuallyHidden } from '@cera/ui/visually-hidden';
import { ArrowRight, CalendarDays, Inbox, ShieldCheck, Stethoscope } from 'lucide-react';

import { FocusTrapDemo, SkeletonDemo, ToastDemo } from './interactive.tsx';
import { PreviewCase, PreviewRow, PreviewSection, PreviewStage } from './shell.tsx';

/**
 * Every primitive, in every state it has.
 *
 * States are separate instances rather than something to hover or click, for two reasons. A reviewer
 * comparing `primary` at rest against `primary` disabled needs both on screen at once, and axe in
 * WP-03.8 only sees the state that is actually rendered - a disabled variant reachable only by a
 * click is a variant the gate never checks.
 *
 * Hover and active are the two exceptions: they cannot be rendered statically without faking them
 * with a class, which would test the fake. Those stay as live behaviour on the resting instances,
 * and their contrast is proven by the ratio table instead.
 */

const BUTTON_VARIANTS = ['primary', 'accent', 'outline', 'ghost', 'on-dark'] as const;
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_TONES = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
const ALERT_TONES = ['info', 'success', 'warning', 'danger'] as const;

export function PrimitiveSections() {
  return (
    <>
      <ActionSection />
      <FormSection />
      <FeedbackSection />
      <SurfaceSection />
      <NavigationSection />
      <DataSection />
    </>
  );
}

function ActionSection() {
  return (
    <PreviewSection
      id="actions"
      title="Buttons and links"
      description="Five variants, three heights. The sm height is 36px, below the 44px target the design contract commits to, so it carries a transparent hit-area expansion rather than being quietly non-compliant."
    >
      {BUTTON_VARIANTS.map((variant) => (
        <PreviewCase key={variant} title={`Button - ${variant}`}>
          {/* The on-dark variant is invisible on white, which is the whole reason it exists. */}
          <PreviewStage
            className={variant === 'on-dark' ? 'bg-primary' : undefined}
            label={variant === 'on-dark' ? 'On the CTA band gradient' : undefined}
          >
            <PreviewRow>
              {BUTTON_SIZES.map((size) => (
                <Button key={size} variant={variant} size={size}>
                  {`Make an enquiry (${size})`}
                </Button>
              ))}
              <Button variant={variant} disabled>
                Disabled
              </Button>
              <Button variant={variant} loading loadingLabel="Submitting your enquiry">
                Loading
              </Button>
              <Button variant={variant} iconEnd={<Icon icon={ArrowRight} size="sm" />}>
                With trailing icon
              </Button>
            </PreviewRow>
          </PreviewStage>
        </PreviewCase>
      ))}

      <PreviewCase
        title="Full width"
        note="For the mobile form submit, where a button narrower than the field it follows reads as unrelated to it."
      >
        <PreviewStage className="max-w-sm">
          <Button fullWidth>Submit enquiry</Button>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="ButtonLink"
        note="A link that looks like a button. Separate from Button because the element decides the behaviour a keyboard user gets - Enter and a new-tab modifier on a link, Space and no new tab on a button - and styling one as the other strands them."
      >
        <PreviewStage>
          <PreviewRow>
            <ButtonLink href="#actions">Explore services</ButtonLink>
            <ButtonLink
              href="#actions"
              variant="ghost"
              iconEnd={<Icon icon={ArrowRight} size="sm" />}
            >
              View all articles
            </ButtonLink>
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Link"
        note="Underlined inline, because colour alone cannot mark a link (SC 1.4.1)."
      >
        <PreviewStage>
          <div className="flex flex-col gap-3">
            <Text measure>
              An <Link href="#actions">inline link</Link> inside a sentence, where the underline is
              what distinguishes it from the words around it.
            </Text>
            <Link href="#actions" variant="standalone">
              A standalone link
            </Link>
            <Link href="#actions" variant="quiet">
              A quiet link, for a footer column
            </Link>
            <Link href="https://www.nhs.uk" external>
              An external link
            </Link>
          </div>
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}

function FormSection() {
  return (
    <PreviewSection
      id="forms"
      title="Form controls"
      description="Every control takes its id, aria-describedby, and aria-invalid from Field through context rather than from props, and throws if rendered outside one. An unlabelled input looks entirely normal on screen, so the failure has to be made loud."
    >
      <PreviewCase title="Text input">
        <PreviewStage>
          <div className="flex max-w-md flex-col gap-6">
            <Field label="Full name">
              <Input autoComplete="name" />
            </Field>
            <Field label="Email address" hint="We use this to send your reference number." required>
              <Input type="email" autoComplete="email" />
            </Field>
            <Field
              label="Telephone"
              hint="Include the area code."
              error="Enter a telephone number in the format 01632 960000."
            >
              <Input type="tel" autoComplete="tel" defaultValue="0163" />
            </Field>
            <Field label="Reference" hint="Read-only once issued.">
              <Input defaultValue="CERA-2026-0001" readOnly />
            </Field>
            <Field label="Unavailable field">
              <Input disabled defaultValue="Not editable" />
            </Field>
          </div>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Textarea"
        note="Resizes vertically only. Horizontal resize breaks the surrounding layout in a way the user cannot undo."
      >
        <PreviewStage>
          <div className="max-w-md">
            <Field
              label="How can we help?"
              hint="Please do not include clinical details or medical records."
            >
              <Textarea />
            </Field>
          </div>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Select"
        note="Native on purpose. A custom listbox would have to reimplement type-ahead, keyboard paging, the mobile wheel picker, and rendering outside a clipped ancestor - and would get at least one of them wrong."
      >
        <PreviewStage>
          <div className="max-w-md">
            <Field label="Service" hint="Pick the closest match; we will confirm with you.">
              <Select defaultValue="">
                <option value="" disabled>
                  Choose a service
                </option>
                <option value="occupational-health">Occupational health</option>
                <option value="health-screening">Health screening</option>
                <option value="travel-health">Travel health</option>
              </Select>
            </Field>
          </div>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Checkbox and radio group"
        note="Not built on Field: these label themselves, and a fieldset legend is a different structure from a label-and-control pair."
      >
        <PreviewStage>
          <div className="flex max-w-md flex-col gap-6">
            <Checkbox
              label="I agree to CERA Medical contacting me about this enquiry"
              hint="Required so we can reply. You can withdraw consent at any time."
              required
            />
            <Checkbox label="Send me occasional service updates" />
            <Checkbox
              label="I have read the privacy notice"
              error="You need to confirm this before we can continue."
            />
            <Checkbox label="An option that is not available" disabled />

            <RadioGroup
              legend="How would you prefer we reply?"
              name="preview-contact-preference"
              hint="We will use this first, and fall back to the other."
            >
              <Radio label="Email" value="email" defaultChecked />
              <Radio label="Telephone" value="phone" />
              <Radio label="Either is fine" value="either" />
            </RadioGroup>

            <RadioGroup
              legend="Have you used this service before?"
              name="preview-returning"
              error="Choose one of the options."
              required
            >
              <Radio label="Yes" value="yes" />
              <Radio label="No" value="no" />
            </RadioGroup>
          </div>
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}

function FeedbackSection() {
  return (
    <PreviewSection
      id="feedback"
      title="Feedback"
      description="Tone is carried by wording and an icon as well as by colour, so a message that is only distinguishable by its tint would be a bug (SC 1.4.1)."
    >
      <PreviewCase title="Alert">
        <PreviewStage>
          <div className="flex flex-col gap-4">
            {ALERT_TONES.map((tone) => (
              <Alert key={tone} tone={tone} title={`This is a ${tone} alert`}>
                The role follows the tone rather than being a prop: danger gets an assertive live
                region, everything else gets a polite one.
              </Alert>
            ))}
            <Alert tone="info">An alert with no heading, for a single short sentence.</Alert>
          </div>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Toast"
        note="The live region is in the DOM before any message exists. A region inserted at the same moment as its first message is frequently not announced at all."
      >
        <PreviewStage>
          <ToastDemo />
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Spinner"
        note="Announced only where it is the page's primary state. A spinner inside a button is covered by the button's own loading label, and two announcements for one wait is noise."
      >
        <PreviewStage>
          <PreviewRow>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="md" label="Loading your enquiries" announce />
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Skeleton"
        note="Decorative and aria-hidden. The region around it carries aria-busy and the message, so a screen reader hears one announcement rather than six grey boxes."
      >
        <SkeletonDemo />
      </PreviewCase>

      <PreviewCase title="Empty state">
        <PreviewStage>
          <EmptyState
            icon={
              <IconDisc tone="tint">
                <Icon icon={Inbox} size="lg" />
              </IconDisc>
            }
            heading="No enquiries yet"
            description="When you submit an enquiry it will appear here with its reference and current status."
            action={<ButtonLink href="#feedback">Make an enquiry</ButtonLink>}
            headingLevel={4}
          />
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}

function SurfaceSection() {
  return (
    <PreviewSection
      id="surfaces"
      title="Surfaces"
      description="Cards, discs, badges, and rules. A Card takes no href and no onClick by design - a whole clickable card either swallows the text selection or produces a link whose accessible name is the entire card."
    >
      <PreviewCase title="Card">
        <PreviewRow>
          <Card className="max-w-xs">
            <Heading level={4}>A resting card</Heading>
            <Text tone="muted">Paper, not glass. The elevation stays shallow.</Text>
          </Card>
          <Card interactive className="max-w-xs">
            <Heading level={4}>
              <Link href="#surfaces">An interactive card</Link>
            </Heading>
            <Text tone="muted">
              Hover styling mirrors onto focus-within, so a keyboard user sees the same affordance a
              mouse user does.
            </Text>
          </Card>
          <Card className="flex max-w-xs flex-col">
            <Heading level={4}>With a spacer</Heading>
            <Text tone="muted">CardSpacer pins the action to the bottom.</Text>
            <CardSpacer />
            <ButtonLink href="#surfaces" variant="ghost" size="sm">
              Learn more
            </ButtonLink>
          </Card>
        </PreviewRow>
      </PreviewCase>

      <PreviewCase title="Icon disc">
        <PreviewStage>
          <PreviewRow>
            <IconDisc tone="tint" size="sm">
              <Icon icon={Stethoscope} size="md" />
            </IconDisc>
            <IconDisc tone="tint" size="md">
              <Icon icon={Stethoscope} size="md" />
            </IconDisc>
            <IconDisc tone="tint" size="lg">
              <Icon icon={Stethoscope} size="lg" />
            </IconDisc>
            <IconDisc tone="raised" size="md">
              <Icon icon={ShieldCheck} size="md" />
            </IconDisc>
            <IconDisc tone="accent" size="md">
              <Icon icon={CalendarDays} size="md" />
            </IconDisc>
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Badge and pill"
        note="Every tone carries a border, so the distinction survives a forced palette where the background is discarded."
      >
        <PreviewStage>
          <PreviewRow>
            {BADGE_TONES.map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
            <Badge tone="info" srPrefix="Status: ">
              In review
            </Badge>
            <Pill>Health screening</Pill>
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Divider and section rule"
        note="Both live in one file so the choice has to be made deliberately: Divider is a real hr that separates content, SectionRule is aria-hidden ornament under a heading."
      >
        <PreviewStage>
          <div className="flex flex-col gap-4">
            <Text>Content above a divider.</Text>
            <Divider />
            <Text>Content below it.</Text>
            <Divider decorative />
            <SectionRule />
          </div>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Visually hidden"
        note="There is a hidden sentence between these two lines. It is in the accessibility tree and readable by a screen reader, but it is not clipped out of the layout in a way that would strand a focused control."
      >
        <PreviewStage>
          <Text>Above.</Text>
          <VisuallyHidden>This sentence is available only to assistive technology.</VisuallyHidden>
          <Text>Below.</Text>
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}

function NavigationSection() {
  return (
    <PreviewSection
      id="navigation"
      title="Navigation"
      description="Breadcrumbs, pagination, and the focus trap. All three take their link component through a prop, so the package never gains a dependency on Next."
    >
      <PreviewCase
        title="Breadcrumbs"
        note="The last item is aria-current and not a link. A link to the page you are on is a control that appears to do something and does nothing."
      >
        <PreviewStage>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '#navigation' },
              { label: 'Services', href: '#navigation' },
              { label: 'Occupational health' },
            ]}
          />
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Pagination"
        note="A gap of exactly one page is filled rather than elided, because an ellipsis standing in for a single number is longer than the number. Boundary steps render as plain text, never as a link with aria-disabled."
      >
        <PreviewStage>
          <div className="flex flex-col gap-6">
            {/* Three positions, because the windowing is only wrong at the edges. */}
            <Pagination
              currentPage={1}
              totalPages={12}
              hrefForPage={(page) => `#page-${String(page)}`}
            />
            <Pagination
              currentPage={6}
              totalPages={12}
              hrefForPage={(page) => `#page-${String(page)}`}
            />
            <Pagination
              currentPage={12}
              totalPages={12}
              hrefForPage={(page) => `#page-${String(page)}`}
            />
            <Pagination
              currentPage={2}
              totalPages={3}
              hrefForPage={(page) => `#page-${String(page)}`}
            />
          </div>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase title="Focus trap">
        <PreviewStage>
          <FocusTrapDemo />
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Skip link"
        note="The real one is in the layout, at the top of this page. Press Tab from the address bar and it is the first thing focused."
      >
        <PreviewStage>
          <Text tone="muted">
            Rendered in the page shell rather than duplicated here, because two skip links targeting
            the same main content is one more than any page needs.
          </Text>
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}

function DataSection() {
  return (
    <PreviewSection
      id="data"
      title="Table"
      description="The caption is required. A table with no caption is a grid of numbers a screen reader user arrives in with no idea what it holds."
    >
      <PreviewCase
        title="With a visible caption"
        note="The scroll wrapper is a labelled region with tabindex 0, so a keyboard-only user can scroll a wide table without a pointer (SC 2.1.1)."
      >
        <Table caption="Enquiry references and their current status">
          <TableHead>
            <TableRow>
              <TableHeaderCell scope="col">Reference</TableHeaderCell>
              <TableHeaderCell scope="col">Service</TableHeaderCell>
              <TableHeaderCell scope="col">Submitted</TableHeaderCell>
              <TableHeaderCell scope="col">Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableHeaderCell scope="row">CERA-2026-0001</TableHeaderCell>
              <TableCell>Occupational health</TableCell>
              <TableCell>18 September 2026</TableCell>
              <TableCell>
                <Badge tone="info" srPrefix="Status: ">
                  In review
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell scope="row">CERA-2026-0002</TableHeaderCell>
              <TableCell>Health screening</TableCell>
              <TableCell>21 September 2026</TableCell>
              <TableCell>
                <Badge tone="warning" srPrefix="Status: ">
                  Action needed
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </PreviewCase>

      <PreviewCase
        title="With a hidden caption"
        note="For a table whose surrounding heading already names it. Hidden, not absent."
      >
        <Table caption="Opening hours by day" captionHidden>
          <TableHead>
            <TableRow>
              <TableHeaderCell scope="col">Day</TableHeaderCell>
              <TableHeaderCell scope="col">Hours</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableHeaderCell scope="row">Monday to Friday</TableHeaderCell>
              <TableCell>08:00 to 18:00</TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell scope="row">Saturday</TableHeaderCell>
              <TableCell>09:00 to 13:00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </PreviewCase>
    </PreviewSection>
  );
}
