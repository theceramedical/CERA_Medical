import { gradientSamples, toHex } from '@cera/ui/contrast';
import {
  colorToken,
  measureAgainstSample,
  measurePairings,
  NON_TEXT_PAIRINGS,
  TEXT_PAIRINGS,
  type MeasuredPairing,
} from '@cera/ui/pairings';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@cera/ui/table';
import { readColorTokens, readRawTokens } from '@cera/ui/tokens';
import { Text, type TypeScale } from '@cera/ui/typography';

import { PreviewCase, PreviewSection } from './shell.tsx';

/**
 * The token half of the preview.
 *
 * Every value here is read out of `theme.css` at request time rather than restated. That is the
 * difference between a preview that documents the design system and a preview that documents what
 * somebody believed about it six months ago: a token renamed, removed, or re-valued shows up here
 * on the next reload, with no second file to remember.
 *
 * Server component. `tokens.ts` reads the filesystem, so this cannot become a client component
 * without the values being inlined at build time - which is the drift this avoids.
 */

/** Read once per render and threaded down, since each call re-reads and re-parses the stylesheet. */
function loadTokens() {
  return { colors: readColorTokens(), raw: readRawTokens() };
}

export function TokenSections() {
  const { colors, raw } = loadTokens();

  return (
    <>
      <ColorSection colors={colors} />
      <ContrastSection colors={colors} />
      <TypeSection raw={raw} />
      <ScaleSection raw={raw} />
    </>
  );
}

/**
 * Swatches, grouped by the prefix of the token name.
 *
 * Grouped rather than listed alphabetically, because the question this section answers is "which
 * teal is `primary`" - and that needs the ramp and the semantic alias visible together.
 */
function ColorSection({ colors }: { readonly colors: Map<string, string> }) {
  const groups = groupColors(colors);

  return (
    <PreviewSection
      id="colour"
      title="Colour"
      description={`${String(colors.size)} colour tokens, parsed from theme.css at request time. Semantic names resolve through to the literal shown.`}
    >
      {groups.map(([group, entries]) => (
        <PreviewCase key={group} title={group}>
          <ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3 p-0">
            {entries.map(([name, value]) => (
              <li key={name} className="flex items-center gap-3">
                {/*
                  A swatch is the one place in this app where an inline colour is correct: the value
                  is the subject, and a utility class cannot be generated for a token whose name is
                  only known at runtime. The `no-raw-color` rule fires on hard-coded literals in
                  source, and this is a variable read from the stylesheet, so it is not one.
                */}
                <span
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-md border border-border"
                  style={{ backgroundColor: value }}
                />
                <span className="min-w-0">
                  <Text size="body-sm" className="truncate font-medium">
                    {name}
                  </Text>
                  {/* Tabular figures so the hex column lines up and a transposed digit is visible. */}
                  <Text size="caption" tone="muted" className="tabular-nums">
                    {value}
                  </Text>
                </span>
              </li>
            ))}
          </ul>
        </PreviewCase>
      ))}
    </PreviewSection>
  );
}

/**
 * Measured contrast for every pairing the gate enforces.
 *
 * The work package asks for ratios "displayed next to each pairing", and the pairing is rendered
 * rather than described: the row shows the real colours at the real size, so a number that looks
 * fine and a pairing that reads badly cannot hide from each other.
 */
