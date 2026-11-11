# Unishippers LTL integration review

Reviewed the supplied `SpeedshipAPI V4 Staging.postman_collection 3.json` against
the existing `/shipping/quote` form and server-side quote collection logic.

## Configuration

The local `.env` and tracked `.env.example` now accept these server-only settings:

| Setting                     | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `UNISHIPPERS_CLIENT_ID`     | Supplied OAuth client ID; enter locally.     |
| `UNISHIPPERS_CLIENT_SECRET` | Supplied OAuth client secret; enter locally. |
| `UNISHIPPERS_TOKEN_URL`     | `https://auth.staging-wwex.com/oauth/token`  |
| `UNISHIPPERS_API_BASE_URL`  | `https://speedship.staging-wwex.com/svc`     |
| `UNISHIPPERS_AUDIENCE`      | `staging-wwex-apig`                          |

The tracked template leaves credentials empty; actual credentials are entered in
the local `.env`, which is ignored by Git. Each handling-unit group gets a
density-derived class; no freight-class environment setting is required.

## Staging test results

The user confirmed staging credentials and selected class `55` with NMFC
`153500-02` for testing. An initial `401 Unauthorized` was resolved after the user
corrected the local client-secret entry. Authentication now returns HTTP `200`,
a Bearer access token, and `expires_in: 86400` (24 hours). Credential values and
tokens were not logged.

The domestic `shopFlow` endpoint returned HTTP `200`, `clientStatus.success: true`,
and 17 offers for a minimal shipment based on the collection's California-to-Texas
sample lane. Company names and contact details were omitted successfully. These
are staging offers, not confirmed live-account rates. No booking, pickup,
cancellation, or label endpoints were called.

### Verified response fields

| Purpose                       | Response path                                               |
| ----------------------------- | ----------------------------------------------------------- |
| Overall success               | `clientStatus.success` together with HTTP status            |
| Carrier offers                | `response.offerList`                                        |
| Carrier name/code             | `offer.primaryVendor.preferredName` / `scac`                |
| Quoted account price/currency | `offer.totalOfferPrice.value` / `unit`                      |
| Raw vendor cost               | `offer.totalOfferCost` was null in the tested offers.       |
| Quote reference               | `offer.offerId`                                             |
| Itemized charges              | `offer.offeredProductList[].chargeItemList[].customerPrice` |
| Transit estimate              | `offer.offeredProductList[].shopRQShipment.timeInTransit`   |

The minimal one-pallet test returned a FedEx Freight Economy offer of USD 196.51
with freight, fuel, and CARB compliance charges. The returned account offer price
is the candidate upstream cost for the app's markup, but its billing semantics
should be confirmed before production. Do not treat the null vendor cost as zero
or add the itemized charges to an already-inclusive offer total.

### Request mapping checks

- Use `handlingCharge: { value: "0", unit: "AMOUNT" }` when the app supplies its
  own markup. The API rejected `unit: "USD"` with HTTP `422`; the supported charge
  types are `AMOUNT` or `PERCENT`. The collection's `10 PERCENT` sample must not be
  copied into the app's normal request.
- Omitting sample declared-value and insurance-category fields, setting
  `insuranceRequestFlag: false`, and using zero handling returned offers without
  the sample's customer handling charge or enabled insurance.
- Handling-unit and shipped-item weights are aggregate group weights in the
  tested requests. With quantity 2 and both weights set to 500 lb, the API
  recalculated the shipment to 500 lb even when the top-level total was 1,000 lb.
  With both group weights set to 1,000 lb, it correctly returned 1,000 billed lb.
  The adapter must multiply the form's per-unit weight by its quantity.
- Minimal one- and two-pallet requests succeeded with class `55` and the supplied
  NMFC. Returned handling-unit `class` and item `commodityClass` remained `55`,
  but the sample dimensions also produced `updatedCommodityClass: "400"`.
  Confirm this field's meaning and the correct production classification; do not
  silently substitute it or treat the temporary test class as authoritative.
- A test with `preferredVendorList: ["SAIA"]` still returned multiple carriers
  with `returnSelectedServiceOnly: false`. Do not assume this list is a strict
  carrier filter without verifying the documented selection behavior.

## Collection findings

- The LTL token example posts URL-encoded `grant_type=client_credentials`,
  `client_id`, `client_secret`, and `audience` to the token URL. Its Postman script
  reads `access_token` into an `idToken` environment variable.
- Domestic LTL shopping uses `POST /shopFlow`, a Bearer token, and JSON with
  `request.productType` set to `LTL`. `returnSelectedServiceOnly` is false.
- The shop request contains origin/destination addresses, shipment date,
  handling-unit quantities, dimensions, weights, stackability, shipped items,
  and pickup/delivery accessorials.
- The domestic example uses `PLT` packaging, inches, pounds (`LB`), and `NET`
  dimensions. It contains company/contact details that the current quote form
  does not collect.
- Inside pickup/delivery and liftgate flags map to existing form options.
  The example represents limited access through an address `locationType` of
  `LIMITED_ACCESS`; allowed location values need confirmation for a complete map.
- The example provides `commodityClass: "50"`, `commodityDescription: "Required"`,
  and `NMFCNbr: null`. It does not demonstrate NMFC-only rating or identify the
  freight class for our default NMFC `153500-02`.
