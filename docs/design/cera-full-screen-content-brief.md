# CERA Medical — full screen & content brief

> **Most complete copy-paste doc:** [`.planning/ALL-SCREENS-AND-CONTENT.md`](../../.planning/ALL-SCREENS-AND-CONTENT.md) — every screen with full on-page text, forms, policies, and account/staff UI.

**Purpose:** Single reference for redesign tools (Stitch, Figma, etc.) with every public tier, route, section order, and copy as implemented in the codebase (October 2026).

**Canonical design system:** [`.planning/design-language.md`](../../.planning/design-language.md) — colours, type scale, layout grids, component specs. This document focuses on **product context, tiers, screens, and text**.

**Production site:** `https://www.ceramedical.org` (use `www`; apex redirects for cookies/canonical).

**Brand name:** CERA Medical — wordmark **CERA** (Montserrat 700) + **MEDICAL** (Montserrat 600, wide letter-spacing). Body/headings: Source Sans 3.

---

## 1. What the platform is

CERA Medical is a **biomedical research and development** company (Haripur, Pakistan). The digital platform:

| Does                                                               | Does not                                  |
| ------------------------------------------------------------------ | ----------------------------------------- |
| Presents five research service lines                               | Take payments online                      |
| Publishes research updates / articles                              | Store clinical records on the public site |
| Captures **project enquiries** (forms)                             | Replace formal project contracts          |
| Lets customers **sign in** (OIDC via Authentik) to track enquiries | Offer consumer “patient portal” care      |

**Back office (not visual design targets for marketing):** Payload CMS (content), Vendure (service catalogue), Fastify API, worker → ERPNext CRM, PostgreSQL, object storage for media.

**Audience:** Universities, biotech R&D, health/public-sector research teams — **not** direct-to-consumer clinical patients.

---

## 2. Three UI tiers (shells)

### Tier A — Public marketing site `(public)`

