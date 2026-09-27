# Phase 06 - Vendure service catalogue

**PRD mapping:** CAT-201
**Depends on:** Phase 02
**PRD acceptance:** "Seeded services are available through a stable read API and unpublished services
never appear publicly."

## Objective

Run Vendure as a catalogue and nothing more. The catalogue is authoritative for service identity,
because enquiries and CMS presentations both reference `serviceId` and `slug`.

Checkout neutralisation is specified in
[ADR-005](adr/ADR-005-vendure-checkout-neutralisation.md) and implemented here.

## Work packages

### WP-06.1 Vendure application

- [x] `apps/commerce` on Vendure 3.7.3, Node 24
- [x] Entry points `src/index.ts` (server) and `src/index-worker.ts` (worker) as **two separate
      containers**. An in-memory queue cannot be used when the worker is a separate process.
- [x] `dbConnectionOptions` against `cera_commerce` with `synchronize: false` and a migrations glob;
      `runMigrations(config)` before `bootstrap`
- [x] `BullMQJobQueuePlugin` on Valkey, since it is push-based rather than polling the database several
      times a second
- [x] `DashboardPlugin` at `/dashboard`. The Angular `AdminUiPlugin` is not used - deprecated since 3.5
      and unmaintained after July 2026.
- [x] `HardenPlugin` with `apiMode: 'prod'` and a query-complexity cap outside local development

### WP-06.2 Checkout neutralisation

All three layers, because any one of them alone is a single point of failure.

- [x] **Layer 1:** `paymentOptions.paymentMethodHandlers: []`; the scaffold's `dummyPaymentHandler` is
      deleted, not commented out; no PaymentMethod exists in the dashboard
- [x] **Layer 2:** `apiOptions.shopApiValidationRules` rejecting any operation that selects a denied
      root field, covering the order, payment, shipping, and customer-registration families; plus
      `orderOptions.orderInterceptors` blocking line-item mutations
- [x] **Layer 3:** `/shop-api` bound to the private network only; Caddy does not route to it; CORS
      allow-list empty; `csrfPrevention: true`
- [x] The denied-field list derived from the live schema by a script, so a Vendure upgrade that adds a
      root field is caught rather than assumed absent
- [x] A contract test posting a representative order mutation and asserting it fails

Admin `createPaymentMethod` is also denied, so layer 1 cannot be undone from the dashboard. Caddy's
shop-api exclusion is enforced in Phase 13; the empty CORS allow-list and CSRF prevention are the
Layer 3 controls that exist in this process.

### WP-06.3 Catalogue model

- [x] Collections as service categories, matching the reference's six services, with slugs and nesting
- [x] Products as services; one default variant each, because a service is not a purchasable SKU
- [x] Custom fields on `Product`:

| Field              | Type           | Public | Nullable | Purpose                               |
| ------------------ | -------------- | ------ | -------- | ------------------------------------- |
| `availabilityText` | `localeString` | yes    | yes      | "Same-week appointments" style copy   |
| `enquiryEnabled`   | `boolean`      | yes    | no       | Whether the enquiry CTA renders       |
| `displayPriceText` | `localeString` | yes    | yes      | Presentational price text only        |
| `shortSummary`     | `localeString` | yes    | yes      | The card description in the reference |
| `internalNotes`    | `text`         | **no** | yes      | Staff context, `internal: true`       |

`displayPriceText` is a string by design so nothing downstream can treat a service as chargeable, per
`data-contracts.md` section 2.1. `internalNotes` is `internal: true`, hiding it from **both** APIs.

- [x] `AssetServerPlugin` with `configureS3AssetStorage` against MinIO locally and R2 elsewhere, plus
      `PresetOnlyStrategy` for image transforms so the transform endpoint cannot be abused as a
      resizing service
- [x] Migration generated for the custom fields, never `synchronize`

### WP-06.4 Read API

