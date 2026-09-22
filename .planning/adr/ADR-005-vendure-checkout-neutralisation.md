# ADR-005: Vendure checkout neutralised in three layers

**Status:** Accepted
**Date:** 2026-09-21

## Context

PRD 3.1 requires Vendure as the service catalogue with "transactional checkout remains disabled", and
PRD 3.2 excludes payments, refunds, checkout, invoicing, subscriptions, stored payment data, and
financial reconciliation. PRD 7 repeats: "do not expose checkout in this release."

Vendure is an e-commerce framework. Verified against its 3.7 documentation, **there is no supported
configuration switch that removes order and payment mutations from the Shop API schema.**
`addItemToOrder`, `setOrderShippingAddress`, `transitionOrderToState`, and `addPaymentToOrder` exist
in the schema whenever the Shop API is served.

For a medical platform this is not a cosmetic concern. A reachable order mutation is an unapproved
data-collection path and a regulatory question CERA has not answered.

## Decision

Neutralise checkout in three independent layers, so no single misconfiguration re-opens it.

**Layer 1 - nothing to pay with.** `paymentOptions.paymentMethodHandlers: []`. The scaffold's
`dummyPaymentHandler` is deleted, not commented out. No PaymentMethod is created in the dashboard.
An order cannot transition to a paid state because no handler can settle it.

**Layer 2 - the mutations are rejected.** `apiOptions.shopApiValidationRules` carries a rule that
rejects any operation selecting a denied root field, returning a generic validation error. The denied
list covers the order, payment, shipping, and customer-registration mutation families. Because it is
a GraphQL validation rule, it runs before resolution and cannot be bypassed by aliasing or
fragments. `orderOptions.orderInterceptors` additionally blocks line-item mutations as a second stop.

**Layer 3 - the API is unreachable from a browser.** `/shop-api` is bound to the private Docker
network. Only `apps/api` calls it, server to server. Caddy does not route to it. CORS is an empty
allow-list and `csrfPrevention` stays on, so even a routing mistake does not yield a usable
browser-reachable endpoint.

Supporting measures: `HardenPlugin` with `apiMode: 'prod'` disables introspection, the playground,
and field suggestions in staging and production, and caps query complexity. The React `DashboardPlugin`
at `/dashboard` is restricted to administrators; the Angular `AdminUiPlugin` is not used as it is
deprecated and unmaintained after July 2026.

A contract test asserts, against a running Vendure, that a representative order mutation posted to
`/shop-api` fails. It is part of the required suite, so re-enabling checkout by accident breaks the
build.

## Consequences

- Checkout is off by configuration, by validation, and by network reachability. Losing any one layer
  still leaves two.
- Vendure remains a heavier dependency than a catalogue needs. Accepted because the PRD fixes it as
  the catalogue and admin surface, and it supplies collections, slugs, channels, assets, and an admin
  UI that would otherwise be built.
- `Service.displayPrice` is a **string** in the contract, deliberately. Nothing downstream can treat
  a service as a chargeable line item.
- The denied-field list is a maintenance item: a Vendure minor upgrade could add a root field. Phase
  14's upgrade checklist includes re-deriving the list from the live schema.

## Alternatives considered

**Replace Vendure with catalogue tables in `cera_app`.** Simpler and smaller. Rejected: PRD 3.1 and
PRD 7 name Vendure as the catalogue and admin interface, and CAT-201's acceptance is written against
it. Changing it is a scope change requiring CERA approval.

**Serve only the Admin API and no Shop API.** Rejected: the Admin API is a larger surface with more
privileged mutations, so it is a worse thing to expose. Reading the catalogue through the narrower
Shop API from a trusted server is the safer direction.

**Rely only on not calling the mutations.** Rejected. "We do not call it" is not a control. The PRD's
own standard is that UI hiding is never authorisation, and the same logic applies to a schema.
