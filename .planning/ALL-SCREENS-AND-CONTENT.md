# CERA Medical — all screens and contents

**Use this file** to copy every route, section, label, and body text into Stitch, Figma, or other design tools.

**Visual specs (colours, type, components):** [design-language.md](./design-language.md)

**Production URL:** `https://www.ceramedical.org`

**Also mirrored at:** `docs/design/cera-full-screen-content-brief.md` (summary version)

---

## Route index (every screen)

| Tier    | URL                              | Screen name              |
| ------- | -------------------------------- | ------------------------ |
| Public  | `/`                              | Homepage                 |
| Public  | `/services`                      | Service catalogue        |
| Public  | `/services/{slug}`               | Service detail (5 slugs) |
| Public  | `/services/{slug}/enquiry`       | Service-specific enquiry |
| Public  | `/articles`                      | Research updates index   |
| Public  | `/articles/{slug}`               | Article detail (CMS)     |
| Public  | `/articles/category/{slug}`      | Articles by category     |
| Public  | `/about`                         | About                    |
| Public  | `/contact`                       | Contact                  |
| Public  | `/methodology`                   | Methodology              |
| Public  | `/faqs`                          | FAQs                     |
| Public  | `/enquiry`                       | General enquiry form     |
| Public  | `/search`                        | Site search              |
| Public  | `/sitemap`                       | HTML sitemap             |
| Public  | `/privacy`                       | Privacy terms            |
| Public  | `/terms`                         | Terms of service         |
| Public  | `/data-retention`                | Data retention policy    |
| Public  | `/auth/sign-in`                  | Sign in                  |
| Public  | `/auth/error`                    | Sign-in error            |
| Public  | `/{slug}`                        | CMS page (optional)      |
| Account | `/account`                       | Account dashboard        |
| Account | `/account/enquiries`             | Your enquiries list      |
| Account | `/account/enquiries/{reference}` | Enquiry detail           |
| Account | `/account/claim`                 | Claim enquiry            |
| Account | `/account/profile`               | Profile                  |
| Staff   | `/staff`                         | Enquiry queue            |
| Staff   | `/staff/enquiries/{id}`          | Staff enquiry workflow   |
| Staff   | `/staff/deliveries`              | Integration deliveries   |

**Service slugs:** `preclinical-studies`, `molecular-research`, `metagenomic-data-analysis`, `biomedical-omics-data-analysis`, `evidence-synthesis-technical-reports`

---

## Shared chrome — Tier A (public)

### Skip link

- Text: **Skip to main content** → `#main`

### Header (80px, sticky shadow on scroll)

| Zone             | Content                                              |
| ---------------- | ---------------------------------------------------- |
| Left             | Wordmark **CERA** + **MEDICAL** → links `/`          |
| Centre (desktop) | Home · Services · Research Updates · About · Contact |
| Right            | Search icon → `/search` (label: Search the site)     |
| Right            | **Sign In** (outline, sm) → `/auth/sign-in`          |
| Right            | **Make an Enquiry** (accent/teal, sm) → `/enquiry`   |
| Mobile           | Hamburger → same links + Sign In + Make an Enquiry   |

### Footer

| Column     | Heading                                   | Items                                                                                                     |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1          | (wordmark)                                | Tagline: _Biomedical Research and Development._                                                           |
| 2          | Quick Links                               | Same five main nav links                                                                                  |
| 3          | Support                                   | Make an Enquiry · Sign In · FAQs · Methodology · Data Retention Policy · Privacy Terms · Terms of Service |
| 4          | Contact CERA Medical                      | _Project enquiries and information requests:_ **contact@ceramedical.org**                                 |
| Bottom bar | © 2026 CERA Medical. All rights reserved. | _Biomedical research and development in Haripur, Pakistan._                                               |

Social icons (placeholder): LinkedIn, Facebook, Instagram, YouTube.

---

## Shared chrome — Tier B (account)

- Header: wordmark only → `/`
- No footer, no enquiry CTA
- Background: light grey

---

## Shared chrome — Tier C (staff)

- Header: wordmark (not linked) + eyebrow **Staff console**
- No footer

---

# SCREEN: Homepage `/`

**Page title (SEO):** CERA Medical - Biomedical Research and Development  
**Meta description:** Preclinical studies, molecular research, metagenomic and omics data analysis, and evidence synthesis for research teams and health organisations.

### Section 1 — Hero (background: light blue tint)

