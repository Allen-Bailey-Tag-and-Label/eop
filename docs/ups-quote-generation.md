# UPS quote generation

The UPS estimator uses SvelteKit remote commands instead of a page form action.
`createUpsQuote` validates the submitted values, reserves a number from the
existing shared quote sequence, saves a pending `UpsQuote`, and returns its
number. The browser navigates to `/ups/quote/[quote]` immediately afterward.
No UPS address-validation, authentication, or rating request runs before that
navigation. The initial request still needs the database round trip to reserve
and save a durable quote number.

The detail page shows the saved request immediately and calls `advanceUpsQuote`:

1. Validate the address if requested, then save the normalized destination.
2. Retrieve rates using that destination, then save and display the prices.

Each step is an awaited server request. There is no detached background task
that could be lost when a serverless invocation returns. Closing the page can
leave the next step pending; reopening the URL resumes it. Historical quotes
without `generation` metadata are treated as complete and never regenerated.

Progress and failures are persisted in `generation`. Retry continues the same
quote at the failed step; successful validation is retained if only rates fail.
Each UPS step has a 25-second timeout, including OAuth. A 60-second database lease
prevents concurrent tabs from repeating the active step and allows recovery if
an invocation is interrupted. Attempt IDs prevent an expired invocation from
overwriting the newer attempt's result.

Creation uses a sparse unique `requestKey` index scoped to the employee and a
browser-generated request ID, so retrying a submission after a lost response
does not create another quote. The new fields are optional for historical rows;
no backfill is required. Mongoose initializes the index before accepting new
pending quotes. Operational fields are excluded from the quote finder and from
the detail response.

Remote command permissions are registered centrally in `hooks.server.ts` against
the `/ups/quote` route. Originating page headers are untrusted, and unregistered
remote commands are denied. Register future remote commands there explicitly.

The `/shipping/quote` implementation is unchanged.

## Addresses and package weights

The Shipment Details section can swap the complete Ship From and Ship To
addresses. Package Info offers three modes:

- **Total weight:** enter package count and combined weight. The estimate divides
  that weight evenly and rounds each package upward to the nearest 0.001 lb.
- **Per package:** enter package count and the weight shared by every package.
- **Different weights:** add quantity/weight groups, such as 1 package at 10 lbs
  and 1 package at 20 lbs. Totals are calculated from the groups.

Quotes support up to 50 packages, each weighing 0.001–150 lbs. Counts and weights
are checked on the server before a number is allocated. New quotes save optional
`weightMode` and `packageGroups` fields; existing records need no backfill.

New rate requests send one UPS Package entry for every actual package. The
returned shipment total is used once, rather than multiplied by package count.
An older pending quote without package groups retains the original average-weight
estimate behavior. Completed historical prices are never recalculated.

Quote details show the saved package groups. Duplicate loads the saved quote by
number and restores both addresses, the validation choice, and the weight mode
and groups, including after addresses have been swapped.

To verify manually, request a quote with validation enabled and watch the URL
change before UPS completes. Confirm the validation indicator completes before
the rates indicator, then compare returned prices with the prior estimator.
Repeat with validation disabled, refresh while a step is running, and open the
same pending quote in two tabs. A failed step should offer Retry without changing
the quote number. Also open an older completed quote to confirm it stays readable.
