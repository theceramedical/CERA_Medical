# CERA editor & operator handbook

Non-technical guide for day-to-day work on the live site. Hostnames below use production URLs; staging uses the same pattern on your staging domain.

| System                      | URL                                         | Who uses it                        |
| --------------------------- | ------------------------------------------- | ---------------------------------- |
| Public website              | https://www.ceramedical.org                 | Everyone                           |
| Content (Payload CMS)       | https://admin.ceramedical.org               | Editors & approvers                |
| Service catalogue (Vendure) | https://catalogue.ceramedical.org/dashboard | Operations / catalogue managers    |
| CRM (ERPNext)               | https://crm.ceramedical.org                 | Sales / ops (leads from the site)  |
| Customer portal             | https://www.ceramedical.org/account         | Customers (own enquiries & orders) |
| Staff console               | https://www.ceramedical.org/staff           | CERA team (enquiry queue)          |
| Sign-in admin (Authentik)   | https://auth.ceramedical.org                | IT / administrators only           |

> **Screenshot placeholders:** Add screenshots under `docs/runbooks/images/editor-handbook/` (e.g. `cms-pages-list.png`, `vendure-product-edit.png`) and embed them here when you capture them from production.

---

## What your client can change without a developer

| Task                                        | Tool                             | Notes                                |
| ------------------------------------------- | -------------------------------- | ------------------------------------ |
| Homepage, About, Contact, FAQs, legal pages | **CMS → Pages**                  | Publish workflow (see below)         |
| Research articles                           | **CMS → Posts**                  | Appear under `/articles/...`         |
| Service marketing pages                     | **CMS → Service presentations**  | Slug must match Vendure service slug |
| Site ribbon (e.g. LAB ACCREDITED)           | **CMS → Globals → Announcement** | On/off, message, link                |
| Header/footer links (optional)              | **CMS → Globals → Navigation**   | If empty, site defaults apply        |
| Service names, prices, enquiry flags        | **Vendure admin**                | Drives `/services` grid and API      |
| View CRM leads from enquiries               | **ERPNext**                      | Auto-created from website            |
| Triage web enquiries                        | **Staff console**                | Not the customer `/account` area     |

### Physical products vs research services

| Kind                                            | Who edits marketing copy                         | Who edits price / cart / orders                                      | Public URL                          |
| ----------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------- |
| **Research service**                            | **Payload → Service presentations**              | **Vendure** (not `physical-products`)                                | `/services/{slug}`                  |
| **Shippable product (reagent, kit, cell line)** | Short text in **Vendure** (summary, description) | **Vendure** — must be in collection **Physical Products & Reagents** | `/products` (and `/products/{sku}`) |

**Orders and checkout** always live in **Vendure** (Sales → Orders). Payload does not handle orders.

**Research services** are fully operator-controlled: add the catalogue row in Vendure, then the presentation in Payload with the **same slug** (no developer for a new service line).

**New physical SKUs:** create in Vendure, assign to **Physical Products & Reagents**, enable the product. The website picks up new SKUs automatically within about a minute. Rich marketing cards for flagship SKUs may still come from the seeded design list until you add CMS product pages (future).

---

## CMS (Payload) — sign in and publish

1. Open https://admin.ceramedical.org and sign in with your CMS user (not Google customer sign-in).
2. Most collections use **Draft → Request review → Publish**:
   - **Editor:** edit drafts; set **Review requested** when ready.
   - **Approver / Administrator:** **Publish** to go live.
3. Unpublished content does not appear on the public site.

### Collections cheat sheet

| Collection                                 | Public URL                              |
| ------------------------------------------ | --------------------------------------- |
| **Pages** (`home`, `services`, `about`, …) | `/{slug}`                               |
| **Posts**                                  | `/articles/{slug}`                      |
| **Service presentations**                  | `/services/{slug}`                      |
| **Policies**                               | `/privacy`, `/terms`, `/data-retention` |
| **Media**                                  | Used inside posts/pages                 |
| **Categories**                             | Article groupings                       |
| **Redirects**                              | Old URL → new URL                       |

### Globals

- **Announcement** — top ribbon on all public pages.
- **Site settings** — contact details, enquiry form labels, FAQ snippets.
- **Navigation** — optional header/footer overrides.

### New article (step by step)

1. **Posts → Create**.
2. Title, **slug** (URL), **excerpt**, **category**, optional **cover** (from Media).
3. **Body** (rich text).
4. SEO tab: title/description; leave **no index** off for public posts.
5. Request review → approver publishes.

---

## Vendure — services and SKUs

1. Open https://catalogue.ceramedical.org/dashboard (Vendure v3 dashboard; `/admin` is not used). Superadmin credentials are on the server (`SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD` in `/opt/cera/.env`).
2. **Catalog → Products** — each research service line has a **slug** (e.g. `molecular-research`).
3. Custom fields control enquiry-only vs purchasable, availability text, etc.
4. After changing Vendure, the public site refreshes within about a minute (cached catalogue).

**Always pair Vendure with CMS:** create or update **Service presentations** with the **same slug** for hero copy and layout blocks.

### New research service (step by step)

Do **Vendure first**, then **Payload**. Use a lowercase hyphenated **slug** (e.g. `custom-metagenomics`).

