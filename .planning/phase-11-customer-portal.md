# Phase 11 - Customer portal

**PRD mapping:** CUS-601, CUS-602
**Depends on:** Phases 08, 09
**PRD acceptance:**

| ID      | Acceptance statement                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| CUS-601 | One account cannot claim another email address's enquiry; expired or reused claim tokens fail safely.       |
| CUS-602 | A customer sees only their own records; empty, loading, expired-session, and API-failure states are tested. |

## Objective

Let a verified customer follow their own enquiries and nothing else. Claiming is the sharp edge: it
links a pre-account enquiry to an identity, so a weakness here exposes one person's enquiry to
another.

## Work packages

### WP-11.1 Claim flow

- [ ] `POST /v1/enquiries/claim/request` - for an authenticated customer with a verified email, find
      enquiries whose `emailHash` matches their verified address, issue a single-use token per enquiry
      with a 30-minute expiry, and email it through the outbox
- [ ] Only the **hash** of the token is stored; the token itself exists only in the email
- [ ] Only the **hash** of the email is stored on the token record, so the table is not a second copy of
      the address list
- [ ] `POST /v1/enquiries/claim/consume` - verify the token hash, verify not expired, verify not
      consumed, and verify that the **authenticated subject's verified email hash equals the token's
      `emailHash`**. That final check is what makes CUS-601 true: possession of a token is not
      sufficient.
- [ ] Consumption is a single transaction setting `consumedAt`, `consumedBySubjectId`, and the enquiry's
      `customerSubjectId`, with a conditional update so a concurrent double-consume yields one winner
- [ ] Unknown, expired, consumed, and mismatched tokens all return the **same generic failure**, so the
      endpoint cannot be used to probe which references exist
- [ ] Rate limited per subject and per token
- [ ] Every attempt, successful or not, writes an audit event
- [ ] An already-claimed enquiry cannot be re-claimed by anyone

### WP-11.2 Customer API

- [ ] `GET /v1/me/profile` and `PATCH /v1/me/profile`, the latter accepting only `displayName` and
      `phone`. Email changes go through Authentik, because email is the key governing claiming.
- [ ] `GET /v1/me/enquiries` - the customer projection, filtered by `customerSubjectId` **in the SQL
      `WHERE` clause**, cursor-paginated with a server-enforced limit
- [ ] `GET /v1/me/enquiries/:reference` - detail with the timeline, returning `not_found` for a reference
      the caller does not own so the API is not an existence oracle
- [ ] Timeline built from status events mapped through `toCustomerStatus()` with consecutive duplicates
      collapsed, so two internal moves that map to one customer status appear once
- [ ] Every response built by `toCustomerEnquiry()` - no route serialises an enquiry row directly

### WP-11.3 Dashboard

- [ ] `/account` - profile summary and enquiry list
- [ ] `/account/enquiries` - list with status badges and last-updated
- [ ] `/account/enquiries/[reference]` - detail with the timeline as an ordered list of accessible
      datetimes
- [ ] `/account/profile` - editable name and phone, with the email shown read-only and an explanation of
      where to change it
- [ ] `/account/claim` - entry point for claiming, with clear instructions and a plain explanation when
      there is nothing to claim
- [ ] Server Components for data, Server Actions for mutation; no customer data fetched client-side

### WP-11.4 The four required states

CUS-602 names these explicitly, so each is built and tested rather than assumed.

- [ ] **Empty** - no enquiries yet, with an explanation and a link to browse services
- [ ] **Loading** - skeletons matching the loaded layout's dimensions so nothing shifts
- [ ] **Expired session** - a warning before idle expiry, then an expired state that preserves context
      and returns the user to where they were after re-authentication
- [ ] **API failure** - a real error state with retry, distinguishing retryable from not, that never
      shows a stack trace or a raw provider message

### WP-11.5 Tests

- [ ] Unit: claim eligibility, token hashing, expiry arithmetic, timeline collapsing
- [ ] Integration: customer A cannot claim customer B's enquiry even holding a valid token for it; an
      expired token fails; a consumed token fails; a concurrent double-consume yields one winner
- [ ] Integration: `/v1/me/*` returns only the caller's records, attempted by ID, by reference, by list,
      and by manipulated cursor
- [ ] **Leak test**: a customer response for an enquiry with notes, an owner, an internal status, and a
      transition reason contains none of them
- [ ] E2E: sign in, claim, view the list, open a detail, view the timeline, update the profile, sign out
- [ ] E2E: each of the four states, including a forced API failure and a forced session expiry
- [ ] axe on every account route

## Verification

```bash
pnpm --filter api test -- --grep "claim|me"
pnpm test:integration -- --grep "customer"
pnpm test:e2e -- --grep "account"
pnpm test:a11y -- --grep "account"
```

## Exit gate

- [ ] CUS-601: one account cannot claim another email address's enquiry, proven with a valid token
      belonging to a different address; expired and reused tokens fail safely and indistinguishably
- [ ] CUS-602: a customer sees only their own records; empty, loading, expired-session, and API-failure
      states are all implemented and tested
- [ ] No customer response contains an internal note, internal status, owner identity, or CRM field
- [ ] Ownership filters applied in SQL, verified by inspecting generated queries
- [ ] Unverified email cannot claim
- [ ] axe reports zero violations on every account route
