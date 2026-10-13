# Production checkout

Checkout is gated by `CHECKOUT_ENABLED` / `NEXT_PUBLIC_CHECKOUT_ENABLED`. The release workflow runs `infra/scripts/ensure-production-checkout-env.sh` on deploy to flip those flags and add Safepay placeholders.

## Payments

| Method           | Handler             | When                                                       |
| ---------------- | ------------------- | ---------------------------------------------------------- |
| Safepay (hosted) | `cera-safepay`      | `SAFEPAY_MERCHANT_SECRET` + `SAFEPAY_MERCHANT_API_KEY` set |
| Cash on delivery | `cera-cod`          | Always when checkout is enabled                            |
| Test settlement  | `cera-test-payment` | Non-production only                                        |

Set on the host (`/opt/cera/.env`):

| Variable                   | Purpose                                      |
| -------------------------- | -------------------------------------------- |
| `SAFEPAY_MERCHANT_SECRET`  | Server-side Safepay API auth                 |
| `SAFEPAY_MERCHANT_API_KEY` | Public merchant API key for payment sessions |
| `SAFEPAY_ENVIRONMENT`      | `production` or `sandbox`                    |

Local/dev uses `cera-test-payment` when Safepay is not configured.

## Customer account required

Checkout (`/checkout`) requires a **signed-in customer** with a **verified email** (Google or email via Authentik). Guests cannot complete payment; the cart stays cookie-based until they sign in.

The website posts checkout to its own `/api/checkout/*` route. This route forwards the sealed, host-only customer session to the API on the server; a browser request to `api.ceramedical.org` cannot carry the `__Host-cera_session` cookie set by `www.ceramedical.org`.

Customers must enter their phone number, street address, city, province, and postal code. The API validates these fields and passes them to Vendure as the order shipping address. Do not substitute CERA's laboratory address for the customer address. Vendure product variants need stock on hand above their out-of-stock threshold before checkout can succeed; the threshold itself does not add stock.

Every completed order is stored with the customer’s **subject id** and appears under **Your account → Orders** (`GET /v1/me/orders`).

## ERPNext (CRM)

Each completed checkout writes a `commerce_orders` row and enqueues `erpnext.order.upsert` on the app outbox. The worker upserts an ERPNext **Lead** (same adapter as enquiries) with `custom_cera_reference` = Vendure order code and a description of lines and payment method. Staff can review leads on `crm.ceramedical.org`; Vendure remains the fulfilment source of truth.

## Smoke test

Verify: `/cart`, add an approved in-stock product, enter a real delivery address, checkout with COD or Safepay (per env), then open `/account/orders` and confirm the delivery details in Vendure.
