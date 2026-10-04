# ADR-011: Checkout enabled via API BFF (supersedes ADR-005)

**Status:** Accepted  
**Date:** 2026-10-04  
**Supersedes:** [ADR-005](ADR-005-vendure-checkout-neutralisation.md) when `CHECKOUT_ENABLED=true`

## Context

CERA approved transactional checkout for this release: fixed-price service SKUs, cart, payment, and customer order history. ADR-005 neutralised Vendure checkout in three layers; that remains the default when checkout is off.

## Decision

1. **`CHECKOUT_ENABLED`** (commerce + api + `NEXT_PUBLIC_CHECKOUT_ENABLED` on web) gates all checkout behaviour. Default `false` until environment is configured.
2. When enabled, commerce removes shop deny-rules and order interceptors and registers payment handlers:
   - **Cash on delivery:** `cera-cod` (authorized until collected).
   - **Online:** `cera-safepay` when Safepay credentials are set.
   - **Local / test:** `cera-test-payment` when not in production and Safepay is unset.
3. **Shop API stays server-side only.** `apps/api` exposes `/v1/cart` and `/v1/checkout`; browsers never call `/shop-api`.
4. **Guest carts** use a HttpOnly `cera_vendure_token` cookie issued by the API after the first Vendure mutation.
5. **Enquiry flow remains** for scoping; all catalogue services are also purchasable at seeded list prices when checkout is on.

## Consequences

- Contract tests for mutation rejection run only when `CHECKOUT_ENABLED` is not true.
- `PublicService` may include `checkoutEnabled` and formatted list price; charge amounts come from Vendure variant prices at checkout time.
- PCI scope: Safepay hosted checkout for online pay; COD is offline collection. Local MVP uses `cera-test-payment`.
