---
name: Clinical Precision
colors:
  surface: '#f7f9ff'
  surface-dim: '#cadcef'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf4ff'
  surface-container: '#e1efff'
  surface-container-high: '#d8eafd'
  surface-container-highest: '#d3e5f7'
  on-surface: '#0b1d2b'
  on-surface-variant: '#41484e'
  inverse-surface: '#213240'
  inverse-on-surface: '#e7f2ff'
  outline: '#71787f'
  outline-variant: '#c1c7cf'
  surface-tint: '#256489'
  primary: '#003b58'
  on-primary: '#ffffff'
  primary-container: '#0a5378'
  on-primary-container: '#8ec6f0'
  inverse-primary: '#95cdf8'
  secondary: '#006970'
  on-secondary: '#ffffff'
  secondary-container: '#8deff9'
  on-secondary-container: '#006e75'
  tertiary: '#22375a'
  on-tertiary: '#ffffff'
  tertiary-container: '#3a4e72'
  on-tertiary-container: '#abc0ea'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#95cdf8'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004b6f'
  secondary-fixed: '#90f2fc'
  secondary-fixed-dim: '#72d5df'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f55'
  tertiary-fixed: '#d7e3ff'
  tertiary-fixed-dim: '#b2c7f1'
  on-tertiary-fixed: '#021b3d'
  on-tertiary-fixed-variant: '#33476a'
  background: '#f7f9ff'
  on-background: '#0b1d2b'
  surface-variant: '#d3e5f7'
typography:
  display-brand:
    fontFamily: Montserrat
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Source Sans 3
    fontSize: 2.5rem
    fontWeight: '700'
    lineHeight: 3rem
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Source Sans 3
    fontSize: 1.875rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Source Sans 3
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Source Sans 3
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: 0em
  headline-md:
    fontFamily: Source Sans 3
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Source Sans 3
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: 0em
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Source Sans 3
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-md:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.025em
  code-tabular:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system establishes an institutional, data-driven visual language tailored for biomedical research, clinical trials, and laboratory analytics. The aesthetic aligns with **Corporate / Modern** principles infused with clinical rigor: highly structured layouts, exact typographic hierarchies, calibrated surface contrasts, and restrained decorative treatment.

### Personality & Tone

- **Authoritative & Scientific:** Communicates peer-reviewed credibility, regulatory compliance, and clinical safety.
- **Systematic & Clear:** Eliminates visual noise to optimize cognitive throughput during complex data analysis, protocol tracking, and multi-omics visualization.
- **Calm & Disciplined:** Leverages cool blue and deep navy values to instill quiet confidence, avoiding trend-driven distraction.

### Target Audience

Biomedical research scientists, principal investigators, clinical trial coordinators, laboratory technicians, and biopharma regulatory officers requiring dense, dependable, and legible data interfaces.

## Colors

The palette enforces strict WCAG 2.2 AA (minimum 4.5:1 for normal text, 3:1 for large text and interactive components) and AAA compliance across all functional tiers.

### Functional Roles

- **Primary (`#0A5378` / Primary 700):** Primary interactive elements, high-priority CTA states, active tab indicators, and primary data marks. Deepened by Primary 900 (`#143047`) for hover/pressed states.
- **Secondary (`#0E8A93` / Teal 600):** Contextual accents, status badges, protocol tags, and subtle progress bars. Reinforced by Teal 700 (`#0A7A84`) for active borders and high-contrast pill text.
- **Dark Neutral & Display (`#13294B` / Navy 900):** Semantic base for headlines, primary body text on light surfaces, high-contrast badges, and primary branding glyphs.
- **Linear Gradient:** `linear-gradient(90deg, #1B5882, #005B7D)` applied exclusively to hero backdrops, primary metric headers, or analytical workflow banners. Never used behind text smaller than 18px bold.
- **Surface Tints:**
  - Hero & KPI Band: `#EBF6FC`
  - Process & Feature Trackers: `#E6F2FA`
  - Footer & Utility Binders: `#F0F7FD`
- **Neutral Ladder:**
  - Canvas: `#FFFFFF` (`neutral-0`)
  - Sub-surface / Canvas Secondary: `#F7FAFC` (`neutral-50`)
  - Table Rows & Dividers: `#EFF4F8` (`neutral-100`)
  - Structural Borders & Hairlines: `#DCE7EF` (`neutral-200`)
  - Subdued Metadata: `#7A8896` (`neutral-500`)
  - Secondary Copy: `#647380` (`neutral-600`)
  - Primary Body & Table Text: `#546575` (`neutral-700`)

## Typography

The type system relies on **Source Sans 3** across all interface tiers to provide exceptional clarity across high-density laboratory records, telemetry, and analytical tables. **Montserrat 700** is strictly quarantined for the primary brand wordmark (`display-brand`) to anchor scientific gravitas without compromising informational clarity elsewhere.

### Execution Rules

- **Tabular Figures:** Always apply `font-feature-settings: "tnum" 1` for all numerical telemetry, sample IDs, biochemical values, and timestamps to maintain vertical column integrity.
- **Headline Colors:** Primary headers must resolve to `#13294B` (`Navy 900`).
- **Body Hierarchy:** Standard interface reading text utilizes `#546575` (`neutral-700`). Secondary captions and timestamps use `#647380` (`neutral-600`).

## Layout & Spacing

