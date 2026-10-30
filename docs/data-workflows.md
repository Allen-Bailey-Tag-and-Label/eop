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

## Use a source on a slide

1. Select an element and open its **Data source** settings.
2. Choose the source and named output, then override parameters if needed.
3. Bind element properties to output fields. A standalone element uses the first
   row. Text, QR content, uploaded image asset IDs, colors, visibility, and image
   opacity can be bound. Images use uploaded asset IDs, rather than remote URLs.
4. To show every row, select an existing object and click **Repeat with data**.
   This wraps the object in a repeater. Frames let one repeated item contain
   several objects. Edit the item template to bind its children to `row.field`.
5. Configure the repeater's columns, gaps, paging, clipping, and stagger as usual.
   Save and publish the slide.

Existing inline database links and their item templates remain supported. To
reuse one, create a database node with the existing query settings, publish an
output with the same fields, and choose it in the existing repeater's Data link.

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

On the existing birthday repeater, choose this source and `employees`, edit its
item template, bind text to `row.displayText`, and use text formatting. Styling,
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
