# API connections and the same-origin proxy

Data-link API nodes already execute on the EOP server. Monitors fetch the finished
slide data from `/monitors/playback`; they do not contact the external API. Shared
data-link refresh/cache settings continue to control these workflow requests.

The raw proxy adds reusable access to the original API response. Both paths use
the same server request implementation, connection credentials, endpoint allowlist,
timeout, and public-address DNS validation.

## Configure a connection

1. Open a slide's **Data** dialog and select **API connections**.
2. Add or edit the connection. Enter the external HTTPS origin and the explicit
   endpoint paths it may use, such as `/gridpoints/BUF/71,54/forecast`.
3. Select the allowed HTTP methods. Existing connections default to GET and HEAD.
   Enable POST for an API that accepts JSON queries, for example.
4. Keep credentials in a `DATA_API_...` server environment variable and select
   the existing bearer or custom-header authentication option.
5. Enable **Allow approved monitors to use this connection's proxy** when direct
   monitor requests should be allowed. This is off for existing connections.
6. Save. The connection editor shows the first monitor proxy URL for saved,
   enabled connections.

The connection ID is the 24-character ID in the generated URL. A connection's
allowed methods apply to workflow nodes and both proxy endpoints. Monitor exposure
only affects the monitor endpoint; existing server-side workflows keep working
without enabling it.

## Endpoints

| Caller              | URL                                                      |
| ------------------- | -------------------------------------------------------- |
| Approved monitor    | `/monitors/api/CONNECTION_ID/UPSTREAM_PATH`              |
| Slide administrator | `/admin/monitors/slides/api/CONNECTION_ID/UPSTREAM_PATH` |

Route access uses the existing central hooks: monitor approval for the monitor
route, and employee slide-management permissions for the administrator route.
The proxy does not accept an arbitrary destination URL. Its destination comes
from the saved connection, and the requested path must match an allowed path.

For a weather connection whose origin is `https://api.weather.gov`:

```js
const response = await fetch('/monitors/api/CONNECTION_ID/gridpoints/BUF/71,54/forecast?units=us');
const forecast = await response.json();
console.log(forecast.properties.periods);
```

Query strings, including repeated parameters, are passed to the upstream API.
GET, HEAD, POST, PUT, PATCH, and DELETE are supported when enabled on the
connection. Request bodies are forwarded as bytes with their Content-Type:

```js
const response = await fetch('/monitors/api/CONNECTION_ID/v1/query', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ department: 'press' })
});
const originalApiData = await response.json();
```

The response body is returned without a wrapper or field mapping: nested JSON,
root arrays/scalars, XML/text, and binary images retain their original payload.
Upstream success/error status codes and selected content/retry headers are
preserved. Browser cookies and authorization headers are not sent upstream;
authentication is injected from the connection on the server. Upstream cookies
and redirect headers are not returned to the browser. Redirects produce a local
error so the monitor cannot be redirected to an external website.

Returned URLs inside a payload are unchanged. If a response contains an external
image URL, request that image through an appropriately configured proxy connection
too. Proxying the JSON alone does not proxy subsequent image requests.

## Data-link API nodes

Existing GET nodes work without changes. JSON-query APIs can use `method` and
`body` in the node configuration:

```json
{
	"connectionId": "CONNECTION_ID",
	"method": "POST",
	"path": "/v1/query",
	"query": {},
	"body": { "department": { "$param": "department" } },
	"itemsPath": "data.rows",
	"fields": { "id": "id", "name": "name" }
}
```

The raw response remains available through the proxy. Data-link nodes still
select an array and map its fields into rows for binding. Workflow nodes run
repeatedly as slides refresh, so use APIs intended for reading/querying data.

## Request limits

Raw proxy responses use `private, no-store`. Workflow caching is unchanged.
Requests accept at most 1 MB of body data and 8 KB of encoded query parameters;
raw responses allow 5 MB. Workflow responses retain their 1 MB / 500-row limits.
Connections retain their 1–10 second timeout. Responses are buffered, not streamed.

The EOP hosting server needs outbound access to the configured external APIs.
The Pi only needs access to EOP for these requests. Private-network destinations,
unlisted paths, unsafe methods, and redirects remain blocked.
