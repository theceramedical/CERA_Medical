# Production checkout (cart / pay)

After [ADR-011](../../.planning/adr/ADR-011-checkout-enablement.md):

## Host `/opt/cera/.env`

```bash
sudo bash /opt/cera/infra/scripts/ensure-production-checkout-env.sh /opt/cera/.env
```

Then set **`STRIPE_SECRET_KEY`** (live key) on the host. Local/dev uses `cera-test-payment` when `STRIPE_SECRET_KEY` is empty and `CERA_ENV=production` is not paired with Stripe — production commerce uses Stripe when the key is set.

Required variables:

| Variable                       | Production value   |
| ------------------------------ | ------------------ |
| `CHECKOUT_ENABLED`             | `true`             |
| `NEXT_PUBLIC_CHECKOUT_ENABLED` | `true`             |
| `STRIPE_SECRET_KEY`            | Stripe live secret |

GitHub **production** environment variable (for web image build):

| Variable                      | Value  |
| ----------------------------- | ------ |
| `PRODUCTION_CHECKOUT_ENABLED` | `true` |

## Release

1. Merge to `main`.
2. Repository owner runs **Release to production** workflow (`release.yml`).
3. Deploy re-seeds catalogue when `CERA_ALLOW_PRODUCTION_CATALOGUE_SEED=approved` and `CHECKOUT_ENABLED=true` (shipping + payment methods + list prices).

Verify: `/cart`, add a service, complete checkout (Stripe or test handler per env).