The layout is anchored by a fixed-maximum-width grid capped at `1200px` to maintain optimal line lengths and structured data boundaries.

### Grid & Breakpoints

- **Desktop (1024px and above):** 12-column grid, `1200px` max outer bounding box, `1.5rem` (24px) gutters, and `2rem` (32px) margins.
- **Tablet (768px – 1023px):** 8-column grid, fluid width with `1.5rem` gutters and margins.
- **Mobile (Below 768px):** 4-column grid, fluid width with `1rem` (16px) gutters and margins.

### Persistent Scaffolding

- **Application Header:** Fixed height of `80px`, sticky top positioning (`top: 0`, `z-index: 1000`), with an underlying background of `#FFFFFF` and a solid bottom border of `1px solid #DCE7EF`.
- **Vertical Rhythm:** Structural page bands (Hero, Analytics, Process, Utility) must be bounded by explicit vertical padding increments (`space-xl` on mobile, `space-2xl` on desktop).

## Elevation & Depth

To preserve clinical focus and laboratory accuracy, depth is communicated through subtle boundary lines and restrained, cool-tinted drop shadows rather than heavy atmospheric blur or exaggerated elevation layers.

### Elevation Levels

- **Level 0 (Flat Surfaces / Baseline):** Background `#FFFFFF` or `#F7FAFC` with no shadow. Structural separation is maintained via `1px solid #DCE7EF`.
- **Level 1 (Cards, Metric Tiles, Table Headers):** `box-shadow: 0 1px 3px rgba(19, 41, 75, 0.05), 0 1px 2px rgba(19, 41, 75, 0.03);` bounded by `1px solid #DCE7EF`.
- **Level 2 (Dropdowns, Popovers, Active Hover Cards):** `box-shadow: 0 4px 6px -1px rgba(19, 41, 75, 0.08), 0 2px 4px -2px rgba(19, 41, 75, 0.04);` bordered by `#DCE7EF`.
- **Level 3 (Modals, Clinical Alerts, Sticky Drawers):** `box-shadow: 0 10px 15px -3px rgba(19, 41, 75, 0.1), 0 4px 6px -4px rgba(19, 41, 75, 0.05);` paired with a backdrop scrim of `rgba(19, 41, 75, 0.4)`.

## Shapes

The interface embraces a restrained geometric vocabulary to project technical discipline and structural precision. Soft, slight curvatures prevent visual harshness while avoiding overly playful or non-technical forms.

### Curvature Tokens

- **Small (`sm` - 4px):** Checkboxes, form control inputs, inline badges, protocol tags, and tabular action triggers.
- **Medium (`md` - 6px):** Primary and secondary buttons, interactive dropdown triggers, and contextual tooltips.
- **Large (`lg` - 8px):** Content cards, data-grid containers, modal dialogue panels, and hero alert bands.

## Components

### Buttons

- **Primary:** Filled `#0A5378`, text `#FFFFFF`, border-radius `6px`, vertical padding `10px`, horizontal padding `20px`. Hover state resolves to `#143047` (`Primary 900`). Focus state requires a `2px` ring in `#0E8A93` with `2px` offset.
- **Secondary / Outline:** Background `transparent`, border `1.5px solid #0A5378`, text `#0A5378`. Hover fills to `#EBF6FC`.
- **Tertiary / Ghost:** Text `#13294B`, background `transparent`. Hover transitions to `#EFF4F8`.

### Chips & Badges

- **Status / Pill Badges:** Height `24px`, border-radius `4px` (or `12px` for capsule markers), padding `2px 8px`.
  - Active / Validated: Background `#EBF6FC`, text `#0A7A84`, border `1px solid #0E8A93`.
  - Neutral / In Progress: Background `#EFF4F8`, text `#546575`, border `1px solid #DCE7EF`.
  - Alert / Critical: High-contrast red tint paired with deep crimson text, minimum 4.5:1 contrast against surface.

### Input Fields & Controls

- **Text Inputs:** Height `40px`, padding `0 12px`, border `1px solid #DCE7EF`, border-radius `4px`, background `#FFFFFF`. Active focus state triggers border `1.5px solid #0A5378` and a `0 0 0 3px rgba(10, 83, 120, 0.12)` halo.
- **Checkboxes & Radios:** Dimensions `16x16px`, border `1.5px solid #7A8896`, border-radius `4px` (checkbox) or `50%` (radio). Checked state background `#0A5378` with a crisp `#FFFFFF` checkmark indicator.

### Cards & Data Panels

- **Structure:** Background `#FFFFFF`, border `1px solid #DCE7EF`, border-radius `8px`, Level 1 drop shadow.
- **Padding:** Default internal spacing of `1.5rem` (`24px`).
- **Surface Accents:** Cards residing on `#F7FAFC` canvases use `#FFFFFF` fill; cards within high-level summary rows may feature a top accent border of `3px solid #0E8A93`.

### Biomedical Specialized Components

- **Data Tables:** Dense layout with sticky `#F7FAFC` headers, bottom border `2px solid #DCE7EF`, row height `44px`, horizontal border `1px solid #EFF4F8`. Alternate row striping using `#FFFFFF` and `#F7FAFC`. Numeric columns right-aligned with tabular font features enabled.
- **Specimen / Protocol Status Ribbon:** Full-width indicator strip leveraging `linear-gradient(90deg, #1B5882, #005B7D)` for live trial phases, embedded directly beneath the 80px header.