| Element                | Text                                                                                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eyebrow                | Biomedical Research and Development                                                                                                                                                                                                                |
| Headline line 1 (navy) | Research Services,                                                                                                                                                                                                                                 |
| Headline line 2 (teal) | From Study to Report.                                                                                                                                                                                                                              |
| Body                   | CERA Medical partners with universities, biotech teams and health organisations on preclinical studies, molecular laboratory work, metagenomic and omics analysis, and evidence synthesis — with documented methods from scoping through delivery. |
| Button primary         | Explore Services                                                                                                                                                                                                                                   |
| Button outline         | Make an Enquiry                                                                                                                                                                                                                                    |
| Trust 1                | Documented methods                                                                                                                                                                                                                                 |
| Trust 2                | Reproducible analysis                                                                                                                                                                                                                              |
| Trust 3                | Research team support                                                                                                                                                                                                                              |
| Hero image             | Portrait illustration (`hero-portrait.svg`)                                                                                                                                                                                                        |
| Badge title            | Scope before samples move                                                                                                                                                                                                                          |
| Badge body             | Every project starts with a written plan, agreed timelines, and outputs you can trace.                                                                                                                                                             |

### Section 2 — Metrics band

| Value  | Label                   |
| ------ | ----------------------- |
| 5      | Research service lines  |
| 5      | Agreed project stages   |
| 3 days | Target enquiry response |
| 1 team | Lab, data & reporting   |

### Section 3 — Research Services (white)

- **Heading:** Research Services
- **Subheading:** Five integrated service lines — each with enquiry enabled on the catalogue so you can request scoping without leaving the site.

| Card title                               | Description                                                                                                                     | Link                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Preclinical Studies                      | Safety and efficacy testing in animal models, cells and computer simulations — scoped with ethics approval before samples move. | /services/preclinical-studies                  |
| Molecular Research                       | Molecular, biochemical and histological analysis of research samples.                                                           | /services/molecular-research                   |
| Metagenomic Data Analysis                | Microbiome analysis from raw sequencing reads through QC, annotation, and publication-ready figures.                            | /services/metagenomic-data-analysis            |
| Biomedical and Omics Data Analysis       | Statistical and computational analysis of biological and clinical datasets.                                                     | /services/biomedical-omics-data-analysis       |
| Evidence Synthesis and Technical Reports | Reviews, assessments and reports that turn evidence into decisions.                                                             | /services/evidence-synthesis-technical-reports |

Each card button: **Learn More**

### Section 4 — Built for research teams (white + border)

- **Subheading:** Laboratory, computational and reporting support for organisations that need reproducible outputs and clear communication.

**Universities & institutes**  
Support for grant-funded studies that need specialist laboratory or bioinformatics capacity.

- Written scope before work begins
- Methods suitable for publication
- Secure transfer for large datasets

**Biotech & industry R&D**  
Accelerate preclinical and omics programmes without building every capability in-house.

- Confidential handling by default
- Coordinated lab and compute workflows
- Technical reports for decision-making

**Health & public-sector research**  
Evidence synthesis and analysis with clear governance for sensitive or regulated data.

- De-identified enquiry and project data
- Retention aligned to policy
- Staff-only operational notes

### Section 5 — Built for rigorous research (tint)

- **Subheading:** One team for laboratory studies, computational analysis and evidence you can use.

| Title                  | Body                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Laboratory capability  | Preclinical, molecular, genomics, histopathology and microscopy work delivered through coordinated laboratory services. |
| Computational research | Bioinformatics, omics analysis and simulation workflows designed for clear, publication-ready outputs.                  |
| Confidential by design | Controlled access, documented methods and a clear process for handling research material and data.                      |

### Section 6 — What you receive (white)

- **Subheading:** Deliverables are agreed in writing during scoping so everyone knows what “done” looks like before work starts.

1. **Study or analysis plan** — Agreed endpoints, controls, and acceptance criteria before execution.
2. **Results package** — Figures, tables, and methods text suitable for internal review or publication.
3. **Data handover** — Processed outputs and metadata transferred through agreed secure channels.
4. **Revision round** — Included discussion and one structured revision cycle on delivered reporting.

### Section 7 — How CERA Works (tint-2)

- **Subheading:** A consistent workflow from first conversation to delivered results, with quality checks at each stage.

