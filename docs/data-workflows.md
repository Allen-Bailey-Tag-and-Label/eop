# Reusable slide data

Open a slide and click **Data** in its top toolbar. The dialog has **This slide**,
**Shared library**, and **API connections** tabs. Data management stays inside
this dialog and preserves unsaved canvas edits.

New links belong to the selected library. **Share** moves a slide link into the
shared library. **Move to this slide** removes a shared link from that library;
existing references in other slides keep working. Both moves require confirmation.
Unsaved slides use the same stable draft scope as their assets.

## Create a source

1. Click **Create data link**, give it a title, and start with the example literal
   node or add a database/API node.
2. Arrange nodes in the graph. Choose each node's input using its settings below
   the graph. Configuration is JSON, with an editable example for every node type.
3. Add filters, maps, joins, sorting, or grouping. Every node produces rows with
   primitive fields. Joins have two inputs; other transformation nodes have one.
4. Configure a named output: choose its node, list the fields to expose, and
   choose a stable ID field. Multiple outputs can share the same upstream nodes.
5. **Preview** runs the draft and shows node previews and output field types.
   **Save draft** preserves work without changing monitors. **Publish source**
   validates and runs it before making it available to slides.

Removing outputs, fields, or parameters used by existing draft/published slides
is blocked. Usage links show those slides. A source cannot be deleted while used.
Updates use optimistic versions to detect conflicting edits.

## Repeating content and binding data

Repeaters control copies, layout, paging, and animation. Data links fetch and
transform rows; property bindings connect those rows to content. An image, text,
shape, or frame can repeat without using a data link.

1. Select an existing object and click **Repeat element**, or add a repeater.
2. In **Repeat items > Items**, choose **Fixed count** and enter the number of
   copies (0-500), or choose **Data-link output** and select a published output.
3. Open **Edit item template**. Bind its text, QR content, uploaded image IDs,
   colors, visibility, or image opacity in **Property bindings**. A data-driven
   item uses `row.field`; **Row number** works with either mode. Fixed-count
   items can simply retain their static content.
4. Configure columns, gaps, paging, clipping, and stagger on the repeater.
5. Save and publish the slide.

Item templates have no query/source picker. A standalone element can choose a
source in **Data binding source** and uses its first output row. An existing
independent source override inside an old item template is preserved and identified
in the properties so its behavior does not silently change.

## Existing slides and imports

Published legacy slides continue using their original inline queries and renderer.
Opening an old slide extracts each inline query into a slide-specific data link
and gives the editable element a reference to it. This creates the supporting
link record but does not save, republish, or rewrite the slide in the database.
The imported query is initially available as a published link so previews continue
working. Its original selection, filtering, sorting, labels, details, date time
zone, empty message, item template, and animation settings are preserved.

Extraction uses deterministic IDs and insert-only writes: reopening the same old
slide cannot overwrite subsequent link edits or create another copy. Inline-query
JSON imports go through the same extraction before replacing the canvas. Saving
legacy definitions also converts them, including callers outside the editor.
Legacy named-source repeaters are normalized without creating another source.

Saving a draft leaves the live slide unchanged. Publish the slide when ready to
switch monitors to the extracted source; edits to that source then follow the
normal published-source behavior. Old JSON exports remain importable. New exports
reference portal data-link IDs, just as image exports reference portal asset IDs.

## Database nodes and birthdays

Database nodes use the existing model/query validation and the current EOP
database. Their configuration is `{ "query": { ... } }`, where `query` has the
same fields as a slide's existing dataSource, including `mode`, `model`, `filter`,
`select`, `sort`, `limit`, and `timeZone`.

For Employee Birthdays, copy the existing working User aggregate dataSource into
the database node's `query`. Keep the active-user match, UserProfile lookup,
current-month filtering, and displayText projection described in
[slide-data-links.md](slide-data-links.md). Select `displayText birthdayDay
firstName lastName`, sort by birthdayDay then name, and publish an `employees`
output with those fields and `_id` as its stable ID field. The database adapter
preserves each record's `_id` for output identities even when it is not displayed.

On the birthday repeater, set **Items** to **Data-link output**, choose this
source and `employees`, edit its item template, bind text to `row.displayText`,
and use text formatting. Styling,
pagination, and animations remain in the template.

## API connections

Use the dialog's **API connections** tab to create a connection: an HTTPS origin, explicit
allowed endpoint paths, authentication method, and timeout. The first version
supports JSON GET requests to public HTTPS services on port 443. Redirects and
private/local destinations are rejected, with DNS addresses checked and pinned.

Store credentials in the server environment, for example `DATA_API_SALES_TOKEN`.
The connection stores only this variable's name. Bearer and custom API-key header
authentication are supported; credentials are never stored in slides or returned
to monitor clients. Editing a connection applies to all workflows that use it.

Example API node configuration (replace the connection ID):

```json
{
	"connectionId": "0123456789abcdef01234567",
	"path": "/sales",
	"query": { "department": { "$param": "department" } },
	"itemsPath": "data.rows",
	"fields": { "id": "id", "total": "metrics.total" }
}
```

Use an empty itemsPath for a top-level array. Only explicitly mapped primitive
fields leave the adapter. API nodes can feed joins with database results.

## Transformations and parameters

Declare primitive parameter defaults at source level. Database query JSON and
API query values use `{ "$param": "department" }` for typed substitution.
Map/filter expressions use `{ "param": "department" }` and
`{ "field": "total" }`. No string interpolation or code execution is involved.

A map replaces each row with its configured fields:

```json
{
	"fields": {
		"id": { "field": "id" },
		"label": {
			"op": "concat",
			"args": [{ "field": "firstName" }, " ", { "field": "lastName" }]
		},
		"amount": { "op": "round", "args": [{ "field": "total" }] }
	}
}
```

Operations include concat, coalesce, add, subtract, multiply, divide, round,
lower, upper, month, day, date, eq, gt, lt, if, and, or, and not. Date operations
accept `"now"`; pass a time zone as the second expression argument for calendar calculations (for example, `{"op":"month","args":["now","America/New_York"]}`). Preserve an
identity field when mapping if it is used as the output's stable ID.

Filters support all/any matching and eq, neq, gt, gte, lt, lte, and contains rules.
Joins use leftKey/rightKey, inner/left mode, and a prefix for right-side fields.
Sort uses field directions 1/-1. Group supports count, sum, avg, min, and max.
Node defaults in the editor show each configuration's complete shape.

## Refresh and limits

Refresh seconds defaults to zero: execute again on each slide data request.
Positive values share cached results across monitors. Stale seconds explicitly
allows the last successful result for that additional period if execution fails;
zero disables stale fallback. Source publishing and connection changes invalidate
cache keys. Monitors consume published definitions only, at their normal data
fetch/slide boundaries; source changes do not restart animations mid-slide.

Workflows allow 30 nodes, 10 outputs, 500 rows per node, bounded expressions and
payload sizes, and a 15-second execution budget. API responses are limited to
1 MB and requests to 10 seconds. Per-node admin previews show the first 20 rows.
Private credentials and full intermediate previews are not sent to monitors.

The graph and typed configuration are the foundation for richer node controls.
Arbitrary JavaScript and external database connections are deferred; JavaScript
will require an isolated runner with its own resource and network limits.
