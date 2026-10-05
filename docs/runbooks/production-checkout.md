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

Every completed order is stored with the customer’s **subject id** and appears under **Your account → Orders** (`GET /v1/me/orders`).

## ERPNext (CRM)

Each completed checkout writes a `commerce_orders` row and enqueues `erpnext.order.upsert` on the app outbox. The worker upserts an ERPNext **Lead** (same adapter as enquiries) with `custom_cera_reference` = Vendure order code and a description of lines and payment method. Staff can review leads on `crm.ceramedical.org`; Vendure remains the fulfilment source of truth.

## Smoke test

Verify: `/cart`, add a service, checkout with COD or Safepay (per env), then sign in and open `/account/orders`.