| Step | Title                  | Description                                                                         |
| ---- | ---------------------- | ----------------------------------------------------------------------------------- |
| 01   | Scoping                | Agree the research question, available data or materials, scope, timeline and cost. |
| 02   | Protocol               | Prepare the study protocol or analysis plan before work begins.                     |
| 03   | Execution              | Carry out the agreed work with defined controls, replicates and quality checks.     |
| 04   | Analysis and reporting | Deliver results with figures, tables and documented methods.                        |
| 05   | Follow-up              | Discuss delivered work and complete included revision rounds.                       |

### Section 8 — How we work with partners (tint)

- **Subheading:** Principles that apply to every service line — from preclinical studies to omics analysis and evidence reports.

| Principle             | Text                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Written scope first   | Every engagement records the research question, materials, deliverables, timeline and cost before laboratory or analysis work begins. |
| Traceable methods     | Protocols, software versions and parameters are documented so results can be reviewed, reproduced, or extended in a follow-on study.  |
| Confidential handling | Project data and samples are handled under agreed retention and access rules. The public website never collects clinical records.     |
| Clear communication   | You receive a named reference for enquiries, status updates through your account when claimed, and a defined path for revisions.      |

### Section 9 — Research insights (white)

- **Subheading:** Practical guidance on scoping laboratory work, omics analysis, and evidence reporting.
- **Link:** View All Articles → `/articles`

| Category         | Title                                       | Excerpt                                                                                                                        |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Research methods | Planning a metagenomic submission           | What to agree before transfer: read depth, controls, metadata fields, and how de-identified files should be packaged.          |
| Data analysis    | Omics quality control that reviewers expect | Documented filtering, batch awareness, and traceable figures — the minimum bar for reproducible biomedical analysis.           |
| Laboratory       | Handing off a preclinical study cleanly     | Ethics approvals, compound safety data, and a written protocol before samples move — how CERA scopes animal and in-vitro work. |

### Section 10 — Common questions (tint-2)

- **Subheading:** Quick answers before you submit an enquiry. Full detail lives on the FAQs page.
- **Link:** All FAQs → `/faqs`

**Q:** How does a project begin?  
**A:** We discuss your research question, available data or materials, required outputs, scope, timeline and cost. The agreed scope is recorded in writing before work begins.

**Q:** What should I include in an enquiry?  
**A:** Describe the service you need, timeline, and outputs. Do not include participant names or other direct identifiers in the website form.

**Q:** How quickly will you reply?  
**A:** We aim to respond within three working days with next steps or clarifying questions.

### Section 11 — Explore CERA Medical (white)

- **Subheading:** Methodology, background, and contact options when you are ready to scope a project.

| Title              | Description                                                                             | Href         |
| ------------------ | --------------------------------------------------------------------------------------- | ------------ |
| How we work        | Five project stages from scoping through follow-up, with quality checks at each step.   | /methodology |
| About CERA Medical | Laboratory, computational, and reporting capabilities for biomedical research partners. | /about       |
| Get started        | Contact details, service request guidance, and what happens after you submit.           | /contact     |

### Section 12 — CTA band (blue gradient)

- **Heading:** Ready to advance your research?
- **Body:** Share your research question, materials or datasets. We respond within three working days with next steps — no clinical records on this form.
- **Button:** Make an Enquiry → `/enquiry`

### Section 13 — Footer

(See shared chrome.)

---

# SCREEN: Services `/services`

- **Title:** Complete Service Portfolio (or CMS override)
- **Lede:** CERA Medical provides biomedical research and development services.
- **Search label:** Search services
- **Button:** Apply
- **Empty:** No services match those filters — Clear the search or browse the full list.
- **Degraded alert:** Live catalogue data is temporarily unavailable. Showing the last known services.
- **Optional footer block:** Eyebrow _Facilities and approach_ + CMS rich text

---

# SCREEN: Service detail `/services/{slug}`

**Per service — header lede = summary; body = long description below.**

### Preclinical Studies

- **Summary:** Safety and efficacy testing in animal models, cells and computer simulations.
- **Availability:** Scope, timeline and cost agreed in writing for each project
- **Long description:** We establish whether a candidate treatment is safe and effective before it reaches human trials. Studies may be in vivo in animal models, in vitro in cell-based systems, or in silico through computer simulation. Services include safety assessment, efficacy testing, toxicology, behavioural testing, cellular assays, pathway analysis, molecular docking, molecular dynamics and binding-energy analysis. Animal studies are designed and documented under a written protocol approved by the institutional animal ethics committee before work begins. Available research animals include mice, rats, rabbits and guinea pigs; available cell lines include glioblastoma and other cell lines held by the Cell Culture Lab. Current research areas include methamphetamine-induced neurotoxicity, social isolation stress, morphine dependence, nicotine, synthetic compounds in neuroscience, gut-induced depression, natural products in glioblastoma and in silico target studies. **These are research services, not clinical care.**