function ContrastSection({ colors }: { readonly colors: Map<string, string> }) {
  const text = measurePairings(TEXT_PAIRINGS, colors);
  const nonText = measurePairings(NON_TEXT_PAIRINGS, colors);
  const gradient = gradientSamples(
    colorToken('gradient-from', colors),
    colorToken('gradient-to', colors),
  ).map((sample, index) =>
    measureAgainstSample(
      `white copy on the CTA gradient, sample ${String(index + 1)} of 3`,
      'on-primary',
      sample,
      toHex(sample),
      colors,
    ),
  );

  return (
    <PreviewSection
      id="contrast"
      title="Contrast"
      description="Measured with the WCAG 2.2 relative-luminance formula, rounded down so 4.497 never reports as 4.50. Large text is 24px, or 18.66px bold - not 18px."
    >
      <PreviewCase
        title="Text pairings"
        note="Threshold is 4.5:1, or 3:1 where the pairing is only used at 24px and above."
      >
        <RatioTable
          caption="Measured contrast for text pairings, with the size each is used at"
          rows={text}
        />
      </PreviewCase>

      <PreviewCase
        title="Non-text pairings"
        note="SC 1.4.11 at 3:1. Focus rings, control borders, and the section rule carry meaning without being text."
      >
        <RatioTable
          caption="Measured contrast for non-text pairings against SC 1.4.11"
          rows={nonText}
        />
      </PreviewCase>

      <PreviewCase
        title="CTA band gradient"
        note="Sampled at both stops and the midpoint, because checking only the declared stops leaves the middle of the band unverified."
      >
        <RatioTable
          caption="Measured contrast for white copy over the CTA gradient at three samples"
          rows={gradient}
        />
      </PreviewCase>
    </PreviewSection>
  );
}

