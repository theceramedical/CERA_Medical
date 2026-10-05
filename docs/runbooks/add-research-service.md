# Add a research service (not a product)

Use this when a **new line should appear on `/services`**, not on `/products`.

**Do not** use collection **Physical Products & Reagents** for services — that collection is only for `/products`.

---

## Minimum path (one system)

If you only need the service **live** — listing, detail page, enquiry, checkout, orders — you only touch **Vendure**:

1. **Catalog → Products → Create**
2. Service **collection** (not Physical Products), **slug**, price, enquiry/checkout, variant, **enabled** → save.

Within ~1 minute it can show on `/services` and `/services/{slug}` using the title, summary, and description from Vendure. **No Payload step required.**

Payload is **optional**: use it when you want the long-form marketing page (layout blocks, hero, SEO, card bullets on the grid). Skip it until you care about that polish.

---

## Full path (Vendure + Payload)

| System          | URL                                         | When you need it                  |
| --------------- | ------------------------------------------- | --------------------------------- |
| **Vendure**     | https://catalogue.ceramedical.org/dashboard | Always (catalogue, price, orders) |
| **Payload**     | https://admin.ceramedical.org               | Optional marketing layer          |
| **Public site** | https://www.ceramedical.org/services        | Automatic                         |

---

## Step 1 — Vendure (catalogue record)

1. Sign in to the Vendure dashboard.
2. **Catalog → Products → Create** (Vendure calls everything a “product”; yours is a **research service**).
3. Set **name**, **slug** (lowercase, hyphens only, e.g. `custom-metagenomics`), description, short summary, display price, availability.
4. **Enabled** = on. Set **Enquiry enabled** / **Checkout enabled** as needed.
5. Choose **Simple product**, add a **variant** (SKU + price). Save.

### Put the product in a service collection (Vendure 3 has no picker on the product page)

The dashboard does **not** show “Collections” on the product form. Add the product from the **collection** side:

1. **Catalog → Collections** → open **Laboratory Research** (or Bioinformatics / Evidence and Reporting).
2. Open **Contents** / **Filters** (wording may vary).
3. Use **Manually select products** (or **Filter by product IDs**) → add your new product → save.
4. If the collection already lists other services, use **Change selected products** and include the new one (do not remove existing flagship services unless you mean to).

**Never** add the product to **Physical Products & Reagents** — that collection is only for `/products`.

If you skip collections entirely, the site can still list the row on `/services` as long as it is **not** in Physical Products. Adding a service collection is recommended so cards group under the right research line.

Within about a minute the service can appear on `/services` (live API). Card text is richer after step 2.

---

## Step 2 — Payload (service presentation)

1. **Content → Service presentations → Create**.
2. Use the **same slug** as Vendure (character-for-character).
3. Fill **title**, **excerpt**, **body**, optional **layout** blocks and **card highlights**.
4. **Save draft** while editing (slug does not need to exist in Vendure yet).
5. **Publish** only when Vendure shows that slug as **enabled**. If publish fails on **slug**, create or enable the Vendure record first.

Public URL: `https://www.ceramedical.org/services/{slug}`

---

## Step 3 — Services listing page (optional)

The main **Services** page (`/services`) lists every active Vendure **service** collection item. Payload overrides titles, excerpts, and card bullets when a published presentation exists.

To change the **hero** or intro blocks on `/services` itself, edit **Pages → services** in Payload (not Service presentations).

---

## Quick checks

| Problem                       | Fix                                                               |
| ----------------------------- | ----------------------------------------------------------------- |
| Service not on `/services`    | Vendure: enabled + **service** collection (not physical-products) |
| `/services/{slug}` 404        | Vendure slug missing or disabled                                  |
| Payload publish fails on slug | Match Vendure slug; enable catalogue row                          |
| Shows under `/products`       | Remove from Physical Products collection                          |
