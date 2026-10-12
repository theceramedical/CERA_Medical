# CERA editor & operator handbook

Non-technical guide for day-to-day work on the live site. Hostnames below use production URLs; staging uses the same pattern on your staging domain.

## Single-operator handover

This handbook assumes one person runs CERA Medical. You do not need daily SSH,
Docker, GitHub, database, or Authentik administration. Use the public site and the
three operator consoles below; keep the administrator credentials in a password
manager and never paste them into email or WhatsApp.

### Your daily order of work

1. **Start with the staff console** at `https://www.ceramedical.org/staff`.
   Review new enquiries, claim each one, set the next action, and reply within the
   promised three working days.
2. **Check email and ERPNext** at `https://crm.ceramedical.org` for delivery failures,
   duplicate leads, or requests that need a quotation.
3. **Check commerce orders** in Vendure. Confirm COD orders, contact the customer
   if an address or phone number is incomplete, and update the order status after
   dispatch or cancellation.
4. **Publish planned content** in Payload CMS. Save drafts first, proofread the
   public preview, then publish only after checking links, images, and mobile layout.
5. **Open the public website in a private window** and test any important change:
   homepage, services, enquiry form, product page, and checkout.

### Weekly routine

- Review every open enquiry and order; close or reschedule stale work.
- Check `/services`, `/products`, research updates, privacy pages, and contact details.
- Confirm the latest Hetzner backup exists and that the server has free disk space.
- Review UptimeRobot and Resend delivery alerts.
- Remove temporary drafts, unused media, and test products.
- Export or download any business records that must be retained for accounting.

### Monthly routine

- Review staff access in Authentik and remove anyone who no longer works with CERA.
- Confirm MFA is enabled on the staff account.
- Place a small test enquiry and verify the customer receipt, staff alert, and CRM lead.
- Review COD orders and catalogue prices for accuracy.
- Ask the technical administrator to perform a backup-restore rehearsal and apply
  operating-system/security updates.

### The only URLs you need

| Purpose                                   | URL                                           |
| ----------------------------------------- | --------------------------------------------- |
| Public website                            | `https://www.ceramedical.org`                 |
| Enquiries and staff queue                 | `https://www.ceramedical.org/staff`           |
| Content, pages, articles, media           | `https://admin.ceramedical.org`               |
| Products, variants, prices, stock, orders | `https://catalogue.ceramedical.org/dashboard` |
| CRM leads and customer records            | `https://crm.ceramedical.org`                 |
| Identity and MFA administration           | `https://auth.ceramedical.org`                |

The Authentik page may appear briefly during sign-in. That is the secure identity
service; after authentication, return to the CERA staff console or the requested
admin console. Do not use the customer `/account` page to process company enquiries.

## Click-by-click screen guide

### 1. Work a new enquiry

1. Open `https://www.ceramedical.org/staff` and sign in.
2. In the **left sidebar**, click **Enquiries** or **Queue**.
3. Click the newest row, identified by its reference and received time.
4. In the enquiry panel, click **Claim** or **Assign to me**.
5. Read the service, timeline, organisation, and project description.
6. In **Status**, choose the next stage, such as **In review**, **Awaiting client**,
   or **Quoted**.
7. In **Internal note**, write the next action. Do not put the note in the customer
   reply box.
8. Click **Save**.
9. Click **Reply** or open the linked email, write the response, and send it from the
   approved CERA address.
10. Return to the enquiry and click **Save** again so the latest status is recorded.

### 2. Edit a page or the homepage

1. Open `https://admin.ceramedical.org`.
2. In the **left sidebar**, click **Pages**.
3. Search for `home`, `about`, `contact`, `terms`, or the page you need.
4. Click the page title, then click **Edit**.
5. Change the requested heading, paragraph, button, or section. Keep the existing
   slug unless you intentionally want a new URL.
6. Click **Save draft**.
7. Click **Preview** and check desktop and mobile widths.
8. If the copy is approved, click **Request review**. An approver then opens the
   same page, checks it, and clicks **Publish**.
9. Open the public URL in a private browser window and confirm the change.

### 3. Publish a research article

1. In the CMS left sidebar, click **Posts**.
2. Click **Create new**.
3. Enter the **Title**, **Slug**, **Excerpt**, and **Category**.
4. Click **Choose media** beside the cover field and select or upload the image.
5. Enter the article in **Body** and add the SEO title and description.
6. Click **Save draft**, then **Preview**.
7. Check headings, links, image captions, and the article URL.
8. Click **Request review**; the approver clicks **Publish** after checking it.
9. Verify the article under `/articles` and copy its public URL for sharing.

### 4. Change a service

1. Open the catalogue dashboard and use the **left sidebar → Catalog → Products**.
2. Search for the service and click its product name.
3. Click **Edit**, change the service name, summary, description, price, or
   enquiry/checkout setting, then click **Save**.
4. Copy the service **slug** exactly.
5. Open the CMS, click **Service presentations** in the left sidebar, and open the
   presentation with the same slug.
6. Click **Edit**, update the hero, capabilities, process steps, or enquiry panel,
   then click **Save draft → Preview**.
7. Request review and publish after approval.
8. Open `/services/<slug>` in a private window and verify the title, buttons, price,
   and enquiry form.

### 5. Add a physical product