- The example contains a one-item, one-handling-unit shipment. It does not settle
  whether each weight is per unit or aggregate when quantities exceed one.
- The shop example filters one preferred vendor. That example filter should not
  become an application default without a business requirement.
- There are no saved response examples in the collection. A price, currency,
  carrier/service, offer identifier, transit time, error, and token-expiration
  response contract cannot be verified from it.
- Most raw bodies contain JSON comments. They need to be converted into normal
  JSON request objects rather than copied verbatim. Sample dates and addresses
  also need to be replaced with actual shipment data.
- `quoteOrderFlow` includes offer/transaction references and pickup scheduling
  fields. The first integration should use the shopping operation for quotes;
  booking, cancellation, labels, and pickup scheduling are outside this task.

## Remaining confirmations

The server-side adapter is connected using the existing form and density-based
classification. Before production:

1. Obtain response/API documentation and confirm which offer amount is the
   complete account charge before the app's markup, including surcharges.
2. Confirm the correct class/description or official lookup for NMFC `153500-02`,
   and the meaning of `updatedCommodityClass`. Confirm the standard density scale
   applies to the selected NMFC entry and any applicable account-specific rules.
3. Verify the complete accessorial/location-type mapping, carrier-selection
   behavior, and any additional account constraints outside the tested lane.
4. Obtain the production token/API URLs, audience, and credentials. The provider
   said these will be supplied after development is completed.

## Application integration and testing

`src/lib/server/shipping/unishippers.ts` now connects `/shipping/quote` to the
staging shopping endpoint. It caches OAuth tokens until shortly before expiry,
shares concurrent authentication requests, and retries authentication once on
an expired-token response. Credentials and provider error bodies stay server-side.
Requests use the form's addresses, NMFC, stackability, dimensions, accessorials,
and aggregate handling-unit weights. No extra provider handling charge or
insurance is added. The class is recalculated server-side from each group's
weight and dimensions; saved or submitted legacy class fields cannot override it.

Density is weight per pallet divided by cubic feet per pallet, where cubic feet
is length × width × height (inches) ÷ 1728. Group quantity multiplies both weight
and volume and does not change density. Different pallet groups are classified
separately rather than averaging away different densities. Include the complete
pallet and packaging in measurements and weight. The UI shows live density/class;
incomplete inputs show no class. Classification uses full precision even though
the display rounds density to two decimal places.

The mapping uses [NMFTA's standard 13-subprovision density scale](https://nmfta.org/news/decoding-density-the-freight-factor-you-cant-afford-to-overlook/),
effective July 19, 2025. This is distinct from the older 18-class density guidance.
The NMFC code remains unchanged; this calculation does not infer an NMFC subitem.

The existing LTL markup rules apply to the inclusive account offer price. UPS and
LTL still run in parallel, with provider failures saved independently. Saved
results include staging labels, class warnings, and available transit estimates.
The real adapter passed an opt-in staging smoke test using the app's Caledonia
origin, today's shipping date, and two 500 lb pallets to Highland Park, TX 75219.
This requested rates only; it did not create a database quote or book freight.

To test the complete UI and saved quote flow:

1. Open `/shipping/quote` and use the **Both**, **LTL**, or **UPS** service tabs.
2. Confirm the origin and enter a valid destination. The staging test destination
   used Highland Park, TX 75219; use a real street address when validating.
3. In **Simple**, enter weight using **Total weight**, **Per pallet/package**,
   **Different weights**, or **Cases / units**. For LTL, enter pallet dimensions,
   stackability, and NMFC (default `153500-02`). Check the live density/class.
   For example, a 500 lb, 48 × 48 × 48 inch pallet has density 7.8125 PCF and
   density class `125`. Two identical pallets retain the same class.
4. Review accessorials. The existing **Validate** option uses UPS address
   validation; select No only when intentionally testing without that validation.
5. Submit the quote. The saved results page should show Unishippers offers,
   carrier cost, the configured LTL markup, customer price, transit information,
   and a staging test notice. Check any classification warning.
6. Try **Both** to verify UPS and LTL results appear together. Quote again creates
   a fresh provider request; reopening a saved quote preserves its original prices.

In **Both**, choose package or pallet weight entry. The total shipment weight is
shared; the other service needs only its separate handling-unit count. Editing
the source weight updates both providers. Any tare entered in that source is
included in the shared total; no additional pallet weight is added automatically.
Totals are distributed in thousandths of a pound without increasing the total
through per-unit rounding.
Changing the entry basis retains the total weight and handling-unit counts and
starts with total-weight entry. Case/unit packing settings belong to their
packaging basis and must be entered for the new basis if that mode is selected.

Use **Advanced** to add, duplicate, or build multiple quantity rows. Each row
has its own packing and pallet geometry, and each provider quotes each row.
Successful rows remain available if another row fails. Saved results compare
UPS/LTL customer prices by the same quantity IDs and preserve the original markup.
The original quote records remain readable; duplicating them initializes the new
editor, including multiple existing pallet geometries.

If the form reports an unconfigured connection after editing `.env`, restart the
dev server to reload the environment. No further credentials are needed for the
tested staging flow. Production requires the confirmations and settings above.

The live smoke test is opt-in: set `UNISHIPPERS_STAGING_TEST=1` and run the server
test `unishippers-live.spec.ts` with `.env` loaded. It refuses production hosts.
