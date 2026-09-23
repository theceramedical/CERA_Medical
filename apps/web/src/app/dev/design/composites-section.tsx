import { ALL_CUSTOMER_STATUSES } from '@cera/contracts/status';
import { ArticleCard } from '@cera/ui/article-card';
import { ButtonLink } from '@cera/ui/button';
import { Icon } from '@cera/ui/icon';
import { IconDisc } from '@cera/ui/icon-disc';
import { Link } from '@cera/ui/link';
import { ProcessStep, ProcessSteps } from '@cera/ui/process-step';
import { CtaScript, HeroScript } from '@cera/ui/script-art';
import { SectionHeader } from '@cera/ui/section-header';
import { ServiceCard } from '@cera/ui/service-card';
import { SocialLink, SocialMark } from '@cera/ui/social';
import { StatusBadge } from '@cera/ui/status-badge';
import { Timeline, TimelineItem } from '@cera/ui/timeline';
import { Text } from '@cera/ui/typography';
import { Wordmark } from '@cera/ui/wordmark';
import {
  ClipboardList,
  HeartPulse,
  MessageSquare,
  Plane,
  SearchCheck,
  ShieldCheck,
  Stethoscope,
  Syringe,
} from 'lucide-react';

import { PreviewCase, PreviewRow, PreviewSection, PreviewStage } from './shell.tsx';

/**
 * The composites and the brand assets.
 *
 * Every composite is rendered with realistic copy rather than lorem, because the failures these
 * components have are length failures: a two-word title and a one-line excerpt make a card look
 * correct when the real content overflows it. The article excerpt here is deliberately long enough
 * to reach the line clamp.
 */

const STATUS_LABEL_NOTE =
  'Accepts only the customer-facing statuses, so the internal rejected_spam value cannot reach a customer through this component - it is a type error, not a review comment.';

export function CompositeSections() {
  return (
    <>
      <CardSection />
      <ProcessSection />
      <HeaderSection />
      <StatusSection />
      <BrandSection />
    </>
  );
}

function CardSection() {
  return (
    <PreviewSection
      id="composites"
      title="Composites"
      description="Assembled from the primitives, with the same rule throughout: the title is the link and the card is not, so the accessible name of the link is the title rather than the entire card's text."
    >
      <PreviewCase
        title="Service card"
        note="Renders an li, so it needs a list parent. A grid of services is a list, and announcing '3 items' before the first one is information a sighted user gets from the layout."
      >
        {/*
          A `ul`, not a `div`. The first version of this page used a plain grid and axe reported
          `listitem` - a serious violation - for all three cards. The semantics belong to the list, not
          to the card, so the card cannot supply them itself.
        */}
        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            title="Occupational health"
            description="Pre-placement assessments, fitness-for-work reviews, and management referrals for employers of any size."
            href="#composites"
            icon={
              <IconDisc tone="tint">
                <Icon icon={Stethoscope} size="md" />
              </IconDisc>
            }
            headingLevel={4}
          />
          <ServiceCard
            title="Health screening"
            description="Comprehensive screening packages with a written report and a follow-up conversation."
            href="#composites"
            icon={
              <IconDisc tone="tint">
                <Icon icon={SearchCheck} size="md" />
              </IconDisc>
            }
            headingLevel={4}
          />
          <ServiceCard
            title="Travel health"
            description="Destination risk assessment, vaccination schedules, and certificates where they are needed."
            href="#composites"
            icon={
              <IconDisc tone="tint">
                <Icon icon={Plane} size="md" />
              </IconDisc>
            }
            headingLevel={4}
          />
        </ul>
      </PreviewCase>

      <PreviewCase
        title="Article card"
        note="The cover image is supplied by the caller and must carry an empty alt: the title beside it already names the article, and a described cover makes the card announce the same thing twice."
      >
        {/* A `ul`, because the cards are `li` - the semantics belong to the list, not the card. */}
        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard
            title="What to expect at a pre-placement assessment"
            excerpt="A walk through the appointment from arrival to report, including what we ask, what we measure, what we share with your employer, and what stays between you and the clinician."
            href="#composites"
            category="Occupational health"
            headingLevel={4}
          />
          <ArticleCard
            title="Preparing for a health screening"
            excerpt="Fasting, medication, and what to bring, with the short answer first: for most packages you can eat and drink normally, and you should take your usual medication."
            href="#composites"
            category="Screening"
            headingLevel={4}
          />
          <ArticleCard
            title="Travel vaccinations and how far ahead to plan"
            excerpt="Some schedules need six weeks to complete, and a few destinations require a certificate that cannot be issued retrospectively."
            href="#composites"
            category="Travel health"
            headingLevel={4}
          />
        </ul>
      </PreviewCase>
    </PreviewSection>
  );
}

