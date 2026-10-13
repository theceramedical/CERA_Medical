# CERA Medical — Owner’s Operating Handbook

Prepared for Habab Ali Ahmed · Edition 2 · 13 October 2026

## Start here

A practical operating guide for one person.

### Habab, this is your working manual

Use the staff portal for requests, Payload CMS for website content, and Vendure for catalogue records and orders. You do not need the server terminal for ordinary daily work.

### Choose the job, then open the right system

- **Reply to a research request:** Staff portal + email · pages 6–7
- **Change the homepage or publish an article:** Payload CMS · pages 8–11
- **Add a research service:** Vendure + CMS · page 12
- **Change products, prices or stock:** Vendure · page 13
- **Process a cash-on-delivery order:** Vendure · page 14
- **Change contact details or menus:** Payload CMS · page 15
- **Fix a login or investigate downtime:** Pages 16–18

### How to read a procedure

Each numbered list is one task. Follow the steps in order, then read the CHECK RESULT box. A saved draft is not a published page. A submitted COD order is not proof of cash received.

### Scope and accuracy

Edition 3 · 13 October 2026. CERA-specific buttons and fields were checked against the project source and runbooks. Third-party dashboards may change labels after updates; this is not a claim that every screen was re-tested live. Live passwords and API keys are deliberately excluded.

## Your workspace

Keep these bookmarks in a browser folder named CERA Operations.

### System directory

