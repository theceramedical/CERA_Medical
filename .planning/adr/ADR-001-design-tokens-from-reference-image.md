# ADR-001: Design tokens derive from the reference image, not the PRD

**Status:** Accepted
**Date:** 2026-09-21

## Context

The PRD assumes CERA will supply brand assets, and PRD 22 lists "approved logo, brand assets" as a
CERA prerequisite before Day 3. Separately, an approved homepage reference image was provided, and
the instruction accompanying it is explicit: the image's colour palette and typography take priority
over the PRD's branding guidance.

The image is a JPEG, so colours carry compression artefacts and the typeface cannot be read from
metadata. Sampling a single pixel per region gives values that are visibly wrong - a point sample of
the primary button returned `#73c4cb` because it landed on an antialiased edge.

## Decision

1. The reference image is the design authority for colour, typography, spacing, and layout.
   [design-language.md](../design-language.md) is its normative expression. Where the PRD and that
   document disagree on appearance, the design document wins; where they disagree on behaviour,
   accessibility, or data handling, the PRD wins.

2. Colour values are **measured, not estimated**. For flat regions we take the modal colour over a
   box; for text we take the mean of the darkest 12% of pixels in the glyph box. The measured
   anchors are recorded in the design document with the region each came from.

3. Because the typeface cannot be identified from a JPEG and must be licensable for self-hosting,
   we substitute **Source Sans 3** for all running text and **Montserrat** for the `CERA` wordmark
   only. Both are open-licensed and served from the origin through `next/font/google`.

4. Accessibility overrides visual fidelity where they conflict. Two sampled pairings are marginal
   against WCAG 2.2 AA, and both are resolved in favour of contrast:
   - `neutral-500` on white is used only at 18px and above; smaller captions use `neutral-600`.
   - White on `teal-600` is replaced by white on `teal-700` for labels under 16px, which also
     happens to match what the reference's pill regions sample closest to.

5. The handwritten script in the hero and CTA band is decorative artwork. It ships as inline SVG
   marked `aria-hidden`, so no third font is loaded and no screen reader announces it.

## Consequences

- Colour fidelity is defensible and reproducible: the sampling method is recorded, so any value can
  be re-derived from the source image.
- The substituted fonts will not be glyph-identical to the reference. This is a knowing trade for
  licensability and self-hosting, and is flagged for CERA sign-off during Phase 15 UAT.
- Two colour pairings deliberately differ from the reference by one step. This is recorded rather
  than silently applied, so a reviewer comparing pixel to build understands why.
- Token declarations live in exactly one file and a lint rule forbids hard-coded colour in
  components, so a future brand handover is a token edit rather than a refactor.
- If CERA later supplies an official brand guide, it supersedes this record with a new ADR; the token
  indirection means component code does not change.

## Alternatives considered

**Follow the PRD's branding and treat the image as inspiration.** Rejected: it contradicts an
explicit instruction, and the PRD contains no actual palette to follow.

**Eyeball the palette from the rendered image.** Rejected: point sampling demonstrably produced
wrong values on this image, and "approximately teal" is not a reviewable specification.

**Attempt exact font identification and licence the original.** Rejected: identification from a
compressed raster is unreliable, and an unknown commercial licence is a launch risk for a ten-day
delivery. Revisitable once CERA supplies the source design file.