function ProcessSection() {
  return (
    <PreviewSection
      id="process"
      title="Process steps"
      description="An ordered list, so the sequence is in the markup rather than only in the drawn numerals. The numerals and the connecting chevrons are aria-hidden - the list already conveys the order, and 01 read out before every heading is noise."
    >
      <PreviewStage className="bg-surface-tint-2">
        <ProcessSteps>
          <ProcessStep
            ordinal={1}
            title="Tell us what you need"
            description="A short form. No clinical details and no documents at this stage."
            icon={<Icon icon={MessageSquare} size="md" />}
            hasNext
            headingLevel={4}
          />
          <ProcessStep
            ordinal={2}
            title="We review and confirm"
            description="A named coordinator checks the details and comes back with options."
            icon={<Icon icon={ClipboardList} size="md" />}
            hasNext
            headingLevel={4}
          />
          <ProcessStep
            ordinal={3}
            title="Your appointment"
            description="At a time and location that suits, with a clinician who has the context."
            icon={<Icon icon={Syringe} size="md" />}
            hasNext
            headingLevel={4}
          />
          <ProcessStep
            ordinal={4}
            title="Report and follow-up"
            description="A written outcome, and a conversation about it if you want one."
            icon={<Icon icon={HeartPulse} size="md" />}
            headingLevel={4}
          />
        </ProcessSteps>
      </PreviewStage>
    </PreviewSection>
  );
}