### Molecular Research

- **Summary:** Molecular, biochemical and histological analysis of research samples.
- **Long description:** Wet-lab services… Sanger sequencing, PCR, RT-PCR, Western blot, ELISA, histopathology, microscopy… Human-derived samples must be coded and supplied without direct identifiers…

### Metagenomic Data Analysis

- **Summary:** Microbiome analysis from raw sequencing reads to publication-ready results.
- **Availability:** Typical delivery target: within 3 weeks, subject to project scope
- **Long description:** Whole-metagenome shotgun, MAGs, 16S/ITS… FASTQ, FASTA, SRA… three-week target…

### Biomedical and Omics Data Analysis

- **Summary:** Statistical and computational analysis of biological and clinical datasets.
- **Long description:** WGS/exome, biostatistics, biomarkers, omics… de-identified data unless DSA agreed…

### Evidence Synthesis and Technical Reports

- **Summary:** Reviews, assessments and reports that turn evidence into decisions.
- **Availability:** Proposal, timeline and cost agreed for each project
- **Long description:** PRISMA systematic reviews, donor reports, policy briefs… UN/NGO/ministry clients…

### Sidebar (all enquiry-enabled services)

- **Heading:** Start a project conversation
- **Body:** Tell us about your research question, materials or data, expected outputs and timeline. Scope, cost and delivery are agreed in writing before work begins.
- **Button:** Request this service
- Bullet: Reply target: within three working days
- Bullet: Do not include direct participant identifiers
- Bullet: Protocol, timeline and deliverables documented

### Related block

- **Heading:** Explore related services
- Up to 3 other service cards (title + summary)

### Retired service state

- **Heading:** This service is no longer offered
- **Body:** Travel vaccinations have been withdrawn. Browse current services…

---

# SCREEN: Service enquiry `/services/{slug}/enquiry`

- Same form as general enquiry (see below) with service locked.
- **Lede:** Tell us how to reach you. Do not include symptoms, conditions, or test results.
- Referral-only services: **Enquiries are by referral only** + service name not on public form.

---

# SCREEN: Research Updates `/articles`

- **Title:** Research Updates
- **Lede:** Project news and research articles approved for publication by CERA Medical.
- **Empty:** No articles yet — No research updates have been published yet. — Back to the homepage

---

# SCREEN: Article `/articles/{slug}`

- CMS-driven: title, excerpt, rich body, SEO. Homepage slugs match bootstrap when deployed.

---

# SCREEN: About `/about`

- **Title:** About CERA Medical
- **Lede:** A biomedical research and development company providing laboratory, computational and evidence services.

**What we do**  
CERA Medical is an SECP-registered biomedical research and development company. We test candidate treatments in animal models, cells and computer simulations; run molecular laboratory work; analyse microbiome, omics and clinical data; and prepare evidence reviews and technical reports for health research and decision-making.

**How every project runs**  
Every project follows five stages: scoping, protocol, execution, analysis and reporting, then follow-up… Animal studies begin only after ethics approval… Facilities: Animal House, Cell Culture Lab, Genomics Lab with Sanger sequencing, Histopathology Lab, Microscopy Lab.

**Getting in touch**  
contact@ceramedical.org · contact page · do not include participant identifiers.

**Facilities**  
(Same labs + computational work; GPU specs need confirmation before publish.)

**Why work with CERA Medical**  
PhD-level team, documented workflows, publication-ready outputs, transparent communication, client owns data, revision rounds, written scope per project. Link to methodology.

---

# SCREEN: Contact `/contact`

- **Title:** Contact us
- **Lede:** For project enquiries, contact CERA Medical by email or use the service request form. We aim to reply within three working days.

| Label      | Value                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Email      | theceramedica@gmail.com                                                                                                                   |
| Laboratory | B2-105, B2 Building, Department of Biological and Health Sciences, PAF-IAST, Haripur, Pakistan                                            |
| Office     | 2nd Floor, BIC, C2 Building, Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST), Mang, Haripur, Pakistan |

**Panel — Enquiring about a service?**  
Describe the research service you need… no participant names… large datasets via secure link later… **Make an Enquiry**

