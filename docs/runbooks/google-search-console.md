# Google Search Console

## What ships in the web app

| Asset                | URL                | Notes                                                                                                 |
| -------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `robots.txt`         | `/robots.txt`      | Generated from `apps/web/src/app/robots.ts`; blocks account, staff, auth, search, cart, checkout, API |
| `sitemap.xml`        | `/sitemap.xml`     | Published CMS pages, services, articles, products (`/products/{sku}`), policies                       |
| HTML sitemap         | `/sitemap`         | Human-readable index with the same discoverable routes                                                |
| Canonical URLs       | every public page  | `metadataBase` + per-route `pageMetadata()`                                                           |
| Open Graph / Twitter | default + per page | Set `GOOGLE_SITE_VERIFICATION` for ownership                                                          |

Production must set `NEXT_PUBLIC_SITE_URL=https://www.ceramedical.org` so canonicals, `robots.txt` `Sitemap:`, and OG URLs are absolute.

## Verify ownership

1. In [Google Search Console](https://search.google.com/search-console), add property **URL prefix** `https://www.ceramedical.org`.
2. Choose **HTML tag** verification.
3. Set on the server (in `/opt/cera/.env` for web):

   ```bash
   GOOGLE_SITE_VERIFICATION=your-token-from-google
   ```

4. Redeploy **web**, then confirm verification in Search Console.

## Submit the sitemap

1. Sitemaps → Add sitemap: `https://www.ceramedical.org/sitemap.xml`
2. After deploy, confirm indexed URLs include `/services/*`, `/articles/*`, and `/products/*`.

## Optional: Bing

Add `BING_SITE_VERIFICATION` only if you extend `apps/web/src/lib/seo-site.ts` with Bing metadata (not configured by default).