- **Public website:** [https://www.ceramedical.org](https://www.ceramedical.org)
- **Staff requests:** [https://www.ceramedical.org/staff](https://www.ceramedical.org/staff)
- **Website CMS:** [https://admin.ceramedical.org/admin](https://admin.ceramedical.org/admin)
- **Catalogue and orders:** [https://catalogue.ceramedical.org/dashboard](https://catalogue.ceramedical.org/dashboard)
- **CRM records:** [https://crm.ceramedical.org](https://crm.ceramedical.org)
- **Identity administration:** [https://auth.ceramedical.org/if/admin/](https://auth.ceramedical.org/if/admin/)
- **Customer account:** [https://www.ceramedical.org/account](https://www.ceramedical.org/account)

### Set up your browser

1. Create the CERA Operations bookmark folder and add the links above. Keep a separate folder for Hetzner, Cloudflare, Resend and UptimeRobot.
2. Store the correct login for each system in your password manager. An Authentik password is not automatically a Payload or Vendure password.
3. Use your owner/staff account for administration. Use a separate customer account or private browser window when checking the customer journey.

### Account readiness

The handover must include working CMS publishing access, Vendure catalogue/order access, staff administrator access and recovery access. If one is missing, ask the technical administrator to provision that specific system; do not reuse or guess secrets.

## The daily routine

A short opening check, followed by the work that needs attention.

### At the start of the day

1. Open the public website. Check the homepage, Services and Contact links. On your phone, open the menu and check that it closes and navigates correctly.
2. Open the staff portal. Read new enquiries, assign work to yourself and identify requests awaiting a reply. Follow page 6.
3. Check the shared Gmail inbox and spam folder. Match replies to the enquiry reference. Follow page 7.
4. Open Vendure and review new orders, pending dispatches and courier updates. Follow page 14.
5. Review monitoring alerts. If an integration or page is failing, use pages 17–18 before changing content.

### Before you finish

- **Requests:** Every active request has an owner and a next action.
- **Orders:** Dispatch information and money actually received are recorded separately.
- **Content:** Any changes made today were checked on the public URL.
- **Follow-up:** Keep a short list: reference, next action, due date and waiting on whom.

### Weekly and monthly

Weekly: review old enquiries, stock, failed integrations and backup history. Monthly: review account access, broken links, contact information, storage capacity and policy accuracy. Schedule a restore check with the technical administrator; a backup list alone does not prove recovery works.

## Handle a research enquiry

Staff portal → open a request → assign → act → record.

### Read and take ownership

1. Open the staff portal from page 4. In the enquiry queue, click the request you want to handle.
2. Read the **Request** section and the customer’s project description. Review **Consent evidence** before arranging files or samples.
3. Find **Workflow**. Click **Assign to me**. If another person is assigned, **Take over assignment** is a deliberate reassignment, not a routine step.
4. Under **Internal note**, type a short next action, such as “Need sample count and preferred delivery date.” Click **Add note**. This note is visible to staff only.
5. In **Contact** click **Reply to enquiry**. Your email app opens a draft addressed to the customer with the reference and service in the subject. Write and send the reply there, then record the follow-up as an internal note.
6. When the work genuinely progresses, choose an available value from **Move to** and click **Update status**. Use only the transitions offered by the application.

### CHECK RESULT

Reload the request. Confirm the assignment, status and note. Read **Internal notes** and **Audit history** to confirm the change was recorded.

### Closed requests

A closed request cannot be reassigned or moved through workflow on this screen, but internal notes remain available. Do not invent a replacement record to bypass a closed state; ask for help if reopening is required.

## Email, CRM and delivery activity

Keep the conversation and its reference connected.

### Reply to the customer

1. Open Gmail at theceramedical@gmail.com. Find the enquiry email or use the address shown on the request.
2. Reply with the enquiry reference in the subject. Confirm the requested service, missing information and next step. Do not request patient identifiers in ordinary email.
3. Return to the staff enquiry. Under **Internal note**, record when you replied and what you are waiting for; click **Add note**.
4. If you use CRM, open ERPNext and search **Lead**. Find the record using the CERA reference. Website orders also create Lead records; they are not automatically ERPNext sales invoices.

### Check an email or CRM integration failure

1. In the staff portal, click **Review delivery activity** to open **Integration deliveries**.
2. Read the provider, event type, status, attempt count and error. Here “delivery” means an integration job, not a courier parcel.
3. For a **dead letter** job, an administrator can use **Retry delivery** after the underlying issue is corrected. Check the destination first to avoid duplicate manual work.
4. Refresh and confirm the job succeeds. If it fails again, record its reference and error for the technical administrator.

### Sending and receiving are different

contact@, info@, support@ and help@ceramedical.org were configured to forward to Gmail. Resend handles application sending. A verified Resend domain does not by itself configure Gmail’s “Send mail as” feature.

## CMS: edit, preview, publish

Learn this once; use it for pages, posts and service presentations.

### Make a controlled content change

1. Open the CMS link on page 4 and sign in with your CMS account. On narrow screens, open the navigation menu to reveal the left sidebar.
2. In the left sidebar, find **Content**. Choose **Pages**, **Posts** or **Service presentations**, then open the record by its title.
3. Read the title and slug before editing. The slug identifies the public address; keep an established slug unless a redirect is planned.
4. Edit the relevant fields. Use **Save draft** while the change is unfinished. Autosave is a convenience, not your public verification.
5. Use the available preview control. Check headings, paragraph spacing, images, links and the mobile view.
6. When ready, use the publish control. As the single operator, you need a CMS administrator or approver role to publish your own work.
7. Open the public URL in a separate tab and reload. Confirm that the exact change is visible.

### CHECK RESULT

Verify the record is published, then check the public page while signed out. If it is unchanged, check the record and slug first; use the troubleshooting page instead of repeatedly creating duplicates.

### Review and history

**Review requested** is a checkbox field for an approval workflow; it does not publish. Draft versions are retained for supported collections. Use the record’s version history to compare an earlier version before restoring it, then verify its publication state.

## Update the homepage

CMS → Content → Pages → the homepage record.

### Change an existing section

1. Open **Pages** in the CMS sidebar. Open the record used for the homepage and confirm it with Preview.
2. Find **Layout**. Expand the block for the section you want to change. Match its heading to the public homepage so you edit the right section.
3. Edit the headline, supporting text and button label or destination inside that block. Keep one clear purpose per section.
4. For an image field, choose an existing Media item or upload a prepared image. Add useful alternative text in Media.
5. To add a section, use the Layout add-block control and choose a suitable block, such as a feature grid, process steps, article preview or call to action. Fill its required fields.
6. Use the block reorder controls to position it. Save a draft, preview the whole page, then publish when the order is correct.

### A clear homepage sequence

- **Introduce:** What CERA does and who it serves.
- **Explain:** Services and the process for starting a project.
- **Support:** Approved facilities, research updates and useful evidence.
- **Invite:** A clear enquiry action and contact information.

### CHECK RESULT

On desktop and mobile, verify section order, no repeated heading, readable text and working buttons. An article-preview block draws from published posts; add the article in Posts rather than pasting the same article into the homepage.

## Publish a research update

CMS → Content → Posts → create or edit.

### Create the article

1. In the left sidebar, click **Posts** under **Content**. Use the create control for a new post; open an existing title to revise one.
2. Enter a clear **Title** and a stable **Slug**. Write the **Excerpt** as a short introduction that makes sense on a card.
3. Choose the required **Category**. Select a cover image from Media. Do not upload confidential laboratory or participant information.
4. Write the **Body**. Use meaningful headings, short paragraphs and descriptive links. Add publication or source links where relevant.
5. Complete the SEO fields when available. Save a draft and preview the article.
6. Publish, then visit the research-updates area and open the article. Check that its card and detail page both work.

### CHECK RESULT

The detail address uses /articles/ followed by the slug. Confirm title, excerpt, cover, body and links. If the homepage has an article-preview block, check whether the article appears under that block’s configured selection.

### Revise or remove

For a correction, edit the existing post so its URL stays stable. To withdraw a post, unpublish it rather than deleting it immediately. Check menus and homepage links that might still point to it. Delete only when you intend to remove the record and have preserved anything needed.

## Images and media

Prepare once, then reuse the same asset wherever it belongs.

### Upload and place an image

1. Prepare a JPG, PNG or other format accepted by the upload field. Use a descriptive filename and an appropriately sized image; avoid uploading an enormous original for a small card.
2. Open **Media** in the CMS sidebar. Use the upload/create control and choose the file.
3. Enter **Alt** text describing what the image communicates, such as “Microscopy workstation in the CERA laboratory”. Save the media record.
4. Return to the page, post or service presentation. In the image relationship field, select the saved Media item.
5. Save the content draft and preview. Check cropping, orientation and readability before publishing.

### Replace carefully

For a new image, select the replacement asset in each relevant content record and republish. Before deleting an old Media item, check where it is used. Deleting a shared file can break several pages.

### Storage in this handover

R2 is deferred. Treat uploaded media as dependent on the production server’s local storage until the technical administrator confirms migration. Confirm that media files, databases and configuration are covered by recovery procedures.

### Logo changes

Open **Site → Site settings → Website logo**. Upload or select a Media image, then save. Check the public header/footer and both portals. Clear the field to restore the default logo. Authentik branding remains a separate administrator task.

## Add a research service

Vendure creates the service; CMS gives it a rich presentation.

### 1 · Create the catalogue record

1. Open Vendure. In the left navigation, choose **Catalog → Products**, then **Create**. Vendure also calls research services “products”.
2. Enter the name, slug, description and available service fields. Add the variant, SKU and appropriate price. Choose enquiry/checkout behavior deliberately and enable the record. Save.
3. Open **Catalog → Collections**. Open the appropriate service collection: Laboratory Research, Bioinformatics, or Evidence and Reporting.
4. In the collection’s Contents/Filters area, add the new record using its manual product-selection filter. Preserve the existing selections and save. Do not put a service in **Physical Products & Reagents**.

### 2 · Build the service page

1. Open CMS → **Content → Service presentations**. Create a presentation with the exact same slug as Vendure.
2. Fill Title, Excerpt, Body and Card highlights. Add Layout blocks for the service hero, capabilities, process and enquiry panel. Save a draft.
3. Publish after the corresponding Vendure service is enabled. To edit the main services-page introduction instead, open **Pages → services**.

### CHECK RESULT

Visit /services, then /services/your-slug. Check the card, full page and enquiry button. The CMS validates the catalogue when publishing: a missing/disabled catalogue record or mismatched slug must be corrected first.

## Manage products and prices

Vendure is the source of catalogue, variant and stock information.

### Create or update a product

1. Open Vendure. In the left navigation, select **Catalog → Products**. Open an existing product or choose **Create**.
2. Enter the product name, stable slug and description. Upload/select product assets using Vendure’s asset controls; these are separate from CMS Media.
3. Add or edit variants. Each sellable variant needs a meaningful SKU and the correct price. Check that you are working in the intended channel and currency.
4. Set stock/availability as appropriate. Review any **Enquiry enabled** and **Checkout enabled** fields. A switch alone does not override the website’s eligibility rules.
5. Save and enable when approved. From **Catalog → Collections**, add physical listings to **Physical Products & Reagents**, retaining the existing selections.
6. Open the public product listing, then its detail page. Check the rendered name, images, description, SKU, PKR price and available action.

### CHECK RESULT

A catalogue record is not automatically purchasable. Some physical listings are enquiry-only. Confirm the public Add to cart or enquiry action rather than promising checkout based on the admin form.

### Retire a listing

Disable it first and check the public site. Do not delete products or variants needed by existing orders. If you must delete an unused test record, confirm it has no real orders and remove any related CMS/menu links. Product pages use a shared application layout; Vendure controls the product data.

## Process a COD order

Confirm the order, arrange fulfilment, then reconcile the cash.

### From new order to completion

1. Open Vendure and choose **Sales → Orders** in the left navigation. Open the order by its code. If the dashboard version groups navigation differently, find Orders in its navigation/search.
2. Read the customer details, items, quantities, shipping address, shipping charge, total and payment method. Confirm that the order is COD.
3. Contact the customer to confirm the address, telephone number, items and amount to collect. Record the contact outcome in the available order notes.
4. Use the order’s fulfilment action when the goods are ready. Select the correct quantities and record the courier/tracking information requested by the form.
5. Update fulfilment using only the actions available in the dashboard and the actual courier evidence. A submitted order is not proof of dispatch or delivery.
6. When the courier remits the money, reconcile the amount with the order total and fees. Use the applicable payment action only after checking the payment record and money received.
7. For a failed delivery, cancellation or return, record the reason and follow the available cancellation/return actions. Reconcile stock and any money separately.

### CHECK RESULT

Keep the order code, courier reference and payment evidence together. Vendure is the fulfilment source of truth. The ERPNext integration creates a Lead record, not a complete accounting or courier workflow.

### Customer checkout checks

Checkout requires a signed-in customer with verified email and an eligible listing. Verify the cart total, PKR currency, delivery details and COD option. Use an explicitly labelled test order only by agreement; do not accidentally dispatch or collect payment for it.

## Contacts, menus and policies

Small global changes can affect the entire website.

### Update contact information

1. Open the CMS sidebar and find **Site settings** in the globals area.
2. Edit Email, Phone, Address or **Contact locations**. Check the label, value and link for each location.
3. If needed, edit the **Contact page enquiry panel**, social links, newsletter wording or **Frequently asked questions**. Save the global.
4. Open the public Contact page and footer. Test email, phone and social links.

### Change navigation or an announcement

1. Open **Navigation** in the CMS globals area. Edit the header or footer item’s label and href. Preserve working destinations; save.
2. To change the notice strip, open **Announcement**. Review Enabled, Status label, Message, Href and Link label. Save.
3. Check the header, footer and notice on desktop and mobile. Follow each changed link.

### Consent and policy changes

Site settings → **Enquiry form** holds consent wording, consent version, messages, labels and hints. Change the version when consent wording changes, and update the corresponding public policy pages consistently. Do not alter approved obligations casually.

### Public policy check

Review /privacy, /terms and /data-retention after a policy update. Confirm the effective date, real contact details and current storage/backup practice. Publication is not proof that deletion or retention jobs are implemented; confirm operational changes with the technical administrator.

## Accounts and access

Keep the customer experience separate from administration.

### Sign in for the right job

1. For customer testing, open the public account/sign-in link. For operational work, open **/staff/sign-in**.
2. Use the account provisioned for that purpose. Signing in successfully does not automatically grant CMS, commerce or staff permissions.
3. After sign-in, confirm the destination: customers use the account portal; staff use the staff workspace.
4. When finished on a shared device, sign out of the application and close the browser session. If another application remains signed in, sign out there too.

### If you hire someone later

Create a named identity for that person and assign only the needed application roles. Authentik administration is at the identity link on page 4. CMS publishing and Vendure permissions must also be provisioned in their own systems; a customer or email address alone is not a staff role. Have the technical administrator confirm the group-to-role mappings before onboarding.

### Recovery and protection

Store passwords, recovery codes and ownership details in a password manager. Do not put them in this handbook or send a server .env file to a new employee. Use the recovery process configured for the particular application; do not repeatedly reset unrelated accounts.

### Owner handover check

Before taking over alone, sign in to every system in the directory and verify your actual role. Confirm access to the recovery inbox, hosting billing, domain renewal, monitoring notifications and a technical support contact.

## Monitoring and backups

Know what is healthy and what can actually be recovered.

### Review availability alerts

1. Open UptimeRobot and choose **Monitoring** in the left sidebar. Open the CERA monitor.
2. Check its URL, latest status and recent incidents. Verify that the intended notification contact is attached and confirmed.
3. Use the service’s notification-test control when available and confirm receipt. Then follow the troubleshooting procedure if the website is down.

### Review server backups

1. Open Hetzner Console → the CeraMedical project → **Servers** → **CERA-Production**.
2. Open the server’s **Backups** tab. Confirm backups are enabled and that recent successful backup entries exist.
3. Keep a record of the latest backup date. Arrange a recovery exercise with the technical administrator using a separate safe target; do not restore over the live server as a test.

### What still needs confirmation

You reported enabling Hetzner backups. This guide does not independently verify the current backup history. A server backup is different from an application-consistent database export; ask the technical administrator to confirm database, local media and secret/configuration recovery.

### When to escalate

Escalate missing backups, persistent delivery failures, full-disk alerts, repeated login errors or unexplained catalogue changes. Server restarts, restores, DNS changes and container upgrades belong in a planned technical intervention, not ordinary content editing.

## When something goes wrong

Record the symptom, check once, then escalate with useful evidence.

### Symptom → first action

- **New content is not visible:** Check published status, the correct record and slug. Reload the public URL. Do not create a duplicate.
- **Service publish is rejected:** Match its CMS slug to an enabled Vendure service. Check catalogue availability.
- **Product appears in the wrong list:** Review collection membership: service collection versus Physical Products & Reagents.
- **Customer is sent to staff sign-in:** Record the starting URL, final URL and account type. Retest in a private window; do not grant staff roles as a workaround.
- **No email or CRM record:** Inspect Integration deliveries and the provider error. Check the destination before retrying.
- **Cannot complete checkout:** Confirm customer sign-in, verified email, eligible item, PKR currency and available shipping/payment method.
- **Public site is down:** Check the monitor and whether other pages fail. Contact technical support; do not change DNS at random.

### Send a useful support report

1. Record the date/time, affected URL, system and record/order reference.
2. Write what you clicked, what you expected and what actually happened. Include the exact visible error.
3. Attach a screenshot with passwords, customer identifiers and tokens hidden. Mention whether one user or all users are affected.

### Do not multiply the problem

Avoid repeated checkout submissions, repeated integration retries and repeated deletion/recreation of records. Preserve the reference and evidence so the underlying fault can be traced.

## Your handover checklist

Complete these together before the technical handover is closed.

### Readiness check

- **Access:** Habab can sign in to staff, CMS, Vendure, CRM and required provider accounts.
- **Content:** Edit a draft, preview it, publish an agreed small change and verify the public result.
- **Services:** Locate the Vendure service and its matching CMS presentation.
- **Enquiries:** Open a request, assign it, add an internal note and identify the reply channel.
- **Orders:** Locate an order and distinguish order, payment and fulfilment records.
- **Recovery:** Password-manager ownership, recovery inbox and support contact are recorded.
- **Backups:** Recent backup history and recovery responsibilities are confirmed.
- **Alerts:** A test notification reaches the person responsible.
- **Storage:** Local media backup coverage is documented; R2 migration remains a separate task.

### A few terms you will see

**CMS:** website content editor. **Slug:** the readable identifier used in a URL. **Variant:** a purchasable version of a product. **SKU:** its stock identifier. **Draft:** unpublished work. **Publish:** make approved content publicly available. **Integration delivery:** a background email/CRM job. **Fulfilment:** handling the customer’s order.

### The operating rule

Make one deliberate change, save it, and verify the result where the customer sees it. Keep content work in the CMS, catalogue/order work in Vendure and infrastructure changes with the technical administrator.

## Bulk uploads and galleries

CMS → Content → Media. Available in the production release.

### Upload a batch once

1. In the CMS left sidebar, open Content → Media. Use the upload control and select several image files, or drop the files into the upload area.
2. Review each image and complete its required Alt text. Save the uploads. Use names that identify the subject; never upload confidential participant information.
3. Open Content → Posts for a research article, or Content → Service presentations for a service. Open the record to edit.
4. Find Image gallery. Select the uploaded images. You can select multiple images and drag the selected entries to change their order. Add a Gallery heading if needed.
5. Save the draft, preview, then publish. Open the public article or service detail page and scroll to its gallery.

### CHECK RESULT

Check every image, its text and its order on desktop and mobile. Click an image to open its full-size file. Removing an image from a gallery does not delete it from Media or from other pages.

### Limits and ownership

Each gallery accepts up to 40 images. Media accepts PNG, JPEG, WebP and AVIF files, with a 10 MB per-file limit. Uploads use the configured storage, including local server storage while R2 is deferred. Keep original images separately.

## Manage the About page and team

CMS → Content → Pages → about. Available in the production release.

### Edit the organisation and its people

1. Open Pages in the CMS left sidebar and select the About record with slug about.
2. Edit Title, Excerpt, Body and Layout for the organisation information. These fields now drive the public About page.
3. Find Team heading and Team introduction. Write the heading and short introduction for the people section.
4. Under Team members, add a row. Enter Name and Role. Select or upload a Photo and add the Biography.
5. In that member’s Links area, add a label such as LinkedIn, ORCID or University profile, plus its full HTTPS URL. Add additional links as needed.
6. Add more members or drag rows to change their display order. To remove a person from the page, remove that row; their Media file is not automatically deleted.
7. Save a draft, preview, then publish. Open /about and check the team section and each profile link.

### CHECK RESULT

Verify names, roles, biographies, photo crops and link destinations. Empty team lists are hidden. Up to 60 members and eight links per member are supported. Add only approved real staff information; sample data is not a finished company profile.

## Account credentials and recovery

A private access register for Habab to complete in the company password manager.

### Application access

- **Staff portal:** https://www.ceramedical.org/staff · Habab’s named staff identity; Authentik sign-in and staff role required.
- **Payload CMS:** https://admin.ceramedical.org/admin · CMS administrator. Initial values: CMS_BOOTSTRAP_ADMIN_EMAIL / CMS_BOOTSTRAP_ADMIN_PASSWORD.
- **Vendure:** https://catalogue.ceramedical.org/dashboard · catalogue/order administrator. Initial values: SUPERADMIN_USERNAME / SUPERADMIN_PASSWORD.
- **Authentik:** https://auth.ceramedical.org/if/admin/ · identity administrator. Initial values: AUTHENTIK_BOOTSTRAP_EMAIL / AUTHENTIK_BOOTSTRAP_PASSWORD.
- **ERPNext CRM:** https://crm.ceramedical.org · provisioned administrator; initial password may be /opt/frappe_docker/.admin-initial on VPS.
- **Cloudflare, Resend, Hetzner, UptimeRobot:** Use owner login and recovery stored in the company password manager. API tokens are integration credentials.

### Provision and protect access

Have the technical administrator create Habab’s named staff, CMS, Vendure and CRM accounts, then transfer current credentials directly into the company password manager. Production config is /opt/cera/.env; the protected VPS helper is /opt/cera/infra/scripts/export-operator-credentials.sh. Bootstrap values may be stale after password changes. Change temporary passwords at first sign-in and record each account’s URL, recovery method and owner. Do not share Saad’s personal login or a generic root account.

### Keep secrets out of this PDF

This handbook contains no live passwords, API tokens, database credentials, OIDC secrets or signing keys. Never commit or email the export-helper output, .env file or recovery codes.