---

# SCREEN: Methodology `/methodology`

- **Title:** How We Work
- **Lede:** Every project follows five stages, with service-specific methods set out in a protocol or analysis plan.

**Stages (cards):** Scoping · Protocol · Execution · Analysis and reporting · Follow-up — full text in app.

**Service sections (H2 + paragraphs):**  
Preclinical studies (in vivo / in vitro / in silico toolchains) · Molecular research · Metagenomic data analysis (3 workflows + standards) · Biomedical and omics data analysis · Evidence synthesis and technical reports

---

# SCREEN: FAQs `/faqs`

- **Title:** Research Service FAQs
- **Lede:** Answers about CERA Medical’s research services and project requests.

1. Which services does CERA Medical provide? — (lists all five)
2. How does a project begin? — written scope before work
3. How quickly will you reply? — three working days
4. What should I include in my request? — no direct identifiers
5. How do I transfer large datasets or samples? — secure link / arrange shipping
6. When can animal studies start? — ethics committee approval
7. How long does metagenomic analysis take? — three-week target in brief, confirm in scoping

---

# SCREEN: Make an Enquiry `/enquiry`

- **Title:** Make an Enquiry
- **Lede:** Tell us which service you are interested in and how to reach you. We will confirm by email and you can follow progress in your account.

| Field                    | Required    | Hint                                                               |
| ------------------------ | ----------- | ------------------------------------------------------------------ |
| Name                     | Yes         |                                                                    |
| Email address            | Yes         | We use this address to reply to your request.                      |
| Phone                    | No          |                                                                    |
| Institution              | No          |                                                                    |
| Country                  | No          |                                                                    |
| Service required         | Yes         | Dropdown (see below)                                               |
| Project description      | Yes         | Describe samples, compounds or data… Do not include patient names… |
| Privacy consent          | Yes         | I have read the Privacy Terms… (links /privacy)                    |
| Service-specific consent | Conditional | Checkbox + bullet list (sequencing / samples / health data)        |
| Updates opt-in           | No          | Occasional updates from CERA Medical… unsubscribe anytime          |
| Footer note              |             | Details used only to answer enquiry. Data Retention Policy link.   |
| Submit                   |             | **Submit enquiry**                                                 |

**Service dropdown options:**  
Preclinical Studies · Molecular Research · Metagenomic Data Analysis · Biomedical and Omics Data Analysis · Evidence Synthesis and Technical Reports · Research collaboration · Other enquiry

**Success state**

- **Heading:** Enquiry received
- Thank you… three working days
- Your reference is **{REFERENCE}**
- contact@ceramedical.org · create account to follow progress

---

# SCREEN: Search `/search`

- **Title:** Search
- **Lede:** Find a service or an article.
- Label: Search (min 2 chars)
- Button: Search
- Empty: No results — Browse services
- Live region: result count

---

# SCREEN: Sitemap `/sitemap`

- **Title:** Sitemap
- **Lede:** Every page on this site, in one list…
- Groups: Main pages · Enquiries and support · This site (Sitemap, Search)
- Footnote: Individual service pages listed with catalogue…

---

# SCREEN: Privacy `/privacy`

- **Title:** Privacy Terms
- **Lede:** Draft privacy terms prepared from the content supplied by CERA Medical.
- Draft alert: legal approval required

**Sections (full text in codebase):**  
Who we are · Scope · Information collected · How information is used · Research data, health data and samples · Sharing information · Where information is stored · Security · Retention · Choices and requests · Cookies · Children · External links · Changes · Contact (contact@ceramedical.org, Haripur address)

---

# SCREEN: Terms `/terms`

- **Title:** Terms of Service
- **Lede:** Draft project terms based on the client’s service workflow.
- Draft alert on legal approval

**Sections:** Status of these terms · Enquiries and project agreements · Client responsibilities · Study protocols and animal work · Results and use · Ownership, confidentiality and publication · Contact

---

# SCREEN: Data Retention `/data-retention`

- **Title:** Data Retention Policy
- **Sections:** Purpose and scope · Principles · Proposed retention schedule (enquiries 12mo, client contact 2yr, raw sequencing 90d post-report, outputs 12mo, health datasets 30d, samples 30d, lab records 3mo, invoices 6yr, logs 90d, etc.) · Deletion requests · Longer retention · How records are destroyed · Responsibility and review

---

# SCREEN: Sign in `/auth/sign-in`

