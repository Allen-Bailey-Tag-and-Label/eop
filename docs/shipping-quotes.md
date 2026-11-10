# Shipping quotes

## Routes and access

- `/shipping/quote`: choose UPS, LTL, or Both. Required fields follow the selection.
- `/shipping/quote-finder`: the same MongooseTable layout, saved filters, sorting,
  column settings, and footer pagination as `/ups/quote-finder`. Includes new and
  legacy UPS quotes. `/shipping/quotes` redirects here for existing bookmarks.
- `/shipping/quotes/[number]`: original shipment, provider status, and saved pricing.
- `/admin/shipping/markups`: separate UPS and LTL cost-range rules with create/edit/delete dialogs.

Register `/shipping/quote`, `/shipping/quote-finder`, `/shipping/quotes`, and `/admin/shipping/markups` in
Admin → Routes and assign them to the appropriate roles in Admin → Roles. Existing
`/shipping` or `/admin` grants already cover their respective descendants. Access
continues to be enforced centrally by `src/hooks.server.ts`; no route bypasses or
additional permission checks are introduced. Existing UPS routes remain intact.

## Pricing

`ShippingMarkup` stores one revisioned configuration for UPS and one for LTL.
Each range has a label, inclusive minimum freight cost, exclusive maximum (or no
upper bound), and markup percentage. Ranges for a service cannot overlap.
Concurrent edits use optimistic concurrency checks against the configuration
revision. Unconfigured services and gaps use 0%, as requested. No seed data is
required. Markup is applied to the provider's full USD shipment charge:

`customer price = carrier cost + round(carrier cost × percentage / 100)`

Money is stored in cents; percentages are stored in hundredths of a percent.
Every new quote stores its cost, applied rule/revision/percentage, markup amount,
and final customer price. Changing or deleting rules never recalculates old quotes.
These rules apply to the new shipping workflow; legacy `/ups/quote` calculations
retain their existing behavior.

## UPS and Unishippers

UPS uses the existing server-side OAuth credentials, with the current Rating
API's multi-package request format, each package's dimensions and weight, ship
date, and residential indicators. Identical-package groups expand into individual
packages, with a 200-package limit. Credentials never reach the browser. Set
optional server-only `UPS_SHIPPER_NUMBER` to request account-negotiated rates;
without it the quote shows published rates. The response's negotiated total is
preferred when returned, and the rate basis is saved and displayed. Calls have
a 25-second timeout. This first version supports domestic US shipments in USD.

LTL collects handling-unit dimensions/weights, freight class, commodity, optional
NMFC, stackability, residential addresses, and pickup/delivery services. It does
not estimate freight class or pallet configuration. **Live Unishippers rating is
not connected:** API documentation and credentials are still required. The form
and saved quote explicitly state this; no placeholder LTL prices are shown. Both
can return UPS rates while recording the unavailable LTL status. Failed providers
do not remove successful rates. Rating never books a shipment.

## Legacy compatibility and persistence

Existing `UpsQuote` documents are not patched or renamed. The history repository
unions their summaries with `ShippingQuote`, and numeric quote URLs read their
original collection through a compatibility adapter. Null/missing service entries
are skipped; historical customer prices are preserved. Carrier costs and markups
are unknown for legacy records and are shown as unavailable, never inferred.

New quotes use `S-000001` style numbers from an atomic MongoDB counter, avoiding
collisions with numeric legacy UPS quotes. Submissions have per-user idempotency
keys to avoid duplicate saved records when retried. Number gaps can occur on
failed writes. The new collections and indexes are created through the existing
Mongoose model lifecycle; no destructive migration is required.

The finder normalizes both collections before applying the shared table's saved
filters and sorting; counts and pagination cover the combined filtered results.
Branch and creator sorting use their display labels. New quote duplication uses
the shipping form; legacy duplication retains the original UPS form and data.
The visible page is just MongooseTable, matching the UPS finder, with no separate
heading, search form, or custom pager. Keep an explicit Route entry for
`/shipping/quote-finder` so its table settings can be saved. Retain `/shipping/quotes`
access for individual quote detail URLs when updating role assignments.

Quote again copies a new quote's shipment into a fresh request with today's ship
date and new request ID; it fetches current rates and current markup rules. Provider
failures and LTL-not-configured attempts are saved for review, even if no rates
were returned. Only the existing UPS quote screen creates legacy UPS records.

## Verification before rollout

1. Assign the new routes using the existing Roles/Routes administration.
2. Add adjacent UPS ranges and verify the shared boundary selects only the upper range.
3. Verify an overlapping range is rejected, including competing edits in two tabs.
4. Quote UPS with one and several package groups; verify quantity, dimensions,
   negotiated/published basis, markup, and rounding against a known UPS example.
5. Select Both and confirm LTL fields become required and UPS prices remain available.
6. Open an existing numeric UPS quote through the new history and original route.
7. Edit a markup rule and confirm the saved quote stays unchanged while Quote again
   uses the updated rule.

API reference: https://github.com/UPS-API/api-documentation/blob/main/Rating.yaml
Unishippers access: https://www.unishippers.com/shipping-technology/api-integrations