1. **Vendure → Catalog → Products → Create**
   - Name, description, short summary, display price, availability.
   - **Slug** = the URL segment (same value you will use in Payload).
   - Assign a **service** collection (e.g. Laboratory Research, Bioinformatics) — **not** Physical Products & Reagents.
   - Enable the product; set **Enquiry enabled** / **Checkout enabled** as needed; save variants (SKU can match the slug).
2. **Payload → Content → Service presentations → Create**
   - **Title**, **slug** (must match Vendure exactly), body, optional layout blocks.
   - Save as **draft** while writing; **Publish** only when Vendure shows the product as enabled.
   - If publish fails on slug, the Vendure product is missing or disabled — fix catalogue first.
3. Public page: `https://www.ceramedical.org/services/{slug}`.

### New shippable product (step by step)

1. **Vendure → Products → Create** — variant **SKU** (e.g. `CR-REG-9999`), price, stock.
2. **Collections → Physical Products & Reagents → add the product** (or assign that collection on the product).
3. Check **https://www.ceramedical.org/products** after ~1 minute.

If the collection product picker spins on “Loading…”, use **Catalog → Products → your product → Collections** to assign **Physical Products** from the product side until commerce search is deployed.

---

## CRM (ERPNext)

1. Open https://crm.ceramedical.org.
2. Website enquiries create **Leads** with `custom_cera_reference` and the customer message.
3. Staff alert email goes to `EMAIL_STAFF_ALERT_TO` (e.g. `theceramedical@gmail.com`).
4. Internal notes and workflow status for the team live in the **staff console**, not in the customer-visible CRM message field.

See [erpnext.md](./erpnext.md) for field names and API setup.

---

## Customer portal vs staff console (important)

Signing in on the public site (Google or email via Authentik) gives a **customer** session by default:

- **https://www.ceramedical.org/account** — _your_ enquiries, profile, orders (customer view).
- This is correct for `theceramedical@gmail.com` if that user is only in the **customer** group.

**Team triage** uses a different area:

- **https://www.ceramedical.org/staff** — enquiry queue, assignments, delivery retries.
- Requires an Authentik **staff** group and **multi-factor authentication (MFA)** on sign-in.

### Grant staff access (Authentik admin)

1. Open https://auth.ceramedical.org (admin).
2. Find the user (e.g. `theceramedical@gmail.com`).
3. Add one or more groups (names must match exactly):

| Authentik group            | Role                                           |
| -------------------------- | ---------------------------------------------- |
| `cera-enquiry-handlers`    | Handle enquiries                               |
| `cera-operations-managers` | Operations                                     |
| `cera-administrators`      | Full staff + sensitive actions                 |
| `cera-auditors`            | Read-only staff views                          |
| `cera-content-editors`     | CMS editor (separate CMS login still required) |
| `cera-content-approvers`   | CMS publish                                    |

4. Ensure **MFA** is enrolled for that user.
5. User signs out and signs in again, then opens **/staff** (header shows **Staff** when staff groups are present).

Optional: keep `cera-customers` if they should also use `/account` as a customer.

See [authentik-social-login.md](./authentik-social-login.md) for Google button setup.

---

## Enquiry emails

See [enquiry-email.md](./enquiry-email.md). After each enquiry: customer receipt + staff alert to `EMAIL_STAFF_ALERT_TO`.

---

## “Live catalogue data temporarily unavailable” on `/services`

This banner means the **website could not load live services from the API** (not a CMS typo). The page still shows a fallback list.

**Operators:** note it and tell technical support.

If the API is healthy but services still fail, Vendure may be rejecting an oversized catalogue query (`Query is too complex` in API logs). Redeploy **api** and **commerce** after a fix, or restart commerce after raising query limits.

**Technical check (on the server):**

```bash
cd /opt/cera
export CERA_ENV_FILE=/opt/cera/.env
docker compose -f infra/compose/compose.application.yaml ps api commerce web
docker compose -f infra/compose/compose.application.yaml exec web printenv API_INTERNAL_URL
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3003/health/ready  # from api container or host if exposed
```

Expect `API_INTERNAL_URL=http://api:3003` inside **web**, **api** healthy, **commerce** running. After a fix, reload `/services` — the banner should clear within about a minute.

---

## Sitemap and SEO

- https://www.ceramedical.org/sitemap.xml — published CMS content + services + product URLs + static routes.
- https://www.ceramedical.org/robots.txt — blocks `/account`, `/staff`, `/auth`.

---

## Quick daily map

| I want to…                     | Go to…                      |
| ------------------------------ | --------------------------- |
| Fix homepage copy              | CMS → Pages → `home`        |
| Post news                      | CMS → Posts                 |
| Change service price / enquiry | Vendure admin               |
| Change service page design     | CMS → Service presentations |
| See a new web lead             | Email, CRM, or **/staff**   |
| Work the queue                 | **/staff** (not `/account`) |
| Update ribbon                  | CMS → Announcement          |

---

## Handover checklist for a non-technical client

1. CMS editor + approver accounts created; short demo of publish workflow.
2. Vendure admin login documented in a password manager (server ops only).
3. Staff users in Authentik with MFA; bookmark **/staff**.
4. `EMAIL_STAFF_ALERT_TO` set to shared inbox.
5. ERPNext login for CRM.
6. Agree who to contact for **new** `/products` SKUs vs Vendure price edits only.
7. This handbook + screenshot folder shared.
