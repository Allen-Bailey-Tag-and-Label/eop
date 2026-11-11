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
addresses. Package Info defaults to just package count and total weight. The
**Advanced** toggle reveals service selections, multiple rate rows, and the case
quantity helper. Advanced configurations open automatically when duplicating a
quote that uses them. Closing Advanced preserves the configured rows and shows a
summary rather than silently replacing them with a basic estimate.

Advanced package entry offers four modes:

- **Total weight:** enter package count and combined weight. The estimate divides
  that weight evenly and rounds each package upward to the nearest 0.001 lb.
- **Per package:** enter package count and the weight shared by every package.
- **Different weights:** add quantity/weight groups, such as 1 package at 10 lbs
  and 1 package at 20 lbs. Totals are calculated from the groups.
- **Cases / units:** enter total units, units per case, and full case gross weight.
  Full cartons and a final partial carton are calculated automatically. The
  partial carton can use the full case weight or prorate the contents while
  retaining the optional empty-carton weight.

The **Build rows from case quantities** helper accepts packing details once and
one total quantity per line (for example, 10,000 / 20,000 / 30,000 on separate
lines). It creates editable rate rows and retains any populated rows already in
the quote. Blank rows are replaced. Draft helper values are not submitted until
the calculated rows are added.

Each quote supports up to 20 rate rows. Each row has its own optional label,
unit quantity, UPS service selections, and packaging input mode. For example,
2,500 units per case at 20 lbs creates 4 / 8 / 12 cartons for the three quantities
above, with total weights of 80 / 160 / 240 lbs. The existing limit of 50 physical
packages applies to each row; larger estimates are rejected rather than silently
split into separate shipments.

Address validation runs once. Rates are then requested in parallel batches of up
to three rows per invocation, with a separate 25-second UPS timeout per row.
Each result is persisted as it arrives. The detail page polls saved progress
once per second while a batch is working; progress requests never start UPS calls
or acquire a lease. Completed results appear while other rows are still loading.
Database snapshots are serialized and fenced by the batch attempt ID so parallel
completions and expired requests cannot overwrite newer results. A failed row
does not stop other rows, and Retry only repeats failed rows.
Selected services missing from UPS's response are shown as unavailable, not as
zero-dollar rates. Duplicate restores all rows, service choices, and case inputs.
Historical quotes without rate rows retain their existing behavior.

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