function RatioTable({
  caption,
  rows,
}: {
  readonly caption: string;
  readonly rows: readonly MeasuredPairing[];
}) {
  return (
    <Table caption={caption} captionHidden>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Pairing</TableHeaderCell>
          <TableHeaderCell scope="col">Sample</TableHeaderCell>
          <TableHeaderCell scope="col">Ratio</TableHeaderCell>
          <TableHeaderCell scope="col">Needs</TableHeaderCell>
          <TableHeaderCell scope="col">Used at</TableHeaderCell>
          <TableHeaderCell scope="col">Result</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableHeaderCell scope="row">{row.label}</TableHeaderCell>
            <TableCell>
              {/*
                The pairing shown as itself. `aria-hidden` because the swatch repeats the row
                header - a screen reader reading "Aa" after the pairing name adds nothing, and the
                numbers in the next columns are the accessible equivalent.
              */}
              <span
                aria-hidden="true"
                className="inline-flex items-center rounded-md border border-border px-3 py-1"
                style={{ backgroundColor: row.bgHex, color: row.fgHex }}
              >
                {row.size === 'non-text' ? '\u2588\u2588' : 'Aa'}
              </span>
            </TableCell>
            <TableCell className="tabular-nums">{row.ratio.toFixed(2)}:1</TableCell>
            <TableCell className="tabular-nums">{row.required.toFixed(1)}:1</TableCell>
            <TableCell>{row.size}</TableCell>
            <TableCell>
              {/*
                The word, not a colour or a tick. SC 1.4.1 - a green cell and a red cell are
                indistinguishable to a reader who cannot perceive the difference, and this table
                exists to report a compliance result.
              */}
              <Text
                as="span"
                size="body-sm"
                className={row.passes ? 'font-semibold' : 'font-semibold text-danger-700'}
              >
                {row.passes ? 'Passes' : 'Fails'}
              </Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Every step in the scale, rendered at its real size with the clamp expression beside it. */
const TYPE_STEPS: readonly TypeScale[] = [
  'display-1',
  'h1',
  'h2',
  'h3',
  'h4',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'eyebrow',
  'pill',
  'button',
];

function TypeSection({ raw }: { readonly raw: Map<string, string> }) {
  return (
    <PreviewSection
      id="type"
      title="Type scale"
      description="Source Sans 3 throughout, Montserrat for the wordmark only. Fluid steps clamp so the smallest size is still legible at a 320px viewport and the largest stops growing before it overflows."
    >
      {TYPE_STEPS.map((step) => (
        <div key={step} className="flex flex-col gap-1">
          <Text size="caption" tone="muted" className="tabular-nums">
            {`--text-${step}: ${raw.get(`--text-${step}`) ?? 'missing'}`}
          </Text>
          {/*
            Not a heading. Twelve `h3`s reading "The quick brown fox" would make the page outline
            nonsense, and the step name above is already the label.
          */}
          <Text as="div" size={step}>
            Care, support, wellness
          </Text>
        </div>
      ))}
    </PreviewSection>
  );
}

/** The non-colour, non-type scales: space, radius, shadow, motion, and the containers. */
function ScaleSection({ raw }: { readonly raw: Map<string, string> }) {
  const groups: readonly (readonly [string, string, string])[] = [
    ['Spacing', '--spacing', 'The 4px base and the named section rhythm.'],
    ['Radius', '--radius', 'Pill, card, and control corners.'],
    ['Shadow', '--shadow', 'Elevation, kept shallow so cards read as paper rather than as glass.'],
    ['Motion', '--duration', 'Durations. All of it suppressed under prefers-reduced-motion.'],
    ['Easing', '--ease', 'Named curves, so no component invents its own cubic-bezier.'],
    ['Containers', '--container', 'Measure and page-width caps.'],
    ['Fonts', '--font', 'Self-hosted stacks with metric-matched fallbacks.'],
    ['Tracking', '--tracking', 'Letter-spacing for the uppercase steps and the wordmark.'],
  ];

  return (
    <PreviewSection
      id="scales"
      title="Other scales"
      description="Space, radius, shadow, motion, easing, containers, fonts, and tracking, read from the same @theme block."
    >
      {groups.map(([title, prefix, note]) => {
        const entries = [...raw.entries()]
          .filter(([name]) => name.startsWith(`${prefix}-`) || name === prefix)
          .filter(([name]) => !name.includes('--line-height'))
          .filter(([name]) => !name.includes('--letter-spacing'))
          .filter(([name]) => !name.includes('--font-weight'));

        if (entries.length === 0) return null;

        return (
          <PreviewCase key={title} title={title} note={note}>
            <dl className="grid min-w-0 w-full max-w-full grid-cols-1 gap-y-2 min-[40rem]:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] min-[40rem]:gap-x-6">
              {entries.map(([name, value]) => (
                <div key={name} className="flex min-w-0 flex-col border-b border-border py-1">
                  <Text as="dt" size="body-sm" className="min-w-0 font-medium break-words">
                    {name}
                  </Text>
                  <Text as="dd" size="caption" tone="muted" className="min-w-0 break-words">
                    {value}
                  </Text>
                </div>
              ))}
            </dl>
          </PreviewCase>
        );
      })}

      <PreviewCase
        title="Spacing, drawn"
        note="Each bar is the token's real width, so a step that is out of rhythm is visible rather than arithmetic."
      >
        <ul className="flex list-none flex-col gap-2 p-0">
          {[...raw.keys()]
            .filter((name) => name.startsWith('--spacing-'))
            .map((name) => (
              <li key={name} className="flex items-center gap-3">
                <Text size="caption" tone="muted" className="w-40 shrink-0">
                  {name}
                </Text>
                <span
                  aria-hidden="true"
                  className="h-3 bg-accent"
                  style={{ width: `var(${name})` }}
                />
              </li>
            ))}
        </ul>
      </PreviewCase>
    </PreviewSection>
  );
}

/**
 * Splits colour tokens into the ramps and the semantic layer.
 *
 * The prefix before the first digit-bearing segment is the group, so `teal-600` and `teal-50` land
 * together while `primary-hover` stays with the semantic names it belongs to.
 */
function groupColors(
  colors: Map<string, string>,
): readonly (readonly [string, [string, string][]])[] {
  const RAMPS = ['teal', 'navy', 'neutral', 'amber', 'danger', 'success', 'warning'];
  const groups = new Map<string, [string, string][]>();

  for (const [name, value] of colors) {
    const ramp = RAMPS.find((candidate) => name.startsWith(`${candidate}-`));
    const group =
      ramp === undefined ? 'Semantic' : `${ramp[0]?.toUpperCase() ?? ''}${ramp.slice(1)} ramp`;

    const bucket = groups.get(group);
    if (bucket === undefined) groups.set(group, [[name, value]]);
    else bucket.push([name, value]);
  }

  // Semantic last: the ramps are the raw material, the semantic names are what components use, and
  // reading them in that order is what makes the aliasing legible.
  return [...groups.entries()].sort(([a], [b]) =>
    a === 'Semantic' ? 1 : b === 'Semantic' ? -1 : a.localeCompare(b),
  );
}