- **Chrome:** Skip link → **header** (80px) → **main** → **footer** (4 columns + bottom bar).
- **Header:** Wordmark (home) | centre nav (5 items) | search icon | **Sign In** (outline) | **Make an Enquiry** (accent/teal fill).
- **Footer:** Wordmark + tagline | Quick Links | Support | Contact email | copyright bar.
- **Background rhythm:** Alternating `surface-tint` (#EBF6FC), white, `surface-tint-2` (#E6F2FA), gradient CTA, `surface-footer` (#F0F7FD).

### Tier B — Customer account `(account)` — `/account/*`

- **Chrome:** Minimal header (wordmark → home only). **No** marketing nav, **no** footer, **no** “Make an Enquiry”.
- **Background:** Subtle grey (`surface-subtle`).
- **Auth:** Unauthenticated users redirected to sign-in; pages are `noindex`.

### Tier C — Staff console `(staff)` — `/staff/*`

- **Chrome:** Wordmark (not linked) + eyebrow label **“Staff console”**. No footer.
- **Auth:** Staff roles only; `noindex`.

---

## 3. Global navigation & contact

### Main header nav (centre)

| Label            | Path        |
| ---------------- | ----------- |
| Home             | `/`         |
| Services         | `/services` |
| Research Updates | `/articles` |
| About            | `/about`    |
| Contact          | `/contact`  |

### Footer — Quick Links (defaults to same as main nav)

Home, Services, Research Updates, About, Contact.

### Footer — Support

| Label                 | Path              |
| --------------------- | ----------------- |
| Make an Enquiry       | `/enquiry`        |
| Sign In               | `/auth/sign-in`   |
| FAQs                  | `/faqs`           |
| Methodology           | `/methodology`    |
| Data Retention Policy | `/data-retention` |
| Privacy Terms         | `/privacy`        |
| Terms of Service      | `/terms`          |

### Contact defaults

| Channel                          | Value                                                     |
| -------------------------------- | --------------------------------------------------------- |
| Footer / enquiry follow-up email | `contact@ceramedical.org`                                 |
| Contact page email               | `theceramedica@gmail.com`                                 |
| Footer tagline                   | Biomedical Research and Development.                      |
| Copyright                        | © 2026 CERA Medical. All rights reserved.                 |
| Location line                    | Biomedical research and development in Haripur, Pakistan. |

### Social (footer — placeholder roots until real accounts)

LinkedIn, Facebook, Instagram, YouTube (platform home URLs).

### Search

- Header icon → `/search` (full page, not modal).
- Searches static homepage service blurbs + article teasers (not full CMS).

---

## 4. Homepage (`/`) — section order & copy

CMS may override **hero** and **CTA band** fields; everything below uses code defaults unless noted.

| #   | Section               | Background       | Heading / title                                                                                                                                                                                                                                          | Subheading or body                                                                                                                            |
| --- | --------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Hero**              | `surface-tint`   | Eyebrow: _Biomedical Research and Development_                                                                                                                                                                                                           |                                                                                                                                               |
|     |                       |                  | **H1 line 1 (navy):** Research Services,                                                                                                                                                                                                                 |                                                                                                                                               |
|     |                       |                  | **H1 line 2 (teal):** From Study to Report.                                                                                                                                                                                                              |                                                                                                                                               |
|     |                       |                  | Body: CERA Medical partners with universities, biotech teams and health organisations on preclinical studies, molecular laboratory work, metagenomic and omics analysis, and evidence synthesis — with documented methods from scoping through delivery. |                                                                                                                                               |
|     |                       |                  | **Primary CTA:** Explore Services → `/services`                                                                                                                                                                                                          |                                                                                                                                               |
|     |                       |                  | **Secondary CTA:** Make an Enquiry → `/enquiry`                                                                                                                                                                                                          |                                                                                                                                               |
|     |                       |                  | Trust row (3 items): Documented methods · Reproducible analysis · Research team support                                                                                                                                                                  |                                                                                                                                               |
|     |                       |                  | Hero image: `/images/hero-portrait.svg`                                                                                                                                                                                                                  |                                                                                                                                               |
|     |                       |                  | **Badge card:** Scope before samples move — Every project starts with a written plan, agreed timelines, and outputs you can trace.                                                                                                                       |                                                                                                                                               |
| 2   | **Metrics band**      | `surface-tint-2` | (no title)                                                                                                                                                                                                                                               | 5 / Research service lines · 5 / Agreed project stages · 3 days / Target enquiry response · 1 team / Lab, data & reporting                    |
| 3   | **Research Services** | white            | Research Services                                                                                                                                                                                                                                        | Five integrated service lines — each with enquiry enabled on the catalogue so you can request scoping without leaving the site.               |
|     |                       |                  | **5 cards** (see §5) — each **Learn More** → `/services/{slug}`                                                                                                                                                                                          |                                                                                                                                               |
| 4   | **Audiences**         | white + border   | Built for research teams                                                                                                                                                                                                                                 | Laboratory, computational and reporting support for organisations that need reproducible outputs and clear communication.                     |
|     |                       |                  | **Universities & institutes** — Support for grant-funded studies… Highlights: Written scope before work begins; Methods suitable for publication; Secure transfer for large datasets                                                                     |                                                                                                                                               |
|     |                       |                  | **Biotech & industry R&D** — Accelerate preclinical and omics programmes… Highlights: Confidential handling by default; Coordinated lab and compute workflows; Technical reports for decision-making                                                     |                                                                                                                                               |
|     |                       |                  | **Health & public-sector research** — Evidence synthesis and analysis… Highlights: De-identified enquiry and project data; Retention aligned to policy; Staff-only operational notes                                                                     |                                                                                                                                               |
| 5   | **Capabilities**      | `surface-tint`   | Built for rigorous research                                                                                                                                                                                                                              | One team for laboratory studies, computational analysis and evidence you can use.                                                             |
|     |                       |                  | Laboratory capability / Computational research / Confidential by design (short blurbs in code)                                                                                                                                                           |                                                                                                                                               |
| 6   | **Deliverables**      | white            | What you receive                                                                                                                                                                                                                                         | Deliverables are agreed in writing during scoping so everyone knows what “done” looks like before work starts.                                |
|     |                       |                  | 1 Study or analysis plan · 2 Results package · 3 Data handover · 4 Revision round                                                                                                                                                                        |                                                                                                                                               |
| 7   | **Process**           | `surface-tint-2` | How CERA Works                                                                                                                                                                                                                                           | A consistent workflow from first conversation to delivered results, with quality checks at each stage.                                        |
|     |                       |                  | Scoping → Protocol → Execution → Analysis and reporting → Follow-up (5 steps with descriptions)                                                                                                                                                          |                                                                                                                                               |
| 8   | **Principles**        | `surface-tint`   | How we work with partners                                                                                                                                                                                                                                | Principles that apply to every service line — from preclinical studies to omics analysis and evidence reports.                                |
|     |                       |                  | Written scope first · Traceable methods · Confidential handling · Clear communication                                                                                                                                                                    |                                                                                                                                               |
| 9   | **Research insights** | white            | Research insights                                                                                                                                                                                                                                        | Practical guidance on scoping laboratory work, omics analysis, and evidence reporting.                                                        |
|     |                       |                  | **Ghost CTA:** View All Articles → `/articles`                                                                                                                                                                                                           |                                                                                                                                               |
|     |                       |                  | 3 article cards (see §6)                                                                                                                                                                                                                                 |                                                                                                                                               |
| 10  | **FAQ preview**       | `surface-tint-2` | Common questions                                                                                                                                                                                                                                         | Quick answers before you submit an enquiry. Full detail lives on the FAQs page.                                                               |
|     |                       |                  | 3 Q&As + link to `/faqs`                                                                                                                                                                                                                                 |                                                                                                                                               |
| 11  | **Explore**           | white            | Explore CERA Medical                                                                                                                                                                                                                                     | Methodology, background, and contact options when you are ready to scope a project.                                                           |
|     |                       |                  | How we work → `/methodology` · About CERA Medical → `/about` · Get started → `/contact`                                                                                                                                                                  |                                                                                                                                               |
| 12  | **CTA band**          | blue gradient    | Ready to advance your research?                                                                                                                                                                                                                          | Share your research question, materials or datasets. We respond within three working days with next steps — no clinical records on this form. |
|     |                       |                  | Button **Make an Enquiry** → `/enquiry` (white button on gradient)                                                                                                                                                                                       |                                                                                                                                               |
| 13  | **Footer**            | `surface-footer` | (see §3)                                                                                                                                                                                                                                                 |                                                                                                                                               |

**SEO default title:** CERA Medical - Biomedical Research and Development  
**Meta description:** Preclinical studies, molecular research, metagenomic and omics data analysis, and evidence synthesis for research teams and health organisations.

---

## 5. Service catalogue (five live services)

Collections: Laboratory Research · Bioinformatics and Data Analysis · Evidence and Reporting.

| Slug                                   | Title                                    | Short summary (cards)                                                         |
| -------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| `preclinical-studies`                  | Preclinical Studies                      | Safety and efficacy testing in animal models, cells and computer simulations. |
| `molecular-research`                   | Molecular Research                       | Molecular, biochemical and histological analysis of research samples.         |
| `metagenomic-data-analysis`            | Metagenomic Data Analysis                | Microbiome analysis from raw sequencing reads to publication-ready results.   |
| `biomedical-omics-data-analysis`       | Biomedical and Omics Data Analysis       | Statistical and computational analysis of biological and clinical datasets.   |
| `evidence-synthesis-technical-reports` | Evidence Synthesis and Technical Reports | Reviews, assessments and reports that turn evidence into decisions.           |

**Availability line (most services):** Scope, timeline and cost agreed in writing for each project.  
**Metagenomic:** Typical delivery target: within 3 weeks, subject to project scope.  
**Evidence synthesis:** Proposal, timeline and cost agreed for each project.

### Full long descriptions (service detail page body if CMS presentation missing)

Use seed text in `apps/commerce/src/seed-data.ts` — includes ethics, animals (mice, rats, rabbits, guinea pigs), research areas (neurotoxicity, glioblastoma, in silico, etc.), wet-lab methods (Sanger, PCR, Western blot, histology), metagenomic pipelines (Kraken2, QIIME 2, etc.), omics/clinical analysis pipeline, PRISMA systematic reviews and donor/NGO clients. **Explicit:** research services, not clinical care.

### Service list page (`/services`)

- **Title:** Complete Service Portfolio (or CMS)
- **Lede:** CERA Medical provides biomedical research and development services.
- **UI:** Search box + grid of service cards.
- **Optional CMS block:** “Facilities and approach” on tinted band below grid.

### Service detail (`/services/[slug]`)

- **Page header:** title + summary/excerpt.
- **Back link:** All services.
- **Main column:** availability text + long description (CMS Rich Text or catalogue).
- **Sidebar:** “Start a project conversation” + **Request this service** → `/services/[slug]/enquiry` (if enquiry enabled).
- **Sidebar bullets:** Reply target within three working days · Do not include direct participant identifiers · Protocol, timeline and deliverables documented.
- **Related:** Up to 3 other services.

### Service-specific enquiry (`/services/[slug]/enquiry`)

- Same form as general enquiry with service pre-selected/locked.
- **Lede:** Tell us how to reach you. Do not include symptoms, conditions, or test results.

---

## 6. Research articles

### Homepage teasers

| Slug                               | Category         | Title                                       | Excerpt                                                               |
| ---------------------------------- | ---------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| `planning-metagenomic-submissions` | Research methods | Planning a metagenomic submission           | What to agree before transfer: read depth, controls, metadata fields… |
| `omics-quality-control-basics`     | Data analysis    | Omics quality control that reviewers expect | Documented filtering, batch awareness, and traceable figures…         |
| `preclinical-study-handoff`        | Laboratory       | Handing off a preclinical study cleanly     | Ethics approvals, compound safety data, and a written protocol…       |

Covers: `/images/article-cover-data.svg`, `article-cover-research.svg`, `article-cover-lab.svg`.

### Articles index (`/articles`)

- **Title:** Research Updates
- **Lede:** Project news and research articles approved for publication by CERA Medical.
- **Empty:** No articles yet.

### Article detail (`/articles/[slug]`)

- From CMS posts when published; layout follows CMS rich content.

---

## 7. Interior public pages (copy)

### About (`/about`)

- **Title:** About CERA Medical
- **Lede:** A biomedical research and development company providing laboratory, computational and evidence services.
- **Sections:** What we do · How every project runs · Getting in touch · Facilities · Why work with CERA Medical (SECP-registered, Animal House, Cell Culture, Genomics/Sanger, Histopathology, Microscopy, link to methodology).

### Contact (`/contact`)

- **Title:** Contact us
- **Lede:** For project enquiries… reply within three working days.
- **How to reach us:** Email, Laboratory address (PAF-IAST B2-105…), Office address (BIC C2…).
- **Side panel:** Enquiring about a service? → **Make an Enquiry**.

### Methodology (`/methodology`)

- **Title:** How We Work
- **Lede:** Every project follows five stages…
- **Stage cards:** Scoping, Protocol, Execution, Analysis and reporting, Follow-up (full text in app).
- **Long sections per service line:** Preclinical (in vivo / in vitro / in silico toolchains), Molecular, Metagenomic (3 workflows), Biomedical omics, Evidence synthesis.

### FAQs (`/faqs`)

- **Title:** Research Service FAQs
- **7 questions:** Which services · How project begins · Reply time · What to include in request · Large data transfer · Animal studies ethics · Metagenomic timeline (3 weeks target).

### Make an Enquiry (`/enquiry`)

- **Title:** Make an Enquiry
- **Lede:** Tell us which service… follow progress in your account.
- **Form fields:** Name* · Email* · Phone · Institution · Country · Service required* · Project description* · Privacy consent* · Service-specific consent checklists (sequencing / samples / health data) · Optional marketing opt-in · Submit enquiry.
- **Success:** Enquiry received + reference number + 3 working days + contact@ceramedical.org + hint to create account.

**Extra service options in dropdown:** Research collaboration · Other enquiry.

### Sign in (`/auth/sign-in`)

- **Title:** Sign in
- **Lede:** Passwords are never held by this application.
- **Card:** Your CERA account — **Continue to secure sign in** (OIDC).
- **Aside:** New to CERA? — submit without account → Make an enquiry.

### Sign-in error (`/auth/error`)

- Copy depends on `?reason=` query (handled in `authErrorCopy`).

### Search (`/search`)

- **Title:** Search
- Query form; results list services + articles matching homepage static content.

### Sitemap (`/sitemap`)

- **Title:** Sitemap
- Groups: Main pages · Enquiries and support · This site (legal/extra routes).

### Privacy (`/privacy`)

- **Title:** Privacy Terms
- **Lede:** Draft privacy terms…
- **Sections:** Who we are · Scope · Information collected · How used · Research/health data and samples · Sharing · Storage · Security · Retention · Choices · Cookies · Children · External links · Changes · Contact.

### Terms (`/terms`)

- **Title:** Terms of Service
- **Sections:** Status · Enquiries and project agreements · Client responsibilities · Study protocols and animal work · Results and use · Ownership/confidentiality/publication · Contact.

### Data retention (`/data-retention`)

- **Title:** Data Retention Policy
- **Sections:** Purpose and scope · Principles · Proposed retention schedule (enquiries 12mo, sequencing 90d post-report, samples 30d, etc.) · Deletion requests · Longer retention · Destruction methods · Responsibility and review.
- **Alert on page:** Draft / confirm with client where noted in UI.

### CMS catch-all (`/[slug]`)

- Optional CMS pages by slug when published.

---

## 8. Customer account screens

| Route                            | Title            | Lede / purpose                                                                                                                    |
| -------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/account`                       | Your account     | Your enquiries and their progress. Signed-out: prompt to sign in. Signed-in: email, links to profile, claim, enquiries, sign out. |
| `/account/enquiries`             | Your enquiries   | List with reference, status badge, link to detail. Empty: Make an enquiry / Claim.                                                |
| `/account/enquiries/[reference]` | (dynamic)        | Single enquiry timeline for customer.                                                                                             |
| `/account/claim`                 | Claim an enquiry | Link enquiry to verified email; request claim links or paste token.                                                               |
| `/account/profile`               | Your profile     | Display name, phone; save.                                                                                                        |

---

## 9. Staff console screens

| Route                   | Title                  | Lede / purpose                                                     |
| ----------------------- | ---------------------- | ------------------------------------------------------------------ |
| `/staff`                | Enquiry queue          | Review incoming research requests; link to integration deliveries. |
| `/staff/enquiries/[id]` | (dynamic)              | Staff workflow on one enquiry.                                     |
| `/staff/deliveries`     | Integration deliveries | Outbox/CRM delivery monitoring.                                    |

---

## 10. Key user flows (for storyboards)

1. **Discover → enquire:** Home → Services → service detail → Request this service → form → confirmation reference.
2. **Enquire without account:** Footer Make an Enquiry → submit → email follow-up.
3. **Track enquiry:** Sign in (OIDC) → Claim enquiry (email link) → Account enquiries → detail.
4. **Research content:** Research Updates → article → optional enquiry from service links.
5. **Staff:** Sign in with staff role → Queue → open enquiry → update status (internal).

---

## 11. Visual & UX constraints (summary)

Pull full tokens from **design-language.md**. Highlights for designers:

- **Primary button:** `#0A5378` (primary-700), white label.
- **Accent / header CTA fill:** teal-700 on buttons (not teal-600) for AA contrast.
- **Accent headline colour on hero:** teal-700 (`text-accent-hover`).
- **Headings:** navy `#13294B`. Body: `#546575`.
- **Max content width:** 1200px (`max-w-site`); long prose ~65ch (`max-w-measure`).
- **Service grid:** up to 6 columns at xl; 3 article columns at lg.
- **Decorative script SVG** in hero/CTA: not real text; `aria-hidden`.
- **No clinical PHI** on public forms — repeated in copy and consent blocks.
- **Accessibility:** 44px targets, visible focus ring (teal), skip link, distinct nav landmark names.

---

## 12. Homepage FAQ preview (exact)

1. **How does a project begin?** — Discuss question, data/materials, outputs, scope, timeline, cost; recorded in writing before work.
2. **What should I include in an enquiry?** — Service, timeline, outputs; no participant names or direct identifiers.
3. **How quickly will you reply?** — Within three working days.

Link: full FAQs page.

---

## 13. Homepage principles (exact)

| Title                 | Description                                                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| Written scope first   | Research question, materials, deliverables, timeline, cost before lab/analysis work. |
| Traceable methods     | Protocols, software versions, parameters documented for review/reproduction.         |
| Confidential handling | Retention/access rules; public site never collects clinical records.                 |
| Clear communication   | Named reference, account status when claimed, revision path.                         |

---

## 14. Source files (for engineers syncing design → code)

| Content                     | Path                                                                       |
| --------------------------- | -------------------------------------------------------------------------- |
| Homepage data               | `apps/web/src/content/homepage.ts`                                         |
| Navigation                  | `apps/web/src/components/navigation.ts`                                    |
| Catalogue seed              | `apps/commerce/src/seed-data.ts`                                           |
| Enquiry form                | `apps/web/src/components/enquiry-form.client.tsx`                          |
| Design authority            | `.planning/design-language.md`                                             |
| CMS bootstrap / client copy | `apps/cms/src/content/client-website-content.json`, `bootstrap-content.ts` |

---

## 15. Retired / out of scope for marketing design

- Old demo healthcare services (cardiology, travel vaccinations, etc.) — disabled in catalogue.
- `apps/web/src/app/dev/design` — internal design system preview (not public).
- Commerce admin, CMS admin, API — separate apps (localhost 3001–3003).

---

_Generated for design handoff. When CMS publishes a page, live site may replace static fallbacks for About, Contact, Methodology, Policies, Home hero/CTA, and service presentations._