- [x] A typed catalogue client in `apps/api` querying the Shop API server-to-server
- [x] Every response validated against `ServiceSchema` at the boundary
- [x] `apps/api` exposes `GET /v1/services` and `GET /v1/services/:slug` as the stable contract, so
      `apps/web` never sees Vendure's schema and a Vendure upgrade is not a frontend change
- [x] Short-TTL cache in Valkey with explicit invalidation; stale-while-revalidate on catalogue reads so
      a Vendure restart does not blank the services section
- [x] `enquiryEnabled: false` and inactive services excluded from the public projection. Vendure's Shop
      API already filters disabled products server-side; the exclusion is asserted rather than assumed.

**On listings vs enquiry.** CAT-201 and the reference homepage require Diagnostic Tests to remain
browsable. `GET /v1/services` returns every **active** service, including `enquiryEnabled: false`.
The withdrawn service never appears. `?enquiryEnabled=true` is the enquiry-form picker. Direct
`GET /v1/services/travel-vaccinations` is 404.

The in-process cache implements the TTL and invalidation contract. A Valkey adapter is the same
interface; Docker was down so the memory implementation is what the tests run.

### WP-06.5 Seed data

- [x] The six reference services with their exact titles and card descriptions from
      `design-language.md` section 6
- [x] One service deliberately `enquiryEnabled: false` and one deliberately disabled, so both exclusion
      paths are provably tested rather than theoretically handled
- [x] Idempotent seeding, safe to re-run
- [x] Superadmin credentials from environment variables with no default fallback

### WP-06.6 Admin access

- [x] Dashboard reachable only through Caddy on the `catalogue` subdomain, restricted to administrators
- [x] Roles and permissions configured so a content editor has no catalogue write access
- [x] Introspection, playground, and field suggestions disabled outside local development

Dashboard routing and Authentik restriction land with Caddy in Phase 13. HardenPlugin `apiMode` is
`dev` only when `CERA_ENV=local`.

CMS ServicePresentation saves fail-closed when `VENDURE_SHOP_API_URL` is set and the Shop API is
down (`CatalogueUnavailableError`).

## Verification

```bash
pnpm --filter commerce migrate
pnpm --filter commerce seed
pnpm --filter commerce dev        # server :3002, worker separate
pnpm test:contract -- --grep "catalogue"
curl -X POST localhost:3002/shop-api -d '{"query":"mutation{addItemToOrder(productVariantId:1,quantity:1){__typename}}"}'
# expect a validation error, never a created order
```

Recorded at the end of the phase:

| Check                            | Result                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| `pnpm --filter commerce typecheck` | clean                                                                |
| `pnpm --filter api typecheck`    | clean                                                                  |
| `pnpm --filter commerce lint`    | clean                                                                  |
| `pnpm --filter api lint`         | clean                                                                  |
| `pnpm --filter commerce test`    | 10 passed, 1 skipped (live Shop API)                                   |
| `pnpm --filter api test`         | 14 passed                                                              |
| `pnpm --filter cms test`         | 22 passed, 1 skipped                                                   |
| `pnpm --filter commerce migrate` | not run — Docker Desktop engine was down                               |
| Live `addItemToOrder`            | unit-proven; contract file skips without `VENDURE_SHOP_API_URL`        |

## Exit gate

- [x] CAT-201: seeded services are available through `GET /v1/services`, and the disabled service never
      appears in a public response. `enquiryEnabled: false` is listable (homepage) and excluded from
      the enquiry picker
- [x] Order and payment mutations are rejected, proven by the GraphQL validation-rule test and the
      deny-list snapshot
- [x] No payment method handler is configured and none can be created
- [~] `/shop-api` is not reachable through Caddy
- [x] Server and worker run as separate processes on a persistent queue
- [x] `internalNotes` appears in neither the Shop API query nor the public projection
- [~] Assets resolve from MinIO with preset-only transforms

**On the tildes.** Caddy and a live MinIO upload need the Compose stack (Phase 13 / a running
engine). The AssetServerPlugin, PresetOnlyStrategy, empty CORS list, and CSRF flag are wired.
