import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from './alert.tsx';
import { ArticleCard } from './article-card.tsx';
import { Badge, Pill } from './badge.tsx';
import { Breadcrumbs } from './breadcrumbs.tsx';
import { Button, ButtonLink } from './button.tsx';
import { Card } from './card.tsx';
import { Checkbox, Radio, RadioGroup } from './choice.tsx';
import { Divider, SectionRule } from './divider.tsx';
import { EmptyState } from './empty-state.tsx';
import { Field } from './field.tsx';
import { IconDisc } from './icon-disc.tsx';
import { Input, Select, Textarea } from './input.tsx';
import { Link } from './link.tsx';
import { Pagination } from './pagination.tsx';
import { ProcessStep, ProcessSteps } from './process-step.tsx';
import { SectionHeader } from './section-header.tsx';
import { ServiceCard } from './service-card.tsx';
import { Skeleton, SkeletonRegion } from './skeleton.tsx';
import { MainContent, SkipLink } from './skip-link.tsx';
import { Spinner } from './spinner.tsx';
import { StatusBadge } from './status-badge.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from './table.tsx';
import { checkA11y } from './testing/axe.ts';
import { Timeline, TimelineItem } from './timeline.tsx';
import { Heading, Text } from './typography.tsx';
import { VisuallyHidden } from './visually-hidden.tsx';

import type { ReactElement } from 'react';

/**
 * Every primitive, through axe.
 *
 * This is deliberately a single parameterised sweep rather than an axe call bolted onto each
 * component's own test file. The point of it is coverage: a new primitive that nobody remembers to
 * check is the one that ships with a broken ARIA reference, so the list below is the checklist, and
 * a component missing from it is visible at a glance.
 *
 * What this cannot check is in `testing/axe.ts` - chiefly colour contrast, which needs a real
 * browser and is instead proved arithmetically in `contrast.test.ts`.
 */

/**
 * Each case is a function rather than an element, and is rendered in whatever context makes it valid
 * markup on its own.
 *
 * A `<li>` outside a list, a `<th>` outside a table, or a radio outside its group are all axe
 * violations in their own right, and reporting them here would say nothing about the component.
 *
 * Functions because a bare array of JSX is an array of elements without keys, which React warns
 * about and `react/jsx-key` rejects - and building them lazily also keeps a case that throws from
 * taking down the whole module before any test runs.
 */
