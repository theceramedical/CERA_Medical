# Stitch designs → CERA implementation map

Source: `stitch_cera_medical_platform/` (Clinical Precision system in `clinical_precision/DESIGN.md`).

## Logo and wordmark (do not change)

**Keep the current production lock-up:** `@cera/ui` `Wordmark` (cross-and-leaf mark + **CERA** / **MEDICAL** in Montserrat), as in `design-language.md` §5.5.

Stitch HTML uses a different icon box and “R&D LABORATORIES” subtitle — **do not port that into the app.** All new layout, ribbon, and section work uses the existing header/footer wordmark only.

| Stitch export                                           | Live route                      | Dynamic content                                                                                                       |
| ------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `cera_medical_biomedical_research_development_homepage` | `/`                             | CMS `pages/home` hero, statistics, CTA; globals `announcement`; static sections in `apps/web/src/content/homepage.ts` |
| `cera_medical_complete_service_portfolio_services`      | `/services`                     | CMS `pages/services` + Vendure catalogue + `servicePresentation`                                                      |
| `cera_medical_preclinical_studies_service_detail_*`     | `/services/preclinical-studies` | Catalogue + CMS presentation                                                                                          |
| `cera_medical_molecular_research_service_detail_*`      | `/services/molecular-research`  | Catalogue + CMS presentation                                                                                          |
| `cera_medical_about_cera_medical_about`                 | `/about`                        | CMS `pages/about`                                                                                                     |
| `cera_medical_contact_study_scoping_contact`            | `/contact`                      | CMS `pages/contact` + `site-settings`                                                                                 |
| `cera_medical_research_updates_articles`                | `/articles`                     | CMS `posts`                                                                                                           |
| Products catalog (`stitch_cera_medical_platform (1)`)   | `/products`                     | Static research-asset catalogue (SKU enquiry via `/enquiry?product=`)                                                 |
| Status ribbon (homepage HTML)                           | All public pages                | CMS global `announcement`                                                                                             |

## Implemented from designs

- Gradient **announcement ribbon** (editable in Payload → Site → Announcement).
- **`MarketingPageHeader`** on services list, service detail, articles, about, and contact (Stitch hero: eyebrow pill, badges, notice, breadcrumbs).
- Homepage **metrics** subtitles and CMS `statistics` block on home layout.
- Service cards with **highlight bullets** and wide evidence-synthesis card (bento-style).
- Hero **badge** copy from CMS hero block (`badgeTitle`, `badgeBody`).
- CMS **`sectionHeading`** on bootstrap pages `services`, `about`, `contact`; **`serviceHero`** layout on all five service presentations (web falls back to `service-hero.ts` defaults when CMS layout is empty).
- **`ServicesFacilitiesSection`** on `/services` (Stitch facilities bento + Haripur hub band).
- Service catalogue cards use the same **highlight bullets** as the homepage.

## CMS-editable (Payload)

| Route                                | Collection / global                      | What editors change                                                                                                           |
| ------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/`                                  | `pages/home` layout                      | Hero, metrics, services showcase, audience/capabilities/deliverables/process/principles/explore blocks, FAQ preview, CTA band |
| `/services`                          | `pages/services` layout + catalogue      | Page hero, facilities grid, callout; card bullets on each **service presentation**                                            |
| `/services/{slug}`                   | `service-presentations`                  | Body, hero badges/notice, card highlights                                                                                     |
| `/articles`                          | `pages/articles` + `posts`               | Page hero; article list from posts                                                                                            |
| `/about`, `/contact`, `/methodology` | `pages/*`                                | `sectionHeading` + rich text body                                                                                             |
| `/faqs`                              | `pages/faqs` hero + `site-settings.faqs` | Page hero; FAQ items                                                                                                          |
| All public                           | `announcement` global                    | Status ribbon                                                                                                                 |

After deploy, run CMS bootstrap (or re-save pages) so existing environments pick up the expanded `home` layout.

## CMS-only public pages

Marketing routes render **`CmsPageUnavailable`** when the matching `pages/*` document is not published. Service card **icons** are set per **service presentation** (`cardIcon` in Payload). Contact details and enquiry panel copy live in **Site settings** (`contactLocations`, `contactEnquiry`). Catalogue API degradation uses `catalogue-fixtures.ts` (not marketing copy).

## Visual reference assets

- `*/screen.png` — full-page screenshots.
- `*/code.html` — Tailwind HTML (Material Symbols); production uses `@cera/ui` + Lucide, per `design-language.md`.

## E-commerce (catalogue) in this repo

CERA does **not** run a cart/checkout storefront. The “commerce” stack is:

| Layer                                                  | Role                                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **Vendure** (`apps/commerce`, `:3002` / `catalogue.*`) | Service **products**: slug, price display, enquiry flags, availability              |
| **`apps/api`**                                         | Public catalogue API (server-side Shop API; checkout mutations blocked per ADR-005) |
| **`/services` + `/services/[slug]`**                   | Stitch-style **product pages**: CMS layout blocks + Vendure fields + enquiry CTA    |
| **`/services/[slug]/enquiry`**                         | Conversion (quote/scoping), not payment                                             |

Product page CMS blocks on **service presentations**: `featureGrid`, `processSteps`, `keyValueList`, `serviceEnquiryAside`, `serviceSidebarCard`, etc. Bootstrap seeds full layouts for molecular and preclinical Stitch exports.

## Content brief

See `.planning/ALL-SCREENS-AND-CONTENT.md` for all copy.