function HeaderSection() {
  return (
    <PreviewSection
      id="section-headers"
      title="Section header"
      description="The heading level is required with no default. A default would be guessed from whatever the first call site needed, and every later page would inherit that guess."
    >
      <PreviewCase title="Centred, with a subheading">
        <PreviewStage>
          <SectionHeader
            level={3}
            heading="Our services"
            subheading="Occupational health, screening, and travel medicine, delivered by clinicians who work with your organisation rather than around it."
          />
        </PreviewStage>
      </PreviewCase>

      <PreviewCase title="With an action">
        <PreviewStage>
          <SectionHeader
            level={3}
            heading="Latest articles"
            subheading="Practical guidance, written by the people who deliver the service."
            action={
              <ButtonLink href="#section-headers" variant="ghost" size="sm">
                View all articles
              </ButtonLink>
            }
          />
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}

function StatusSection() {
  return (
    <PreviewSection
      id="status"
      title="Status and timeline"
      description="Status wording comes from packages/contracts, so the badge, the confirmation email, and the portal cannot drift into three different words for the same state."
    >
      <PreviewCase title="Status badge" note={STATUS_LABEL_NOTE}>
        <PreviewStage>
          <PreviewRow>
            {/*
              Mapped from the contract's list rather than written out, so a status added to the
              domain appears here without anyone remembering to update the preview.
            */}
            {ALL_CUSTOMER_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Timeline"
        note="Each entry names the event rather than repeating the status label, and the date is passed as a machine value and a formatted label separately - formatting is the caller's job, because the locale and time zone are."
      >
        <PreviewStage>
          <Timeline>
            <TimelineItem
              dateTime="2026-09-18T09:12:00Z"
              dateLabel="18 September 2026"
              title="You submitted this enquiry"
              description="Reference CERA-2026-0001. A confirmation was sent to the email address you gave us."
            />
            <TimelineItem
              dateTime="2026-09-19T14:40:00Z"
              dateLabel="19 September 2026"
              title="A coordinator picked it up"
              description="Assigned for review within one working day."
            />
            <TimelineItem
              dateTime="2026-09-22T08:05:00Z"
              dateLabel="22 September 2026"
              title="We asked you for one more detail"
              description="We need the site address before we can confirm a date."
            />
            <TimelineItem
              dateTime="2026-09-23T16:20:00Z"
              dateLabel="23 September 2026"
              title="Appointment options sent"
              isLast
            />
          </Timeline>
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}

function BrandSection() {
  return (
    <PreviewSection
      id="brand"
      title="Brand and artwork"
      description="The wordmark is text set in Montserrat, not a traced SVG, so it scales with the user's font size and survives a 400% reflow as words rather than as a blurry bitmap. Only the cross-and-leaf mark is drawn."
    >
      <PreviewCase
        title="Wordmark"
        note="Never a heading. A logo is not a section title, and making it an h1 gives every page the same first heading and demotes the real one."
      >
        <PreviewRow>
          <PreviewStage>
            <Wordmark size="md" />
          </PreviewStage>
          <PreviewStage>
            <Wordmark size="sm" />
          </PreviewStage>
          <PreviewStage className="bg-primary" label="On the dark CTA band">
            <Wordmark size="md" onDark />
          </PreviewStage>
          {/*
            Wrapped in a link rather than rendered `as="a"`, which is the pattern the header will
            use in Phase 04. `Wordmark` takes no anchor props on purpose: an `as` that accepts an
            `href` invites `as="h1"` with an `href` too, and the prop exists to swap `div` for
            `span` in an inline context, not to make the logo a control.
          */}
          <PreviewStage label="Wrapped in a link, as the header will render it">
            <Link href="#brand" variant="quiet" className="inline-block no-underline">
              <Wordmark size="md" as="span" />
            </Link>
          </PreviewStage>
        </PreviewRow>
      </PreviewCase>

      <PreviewCase
        title="Decorative script"
        note="Paths rather than text, so no third font loads for two ornamental phrases. No title and no role: the words are marketing copy, and announced between the hero headline and its buttons they are an interruption."
      >
        <div className="flex flex-col gap-6">
          <PreviewStage className="bg-surface-tint">
            <HeroScript className="max-w-sm text-accent" />
          </PreviewStage>
          <PreviewStage className="bg-primary">
            <CtaScript className="max-w-sm text-on-primary" />
          </PreviewStage>
        </div>
      </PreviewCase>

      <PreviewCase
        title="Social marks"
        note="Drawn here because lucide 1.x removed every brand icon. A Globe in place of a recognisable mark leaves the user guessing which platform a link goes to, and a hidden name is no help to a sighted user scanning a row of four identical circles."
      >
        <PreviewStage className="bg-surface-footer">
          <PreviewRow>
            <SocialLink platform="linkedin" href="https://www.linkedin.com" />
            <SocialLink platform="facebook" href="https://www.facebook.com" />
            <SocialLink platform="instagram" href="https://www.instagram.com" />
            <SocialLink platform="youtube" href="https://www.youtube.com" />
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase
        title="Social marks, undecorated"
        note="The glyph on its own, for a context that supplies its own link. Always aria-hidden - the link around it carries the name."
      >
        <PreviewStage>
          <PreviewRow>
            <SocialMark platform="linkedin" className="size-6" />
            <SocialMark platform="facebook" className="size-6" />
            <SocialMark platform="instagram" className="size-6" />
            <SocialMark platform="youtube" className="size-6" />
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>

      <PreviewCase title="Icon sizes">
        <PreviewStage>
          <PreviewRow>
            <Icon icon={ShieldCheck} size="sm" />
            <Icon icon={ShieldCheck} size="md" />
            <Icon icon={ShieldCheck} size="lg" />
            <Icon icon={ShieldCheck} size="xl" />
            <span className="inline-flex items-center gap-2">
              <Icon icon={ShieldCheck} size="md" label="Verified" />
              <Text as="span" size="body-sm" tone="muted">
                with a name, rendered as hidden text rather than aria-label on the svg
              </Text>
            </span>
          </PreviewRow>
        </PreviewStage>
      </PreviewCase>
    </PreviewSection>
  );
}