1. In Vendure, click **Catalog → Products → Create product** in the left sidebar.
2. Enter the product name, description, slug, and an internal SKU.
3. Open **Variants**, click **Add variant**, then enter the PKR price, stock, and
   availability.
4. Open **Collections**, select **Physical Products & Reagents**, and click
   **Add product**.
5. Check **Enquiry enabled** or **Checkout enabled** according to the product’s
   purpose, then click **Save**.
6. Open the public `/products` page in a private window.
7. Click the new product, add it to the cart, and check that the price, quantity,
   and COD option are correct.

### 6. Process a COD order

1. In Vendure, click **Sales → Orders** in the left sidebar.
2. Click the newest order and confirm the customer name, phone, delivery address,
   items, quantity, and total.
3. Click **Add note** if you need to record a customer call.
4. Contact the customer before dispatch and confirm the COD amount.
5. Choose the appropriate order status, then click **Save**.
6. Dispatch through the courier and record the tracking number in the order note.
7. When the courier reports delivery, update the order to **Delivered**. If it is
   returned, choose **Cancelled/Returned** and record the reason.

### 7. Review a CRM lead

1. Open `https://crm.ceramedical.org`.
2. In the **left sidebar**, click **Leads**.
3. Search by the CERA enquiry reference or email address.
4. Click the lead to view the enquiry details and communication history.
5. Use **Add comment** for internal follow-up and **Next action** for a reminder.
6. Do not delete the lead when it is finished; set the appropriate status and keep
   the reference for reporting.

### 8. Change a logo, image, or contact detail

1. In the CMS left sidebar, click **Media** and upload a web-ready image, or click
   **Globals → Site settings** for contact details.
2. Click **Edit** on the page or global record that uses the value.
3. Click **Choose media** or edit the requested text field.
4. Click **Save draft → Preview**, then request review and publish.
5. Open the public page and test the header, footer, contact link, and image on a
   phone-sized browser window.

### 9. Manage staff access

1. Open `https://auth.ceramedical.org` and sign in as the administrator.
2. In the **left sidebar**, click **Directory → Users**.
3. Search for the person and click their username.
4. Open **Groups**, add the required CERA group, and click **Save**.
5. Open **MFA devices** and confirm an authenticator device is enrolled.
6. To remove access, return to **Groups**, remove the staff groups, and save; then
   disable the user if the person should not sign in at all.

### 10. Verify any important change

After every publish, product edit, or order change:

1. Open a private browser window.
2. Visit the affected public URL.
3. Use the same path a customer would use: navigation, search, button, form, cart,
   or checkout.
4. Confirm the visible text, links, price, status, and mobile layout.
5. Record the date and what changed in the internal operations note.

### Common daily tasks

**Handle an enquiry:** open `/staff`, open the newest item, verify the reference,
read the service and timeline, claim it, add an internal note, reply by email, and
move it to the next status. Never put private clinical data or patient identifiers
into an enquiry note.

**Publish an article:** CMS → Posts → Create, add title, slug, excerpt, cover image,
body, and SEO description; save as draft; preview the public URL; publish. Use a
new slug for a new article and do not silently change an existing published slug.

**Update a service:** update the matching Vendure service first, then update the
Payload service presentation using the exact same slug. Check the public `/services`
page after publishing.

**Add a physical product:** create the product and variant in Vendure, set PKR price,
SKU, availability, and stock, assign **Physical Products & Reagents**, enable it,
then test the public product page and COD checkout. Do not create real test orders
with a customer’s details.

**Process COD:** confirm the order and phone/address, contact the customer, update
the status when accepted, dispatch through the chosen courier, record the tracking
reference, and mark delivered or cancelled. COD is not payment confirmation until
the courier has collected the amount.

**Change an image or logo:** upload a compressed web-ready image in CMS → Media,
give it a descriptive filename/alt text, replace the reference in the page, publish,
and verify desktop and mobile views. Keep original high-resolution files outside the
production CMS.

### What not to change

Do not edit DNS, production `.env`, database credentials, OIDC client secrets,
Resend keys, Docker Compose files, or server containers from the admin consoles.
Do not delete products or enquiries to correct a mistake; use an unpublished/draft
state or ask the technical administrator to restore the record. Never share the
root/SSH password with ordinary operators.

### If something looks broken

1. Open the public page in a private window and retry once.
2. Check UptimeRobot and the Resend delivery log.
3. Record the URL, approximate time, browser, screenshot, and enquiry/order
   reference; do not include passwords or API tokens.
4. Contact the technical administrator. Do not restart containers or edit `.env`
   unless they explicitly instruct you.

If the site is unavailable, use the last known email/CRM record to avoid losing a
customer request, then report the incident. If a credential may have leaked, revoke
it immediately in the relevant provider and tell the technical administrator.

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

**Vendure alone is enough** for a new service to appear on `/services` and `/services/{slug}` (copy comes from the product in Vendure). Add **Service presentations** in Payload only when you want richer marketing layout and SEO — same slug as Vendure when you do.

### New research service (step by step)

Full playbook: [add-research-service.md](./add-research-service.md) (services only — **not** the `/products` workflow).

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

Vendure 3 does not show collections on the product edit screen. For **services**, open **Catalog → Collections → Laboratory Research** (or Bioinformatics / Evidence), edit the **product filter**, and add your product. For **physical** SKUs, do the same under **Physical Products & Reagents**. If a picker spins on “Loading…”, search by product name or use the product-ID filter after saving the product once.

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