- **Title:** Sign in
- **Lede:** Sign in to follow your enquiries and update your details. Passwords are never held by this application.

**Main card — Your CERA account**  
Use your verified email to view enquiries, receive secure claim links and update your contact details.  
**Continue to secure sign in**

**Aside — New to CERA?**  
You can submit a research request without an account… **Make an enquiry**

---

# SCREEN: Sign-in error `/auth/error`

Varies by `?reason=`:

| reason      | Title                                              | Lede                                        |
| ----------- | -------------------------------------------------- | ------------------------------------------- |
| access      | Your account does not have CERA access yet         | Identity sign-in succeeded but no CERA role |
| expired     | This sign-in attempt expired                       | One-time links expire                       |
| identity    | Your identity could not be verified                | Authentik missing details                   |
| mfa         | Staff sign-in requires multi-factor authentication | Second factor not confirmed                 |
| provider    | The identity provider could not complete sign-in   | Exchange with Authentik failed              |
| unavailable | Sign-in is temporarily unavailable                 | Cannot reach sign-in service                |
| (default)   | Sign-in could not be completed                     |                                             |

**Alert:** Your account and enquiry details are safe + recovery plan text  
**Buttons:** Try signing in again · Make an enquiry  
**Aside:** Need help? — contact@ceramedical.org

---

# SCREEN: Account dashboard `/account`

- **Title:** Your account
- **Lede:** Your enquiries and their progress, in one place.

**Signed out:** Sign in to see your enquiries — link to sign-in with `?next=/account`

**Signed in:** Signed in as {email} · Update profile · Claim enquiry · Sign out · View your enquiries · Open enquiries appear once claimed

---

# SCREEN: Your enquiries `/account/enquiries`

- **Title:** Your enquiries
- **Lede:** Every enquiry claimed to this account.
- **Empty:** No enquiries in your account yet — Make an enquiry · Claim an enquiry
- **List:** Reference, service title, status badge, link to detail

---

# SCREEN: Enquiry detail `/account/enquiries/{reference}`

- **Title:** {reference}
- **Lede:** {serviceTitle}
- Status line + timeline (status — timestamp per event)

---

# SCREEN: Claim enquiry `/account/claim`

- **Title:** Claim an enquiry
- **Lede:** Link an enquiry to your verified email.
- Explainer: secure single-use link, same verified email
- **Request claim emails** button
- Success alert: Claim links sent — check inbox and spam
- Token URL: **Claim this enquiry** button

---

# SCREEN: Profile `/account/profile`

- **Title:** Your profile
- **Lede:** Name and phone can be updated here. Email changes go through sign-in.
- Fields: Display name · Phone · Email (disabled)
- **Save changes**
- Caption: profile used only for account and service communications
- Alerts: Profile updated / Check your profile details

---

# SCREEN: Staff queue `/staff`

- **Title:** Enquiry queue
- **Lede:** Enquiries received by the team.
- Subtext: Review, assign and progress incoming research requests.
- Link: Integration deliveries
- **Empty:** The enquiry queue is clear
- **List items:** reference, name, link to detail

---

# SCREEN: Staff enquiry `/staff/enquiries/{id}`

- **Title:** {reference}
- **Lede:** {serviceTitle}
- Contact: name, email, institution, country, phone, message
- **Consent evidence** list (service request, sequencing, samples, health data, updates opt-in)
- Status, Assign to me, status transition dropdown, internal note form
- Internal notes list · Audit history list

---

# SCREEN: Integration deliveries `/staff/deliveries`

- **Title:** Integration deliveries
- **Lede:** Delivery results and failed work awaiting retry.
- List: provider — eventType: status (attempt N) error
- **Retry delivery** for dead_letter items

---

## Enquiry consent bullet lists (when service selected)

**Metagenomic / sequencing** — authorised to share; ethical approval; de-identified; human genetic reads removed in QC; retention per policy

**Preclinical / molecular samples** — ownership/authorisation; coded human samples; hazard disclosure + SDS; materials only for agreed study; animal ethics before studies

**Omics / evidence / health data** — org authorised; consent/approvals; de-identified or DSA; use only for agreed analysis; return/delete per policy

---

## Design reference

Colours, typography, buttons, cards: **design-language.md** sections 1–5.

---

_Source of truth: `apps/web`, `apps/commerce/src/seed-data.ts`, `apps/web/src/content/homepage.ts`. CMS may override pages when published._
