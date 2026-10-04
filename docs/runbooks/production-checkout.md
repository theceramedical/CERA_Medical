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

## Smoke test

Verify: `/cart`, add a service, checkout with COD or Safepay (per env).