const CASES: readonly (readonly [name: string, render: () => ReactElement])[] = [
  ['Button', () => <Button>Explore services</Button>],
  ['Button with icon', () => <Button iconEnd={<svg />}>Read more</Button>],
  ['Button loading', () => <Button loading>Sending</Button>],
  ['Button disabled', () => <Button disabled>Unavailable</Button>],
  [
    'ButtonLink',
    () => <ButtonLink href="https://example.org/services">Explore services</ButtonLink>,
  ],

  ['Link', () => <Link href="https://example.org">Our accreditation</Link>],
  [
    'Link external',
    () => (
      <Link href="https://example.org" external>
        Our accreditation
      </Link>
    ),
  ],

  [
    'Field with Input',
    () => (
      <Field label="Full name" hint="As it appears on your records" required>
        <Input />
      </Field>
    ),
  ],
  [
    'Field in error',
    () => (
      <Field label="Email address" error="Enter an email address in the format name@example.com">
        <Input type="email" />
      </Field>
    ),
  ],
  [
    'Field with Textarea',
    () => (
      <Field label="How can we help?">
        <Textarea />
      </Field>
    ),
  ],
  [
    'Field with Select',
    () => (
      <Field label="Preferred location">
        <Select>
          <option value="london">London</option>
          <option value="manchester">Manchester</option>
        </Select>
      </Field>
    ),
  ],

  ['Checkbox', () => <Checkbox label="I agree to the privacy policy" required />],
  [
    'Checkbox in error',
    () => <Checkbox label="I agree" error="You must agree before continuing" />,
  ],
  [
    'RadioGroup',
    () => (
      <RadioGroup legend="Preferred contact method" name="contact" hint="We will use this once.">
        <Radio value="email" label="Email" />
        <Radio value="phone" label="Phone" />
      </RadioGroup>
    ),
  ],

  [
    'Card',
    () => (
      <ul>
        <Card as="li" interactive>
          <Heading level={3} size="h4">
            <a href="https://example.org/cardiology">Cardiology</a>
          </Heading>
          <Text size="body-sm">Assessment and ongoing care for heart conditions.</Text>
        </Card>
      </ul>
    ),
  ],

  [
    'Badge',
    () => (
      <Badge tone="warning" srPrefix="Enquiry status">
        Under review
      </Badge>
    ),
  ],
  ['Pill', () => <Pill>Wellness</Pill>],
  [
    'IconDisc',
    () => (
      <IconDisc>
        <svg />
      </IconDisc>
    ),
  ],
  ['Divider', () => <Divider />],
  ['SectionRule', () => <SectionRule />],
  ['Spinner', () => <Spinner />],
  ['VisuallyHidden', () => <VisuallyHidden>Opens in a new tab</VisuallyHidden>],

  ['Alert info', () => <Alert tone="info" title="Your details are saved as a draft" />],
  [
    'Alert error summary',
    () => (
      <Alert tone="danger" title="We could not submit your enquiry">
        <ul>
          <li>
            <a href="#email">Enter an email address</a>
          </li>
        </ul>
      </Alert>
    ),
  ],

  [
    'Skeleton',
    () => (
      <SkeletonRegion label="Loading services" loading>
        <Skeleton className="h-4 w-32" />
      </SkeletonRegion>
    ),
  ],

  [
    'EmptyState',
    () => (
      <EmptyState
        icon={<svg />}
        heading="No services match your filters"
        description="Try removing a filter or searching for a different term."
        action={<Button variant="ghost">Clear filters</Button>}
      />
    ),
  ],

  [
    'Breadcrumbs',
    () => (
      <Breadcrumbs
        items={[
          { label: 'Home', href: 'https://example.org/' },
          { label: 'Services', href: 'https://example.org/services' },
          { label: 'Cardiology' },
        ]}
      />
    ),
  ],

  [
    'Pagination',
    () => (
      <Pagination
        currentPage={3}
        totalPages={12}
        hrefForPage={(page) => `https://example.org/articles?page=${String(page)}`}
      />
    ),
  ],

  [
    'SkipLink and MainContent',
    () => (
      <>
        <SkipLink />
        <MainContent>
          <Heading level={1}>Services</Heading>
        </MainContent>
      </>
    ),
  ],

  [
    'ServiceCard',
    () => (
      <ul>
        <ServiceCard
          title="Cardiology"
          description="Assessment and ongoing care for heart conditions."
          href="https://example.org/services/cardiology"
          icon={<svg />}
        />
      </ul>
    ),
  ],

  [
    'ArticleCard',
    () => (
      <ul>
        <ArticleCard
          title="Understanding blood pressure"
          excerpt="What the two numbers mean and when to act on them."
          href="https://example.org/articles/blood-pressure"
          category="Wellness"
          cover={<img src="/cover.jpg" alt="" />}
        />
      </ul>
    ),
  ],

  [
    'ProcessSteps',
    () => (
      <ProcessSteps>
        <ProcessStep ordinal={1} title="Explore" description="Browse our services." hasNext />
        <ProcessStep ordinal={2} title="Connect" description="We reply within a day." />
      </ProcessSteps>
    ),
  ],

  [
    'SectionHeader',
    () => (
      <SectionHeader
        level={2}
        heading="Our services"
        subheading="Care built around your needs."
        action={<Link href="https://example.org/services">View all services</Link>}
      />
    ),
  ],

  ['StatusBadge', () => <StatusBadge status="action_needed" />],

  [
    'Timeline',
    () => (
      <Timeline>
        <TimelineItem
          dateTime="2026-09-21T09:15:00.000Z"
          dateLabel="21 September 2026"
          title="We received your enquiry"
        />
        <TimelineItem
          dateTime="2026-09-23T14:02:00.000Z"
          dateLabel="23 September 2026"
          title="Your enquiry is being reviewed"
          marker={<StatusBadge status="in_review" />}
          isLast
        />
      </Timeline>
    ),
  ],

  [
    'Table',
    () => (
      <Table caption="Open enquiries">
        <TableHead>
          <TableRow>
            <TableHeaderCell scope="col">Reference</TableHeaderCell>
            <TableHeaderCell scope="col">Status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableHeaderCell scope="row">CERA-2026-0001</TableHeaderCell>
            <TableCell>
              <Badge tone="info">Under review</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  ],
];

describe('axe finds no violations in', () => {
  it.each(CASES)('%s', async (_name, buildCase) => {
    const { container } = render(buildCase());
    const { violations, summary } = await checkA11y(container);

    expect(violations, summary).toHaveLength(0);
  });
});

describe('the axe harness is actually running', () => {
  /**
   * A gate that cannot fail is not a gate.
   *
   * Every sweep above passes, which is indistinguishable from an engine that silently checked
   * nothing - a misconfigured `runOnly` tag, a container that was empty, a promise that was never
   * awaited. This renders a known violation and asserts that it is reported, so the suite proves it
   * has teeth before it certifies anything.
   */
  it('reports a control with no accessible name', async () => {
    const { container } = render(<button type="button" />);

    const { violations } = await checkA11y(container);

    expect(violations.map((violation) => violation.id)).toContain('button-name');
  });

  it('reports a role that does not exist', async () => {
    /**
     * A second control on a different rule family, so a single rule being accidentally disabled
     * cannot leave the whole harness looking healthy.
     *
     * Not a dangling `aria-describedby`, which would be the more obvious choice: axe classes a
     * reference to a missing id as *incomplete* rather than a violation, because the target may be
     * inserted later. That is the right call for a page and useless as a control here.
     */
    // The lint rule catches this statically, which is the point of having it - but a static rule
    // only sees literals, and the harness has to catch the same mistake when the role is computed.
    // eslint-disable-next-line jsx-a11y/aria-role
    const { container } = render(<div role="banana">Menu</div>);

    const { violations } = await checkA11y(container);

    expect(violations.map((violation) => violation.id)).toContain('aria-roles');
  });
});
