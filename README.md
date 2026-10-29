# sv

## Employee birth dates

`UserProfile.birthDate` is optional and stores a calendar date at UTC midnight.
The User profiles table uses a date-only control and UTC calendar formatting so
browser time zones do not shift birthdays to the previous day. New profiles do
not get an automatically generated birth date; edit the saved profile to set it.
Existing profiles require no migration and remain unchanged until edited.

See [slide data links](docs/slide-data-links.md) for aggregation queries and the
step-by-step active-employee birthdays repeater configuration.

## Raspberry Pi and monitor approval

1. On the monitor's browser, open `/monitors/pair` (or `/monitors`). No employee
   login is required. Leave the displayed code on screen.
2. On an employee computer, sign in and open `/admin/monitors/approval`. Enter the code and
   a location such as "Break room, east wall", then approve it.
3. Within approximately five seconds, the monitor switches to `/monitors/display`.
   This is the authenticated, full-screen player for its assigned published playlist.
4. Open `/admin/monitors/management` to view approved monitors and revoke access
   when a device is removed or moved. Revocation requires confirmation.
   Online displays return to pairing within approximately 30 seconds.

For an existing database, create Routes with hrefs `/admin/monitors/approval` and
`/admin/monitors/management` in **Admin → Routes**, then assign them to the appropriate roles in
**Admin → Roles**. Authorization remains in `src/hooks.server.ts`. No role checks
are duplicated in page actions. The initial admin seed also includes both routes.
Replace the old `/admin/monitors` route assignment with the new routes so both
pages appear in navigation. Existing `/admin/monitors` bookmarks redirect to approval.

Codes expire after 10 minutes, can be approved once, and are replaced automatically
when an online monitor notices expiry. Approval does not create an employee login:
the browser gets a separate random, HttpOnly credential restricted to `/monitors`.
Only its SHA-256 hash is stored. Approved sessions never expire and remain valid
until revoked. Pending codes still expire after 10 minutes, independently of TTL
cleanup. Existing approved records have their old expiry removed automatically
on the first request handled by each server process; records already deleted by
TTL cleanup cannot be recovered. The existing TTL index continues cleaning up
pending and revoked records while approved records have no expiry field.

Browser cookies use a rolling 400-day lifetime, renewed by each successful approved
status check. Keep the kiosk browser's profile/cookies across Pi reboots and use
HTTPS in production. Clearing cookies, replacing the profile, or leaving the
monitor disconnected beyond the cookie lifetime requires pairing again. Revoke
removed devices promptly: a copied credential also remains valid until revoked.

New pairing requests are limited to 30 per client IP per 10-minute window using
shared MongoDB counters. Refreshing a live code reuses the existing request.
Monitor credentials and rate-limit records are excluded from generic database
CRUD tools and operation logs. No additional environment secrets are needed.
MongoDB creates the new collections and indexes through the existing model setup.

Tests use mocked persistence and never connect to a live database:
`npm run test:unit -- --run src/lib/server/monitors src/lib/monitors/watchStatus.spec.ts src/hooks.server.spec.ts`.

## Monitor slides and playlists

For an existing database, add `/admin/monitors/slides` and
`/admin/monitors/playlists` in **Admin → Routes**, then assign the routes to the
appropriate roles. New databases include both in the initial admin seed.

The slides list uses the shared Datatable for sorting, filtering, and pagination.
Its **Actions** column offers **Edit**, **Duplicate**, and **Delete**. Duplicate
opens an unpublished copy of the saved draft with a unique slug and keeps its
media references; files remain protected while either slide uses them. Delete
requires confirmation and is blocked while any draft or published playlist uses
the slide. Uploaded assets remain after slide deletion.

The playlists list uses the same Datatable and **Edit**, **Duplicate**, and
**Delete** actions. Duplicate creates an unpublished draft with the saved slide
order, duration overrides, and loop setting; it does not copy slides or monitor
assignments. Delete requires confirmation and is blocked while approved monitors
use the playlist. Reassign those monitors in **Monitor management** first. Deleting
a playlist preserves its slides and assets.

**QR codes:** choose **Add → QR code**, then edit **QR content** (a URL or plain
text) and **QR settings** in Properties. Codes are generated locally as SVG,
with a quiet margin, using the existing barcode library; no upload or external QR
service is required. The default is black on white with medium error correction.
Content is limited to 1,000 UTF-8 bytes. Use strong contrast and verify scanning at
the monitor's viewing distance. QR elements support the same positioning,
transforms, padding, and timeline controls as other artwork. Inside a repeater
template, **QR data binding** can use a selected `row.field` to give each item its
own code.

**Conditional visibility:** open slide **Settings → Slide visibility** and enable
**Conditional visibility**. Choose **All rules match** or **Any rule matches**,
set an IANA time zone (for example, `America/New_York`), and add up to 20 rules:

- Calendar dates: before, on/before, after, or on/after a date. Inclusive end dates
  stay eligible through that entire local day.
- Weekdays and daily time windows. Time windows include their start and exclude
  their end, can cross midnight, and treat equal start/end as all day.
- Data row counts or a field comparison on any returned row. These reuse a data
  element's existing model query, including its filter, selected fields, and limit.
  Use `label`, `detail`, or `row.field`; numeric comparisons require numeric data.
  Query errors and missing fields do not match a rule.

For an event, an **On or before** date rule hides the slide after its final day.
For a holidays slide, a **Data row count > 0** rule hides it when its Holiday query
returns nothing. Rules are saved with the draft and take effect when published.
The server reevaluates them on each playback request, including slide boundaries
and the normal 30-second checks. Ineligible slides remain in the playlist and are
skipped. If none are eligible, the monitor shows a specific message and resumes
when a later check finds eligible content.

**Playlist playback options:** enable **Random starting slide** to select a random
starting point when playback starts or the content changes. The saved order is
then rotated, not shuffled: A/B/C starting at B plays B/C/A. Non-looping playlists
still play every entry once before holding the last slide. **Upcoming slide
previews** controls 1–5 future slots (default 3); loops can preview the next cycle,
while non-looping playlists stop at the last remaining entry. Publish the playlist
to apply these options. The monitor footer keeps the current countdown on the
right and horizontally scrolls the preview strip on smaller screens.

1. Open **Admin → Monitors → Slides** and create a slide. The editor fills the
   available application height without page scrolling. Use **Settings** in the
   top toolbar for title, unique slug, reference dimensions, background, and duration.
   The default reference is 1920 × 1080. Playback always fills the available screen;
   element constraints adapt the layout without letterboxing the slide.
2. Use **Add** or the floating bottom toolbar for text, images, SVG assets, rectangles,
   ellipses, lines, repeaters, or frames. Select and drag elements to move them; arrow keys nudge by
   one reference unit (Shift for ten). Selected objects have corner and side resize handles. Moving an
   animated element shifts its complete animation path. Use the hand tool to pan
   the view, and the bottom zoom/fit controls to navigate without changing the slide.
   Layers has a dedicated pane on the left; the right inspector has Properties
   and Animation tabs. Each pane can be closed independently and scrolls
   independently. It can be hidden for more canvas space. Upload assets through
   **Upload asset** in the top toolbar:
   PNG/JPEG/WebP images under 3 MB or SVGs under 300 KB. SVG scripts, external
   references, embedded HTML, and styles are removed; use element timelines for
   animation. Assets are immutable and stored separately in MongoDB, with IDs
   referenced by slides. No extra hosting service or environment secrets are needed.
3. Use an animation preset or edit keyframes. Each keyframe specifies a complete
   pose (x, y, opacity, scale, rotation), time in milliseconds, and easing into
   that frame. Playback, scrubbing, and clickable keyframe markers remain at the
   bottom of the editor. Set the display duration (1–600 seconds) in Settings.
   **Background type** offers **Solid color** or **Transparent**. Transparent
   backgrounds show a checkerboard matched to the selected preview mode and reveal
   the monitor's light or dark display background.
   Later elements render in front. The final pose is held until the slide ends.
   Transitions between slides are configured in the playlist. The slide editor's
   timeline shows only the fully visible display period and element animations.
   Legacy slide entrance/exit settings are ignored on load and removed on save/export.
4. Save a draft or publish the current editor content. Draft changes do not affect
   monitors. Publishing updates the saved draft and published snapshot together;
   stale concurrent saves are rejected. The published snapshot is kept until the
   next publish or unpublish; revision history and rollback are not yet provided.
   Saved slides have **Unpublish slide** and **Delete slide** controls in Settings.
   Both require confirmation and list referencing playlists. Unpublish preserves
   the saved draft and playlist entries; monitors skip the slide after their next
   refresh at a slide boundary, and republishing restores it. Disconnected monitors
   keep loaded content until reconnecting. A playlist with no published slides
   shows the no-playlist screen. Delete is permanent and blocked while any draft
   or published playlist references the slide. Remove it from those playlists,
   save their drafts and publish their changes, then reload the slide editor.
   Uploaded assets are retained.
5. Open **Admin → Monitors → Playlists**, create a playlist, add slides, reorder
   them, and optionally override each duration. A shorter override clips animation.
   Publish every referenced slide before publishing the playlist. Looping restarts
   from the beginning; disabling it holds the final slide on screen.
6. Assign a published playlist to an approved monitor in **Monitor management**.
   Before starting each slide (including loops), the display fetches the latest
   published content from the server with caching disabled. It retains the current
   slide while that request is pending. Background checks every 30 seconds also
   keep empty displays and non-looping final slides up to date without a browser
   refresh. Changes apply at slide boundaries. It preloads upcoming media, retains
   the current slide while preparing the next one, and continues loaded content
   during a network interruption.
   A footer below the slide shows the upcoming slide's thumbnail and published
   title on the left and the current slide's remaining time on the right. The
   countdown shows time until the next slide starts, including the incoming transition and the playlist display-duration override when
   set. Non-looping playlists show **End of playlist** and hold at **0:00** after
   the final slide.
   Media uses a bounded 64 MB in-memory cache; offline persistence across browser
   restarts is not provided. Revocation polling remains active independently.

The editor and player share the renderer and deterministic timeline evaluator.

**Grid repeaters** display model-query results using an editable item template.
Choose **Add ? Repeater**, configure its data link, then set its grid properties:
columns (0 for automatic), minimum item width, item height (0 to preserve template
aspect ratio), separate gaps, and vertical alignment. Overflow supports pagination
(default), automatic scrolling down and back, or clipping. Page/scroll duration is
in milliseconds. Make the slide display duration long enough to show all pages.
A held final slide continues cycling without replaying its playlist entrance transition.

Choose **Edit item template** to design one item on the canvas. The same text,
image, SVG, shape, color, font, anchoring, layers, and animation controls apply.
Font weight and rectangle corner radius are configurable. Set the template's
reference dimensions in the repeater properties. Use **Preview row** to inspect
different results, and **Back to slide** to see the full grid. Uploaded media in
templates is validated, prefetched, and served to monitors like other slide media.

For template text, choose **Text data binding**, such as `row.name` or `row.date`,
then a text/date/number format and an optional fallback. Only fields in the data
link's `select` are available. Data is rendered as plain text. `$index` is the
one-based row number. The default template uses Label/Detail aliases, which use
the first two selected fields when explicit legacy mappings are absent. Images,
SVGs, and shapes provide static template artwork; field bindings currently drive
text content. Nested repeaters are not supported.

Scrub or play the timeline to preview pagination and scrolling. Item animations
use slide display time, and playlist crossfades wrap the complete grid and slide background.
Set **Item stagger (ms)** in the repeater properties to delay each item's template
animations (for example, 200 starts each item 0.2 seconds after the previous one).
Items stay hidden until their turn. Zero preserves simultaneous playback. Animate
the template elements first using **Edit item template**. Each page animates on its
first appearance, then retains its final keyframes on later page cycles. A single
page never restarts at the page interval. Scrolling uses the original result order
and does not restart animations as items scroll into view. Allow enough page/slide time for the
last item's delay plus its animation duration.
Turn off **Clip repeater contents** to let template artwork and animations extend
outside their cells and the repeater bounds. This preserves the grid's pagination,
scrolling, and item count behavior. Clipping stays on for existing repeaters, and
parent frames and the slide viewport can still clip overflowing content.
Existing data lists retain their layout until **Convert to grid repeater** is
chosen in Properties. Query configuration and templates are saved/exported;
resolved row values are transient and are never written into the slide definition.

Data previews validate each data link independently of unfinished slide geometry,
item templates, and media selections. Editing other elements preserves loaded
preview data. Query and validation failures show their diagnostic message in the
admin preview. Save/publish still validates the complete slide. **Add ? Image / Graphic**
accepts PNG, JPEG, WebP, and SVG assets through one tool and one asset selector.
If no asset is available, it opens the upload dialog instead of inserting an empty
element. After uploading, choose **Add ? Image / Graphic** again. Existing image
and SVG elements can switch between both formats in Properties.
New images and SVGs default to **cover**; existing elements retain their saved fit.
Under **Graphic**, **Image opacity (%)** adjusts the artwork from 0–100% independently
of object opacity keyframes. For example, 40% image opacity stays at 40% after an
object fade reaches its final fully visible keyframe. Existing images default to
100% image opacity.

**Asset organization:** uploads belong to the current slide by default, including
uploads made while editing a repeater template. The asset selector starts on
**This slide**; **Shared library** is an explicit separate choice. Shared assets
already used by the current slide also appear under This slide. **Assets** in the
top toolbar opens the library with search and file preview links:

The library uses Sveltewind Tabs (including arrow-key navigation) and the site's
shared Card appearance. Asset actions stay in one row, scrolling horizontally
when the available width is narrow.

- **This slide:** add a local file to the canvas, **Share asset**, or select another
  saved slide as the **Copy destination** and create an independent copy there.
- **Shared library:** add an intentionally reusable file, or copy it into a slide
  to get an independent slide-specific asset. **Move to this slide** removes it
  from the shared library and transfers ownership to the current slide without
  changing its file ID. Slides already using it keep working.
- **Unused assets:** review slide-specific/unassigned files not referenced by saved
  drafts or published slides. Files used by the current unsaved edit are hidden
  here. Other unfinished edits may still reference listed files. Unassigned files
  can be assigned to this slide or shared; other unused files can be copied.
  Files are never deleted automatically.

Each asset has a **Delete asset** action with confirmation. Deletion is blocked
while any saved draft or published slide uses the file, including repeater item
templates; the error identifies the affected slides. Remove those uses and save
(and republish or unpublish where needed) before deleting. The editor also blocks
deleting files used in its current unsaved canvas. Shared assets can be deleted
under the same rules or moved into the current slide with confirmation.

A new slide receives a stable `assetScope` ID in its URL before its first upload.
The same ID is used when it is first saved, so uploads survive action reloads and
page refreshes. Keep that draft URL to return to its uploaded files before saving.
Changing a saved slide's slug does not change asset ownership.

The first admin library load classifies legacy files using distinct slide IDs
across both drafts and published snapshots, including repeater templates. A file
used by one slide belongs to that slide; one used by several becomes shared; an
unreferenced file becomes unassigned for review. Conditional updates make the
migration repeatable and preserve existing asset IDs, bytes, and published links.
Ownership is enforced when saving new references: copy or share another slide's
asset first. Existing saved references remain valid. Library sections show up to
500 recent files, plus assets already referenced by this slide.

Uploads are stored in MongoDB as `MonitorAsset` records with a name, content type,
and binary `data` buffer. Slides and templates store asset IDs, not copies of the
file. Files are served through the application's asset endpoints; they are not
written to an upload folder or external object storage. Uploads are limited to
3 MB; SVG source is additionally limited to 300 KB and sanitized before storage.

**Data lists** link a slide element to a read-only model query. Choose
**Add ? Repeater**, then configure the **Data link** in Properties:

- **Model**: a supported business model (for example, `Holiday`, `Customer`,
  `InventoryItem`, `SalesOpportunity`, or `UserProfile`).
- **find**: a MongoDB filter as JSON, including comparison/logical operators and
  expressions. JavaScript execution and write operations are not supported.
- **select**: explicit schema field names separated by spaces. The editor lists
  available fields for the selected model; Mixed fields accept nested paths.
- **sort**: JSON field/direction pairs (`1` ascending, `-1` descending).
- **skip / limit**: pagination, bounded to 10,000 skipped and 1?100 returned rows.
- **Label / Detail field** (legacy lists): selected fields to display; nested field paths are
  supported. Detail formatting can be text, date, or number.
- **Time zone / Empty message**: calendar/date formatting and the no-results text.

For upcoming holidays, use model `Holiday`, select `name date`, template text bound to
`row.name` and `row.date` (date format), and sort `{"date":1,"_id":1}`.
Maintain dates and optional names under **HR ? Holidays**. Use this filter:

```json
{ "date": { "$gte": { "$date": "today" }, "$lt": { "$date": "today+30d" } } }
```

Relative dates resolve on every server request: `today` is midnight in the
configured time zone; `today+30d` adds calendar days, including DST changes;
`now` is the request time and `now-7d` subtracts seven 24-hour periods. Ordinary
ISO date strings also work with Mongoose date fields. For customer data, the
same element can instead select model `Customer` and use its schema fields.

Models available for display are listed in `src/lib/slides/data-link.ts`.
Authentication, credentials, logs, settings, and binary assets are excluded.
Queries use the server's Mongoose model registry with `find`, `select`, `sort`,
`skip`, `limit`, `maxTimeMS(4000)`, and `lean`. Schema fields marked `select: false`
and credential fields cannot be selected. Selected display values are deliberately
published to monitor audiences; raw database records never reach monitors.

The legacy list is a normal responsive element: adjust its heading, position, size,
colors, font, and animations. Rows shrink to fit; long labels truncate. Increase
the element size or reduce the result limit for readability. The preview reloads
when query settings change; **Refresh data preview** reloads after external edits.
Configuration errors appear in Properties and query diagnostics appear in the
admin preview; monitors receive a generic error message on failure.

Publish once to save the design and data link. Monitors query current records
before each slide starts, with no persistent data cache. Record changes do not
require republishing and do not restart the playlist. Held final slides refresh
their data too. Resolved rows are never saved in drafts or exports. Previously
saved upcoming-holiday sources are upgraded to generic data links automatically.

The element inspector uses Sveltewind **Details** groups for Position,
Appearance, Typography/Graphic content, Fill, Stroke, Responsive anchoring, data
bindings, and repeater settings. Each group can be expanded or collapsed. Primary
editing groups start open; Stroke and anchoring start collapsed until needed.
Compact 32-pixel controls pair X/Y and W/H, with icon buttons for rotation,
alignment, and layer order. Prefixes have full labels/tooltips and keyboard access.
Scale and opacity display percentages while saved definitions retain their
existing numeric values. Color rows pair a swatch with an editable hex
value; fixed and light/dark modes remain available. The color toolbar shortcut
opens Fill before activating its picker. These density styles are limited to the
inspector; document dialogs and other application forms keep their normal sizing.

All slide color controls include **Opacity (%)**: 0 is fully transparent and 100
is opaque. Text, shapes, borders, text backgrounds, and the slide background can
each have their own opacity, including independent light/dark values. Swatches
show transparency over a checkerboard. Hex fields accept `RRGGBB` or `RRGGBBAA`;
changing the color picker preserves its opacity. Object opacity still fades the
entire object, including its fill, text, and border.

Text elements also have **Top**, **Middle**, and **Bottom** vertical alignment
buttons in Typography. Alignment positions the entire text block inside the
element's padding and works with multiline text and repeater bindings. Existing
text defaults to Top.

In **Layers**, drag a row above or below another row to change the stacking order.
The insertion marker shows where it will land; the top row is the frontmost layer.
With a layer focused, **Alt+Up/Down** moves it one position. The same controls
reorder layers inside a repeater item template without changing the slide's layers.

**Frames and auto layout:** use **Add → Frame**, name the frame, then choose
**Edit frame contents** to add its child elements. Frames can contain other
frames, text, images/SVGs, shapes, or data repeaters. A frame's controls offer
Free positioning, Flex row, Flex column, and Grid layouts, with column count,
horizontal/vertical gaps, distribution, alignment, wrapping, and clipping.
Children in auto layouts offer Fixed size or Fill available space. Positions are
managed by the layout; resize handles switch a filled child to fixed sizing.
The left Layers pane shows expandable frame hierarchies, with frontmost layers first.
Select a nested layer to edit its frame; **Back to parent** returns one level.
Use **Layer parent → Move into frame** to choose any nested destination by its
full path (for example, Outer / Inner), or choose Slide root / Template root.
**Move out of frame** returns one level. Alternatively, drag a layer onto the
center of a frame row to move inside it; the highlighted frame is the destination.
Expanded frames also show a **Drop layers into frame** area while dragging;
empty frames always show it. Drop there to nest the layer without aiming at the row.
Drop near a row's top or bottom edge to place the layer beside it, including
moving between parents. Moves stay within the current slide/template, preserve
reference transforms, and reject cycles, duplicate IDs and excessive nesting.
Reorder siblings by dragging or using Alt+Up/Down; in auto
layouts the top layer is also the first item. Frame transforms and animations
apply to their children, while child animations remain editable.

Every element has a **Padding** group. Uniform is the default; choose
Horizontal / Vertical to edit X and Y padding, or Individual sides for separate
top, right, bottom, and left values. Padding insets content while borders and
backgrounds retain the outer bounds. Numeric padding in existing exports remains
supported. Frames and repeater templates share the same padding controls.

Selected elements expose eight resize handles in both selection and resize
modes: all four corners and all four side midpoints. Opposite edges remain fixed
for free-positioned elements, including rotated/scaled objects. Arrow keys on a
handle resize the corresponding axes; Shift increases the step to ten units.
Resize and rotate handles use solid blue fills with white borders and dark rings
to remain visible over light or dark artwork regardless of the application theme.
The rotation stem has the same light/dark contrast treatment.

**Object appearance and rotation:** select an element to edit its rotation in
degrees, rotate left/right by 90?, or reset its visible angle. Drag the circular
handle above the selected object to rotate on the canvas; hold Shift to snap to
15? increments. With that handle focused, Left/Right rotate by 1? (Shift: 15?),
and Home resets the angle. Rotation edits shift the entire keyframe path so
animation does not override the change. Individual keyframe angles remain editable
in the Animation panel.

All objects support **Border width**, solid/dashed/dotted/double **Border style**,
and fixed or light/dark **Border color**. Borders render inside the object bounds,
without changing its size, grid spacing, or anchors. Border colors default to a
light/dark contrast pair. Text boxes offer a transparent or colored **Text
background**, including light/dark swatches, and the shared **Padding** settings.
**Corner radius** applies to text, images/SVGs, and rectangles, clipping their
contents to the rounded frame. These controls also apply to repeater item-template
elements and are saved/exported with the slide. Existing objects remain borderless
and text backgrounds remain transparent until configured.

Element and background color fields offer **Fixed** (one color in both modes) or
**Light / Dark** (separate swatches). Existing hexadecimal colors stay fixed.
New slides, text, and shapes start with matching light/dark color pairs. Images
and SVG artwork keep their original colors. Programmatic definitions can use a
hex string or a pair such as `{ light: '#111827', dark: '#f9fafb' }`.

Use **Preview color mode** beside the timeline to view either mode independently
of the admin interface theme. The canvas and transparency checkerboard follow
that selection. Choosing Fixed from a pair retains the current preview color.

In **Monitor management**, choose **Light**, **Dark**, or **System** for each monitor
and save. Existing monitors default to Dark. The setting arrives on the next
content check without reloading the browser, even when no playlist is assigned.
System follows the monitor browser's OS preference and reacts to changes. The
display background, slide colors, footer, and next-slide preview use that mode;
transparent slides reveal a light background in Light mode and a dark one in
Dark mode. Saved slide color edits still require publishing to reach monitors.

Each element has horizontal and vertical anchoring in **Properties**:

| Anchor                      | Responsive behavior                                                 |
| --------------------------- | ------------------------------------------------------------------- |
| Scale                       | Position and box size follow that screen dimension proportionally.  |
| Left / Top                  | Keep the offset from the starting edge and scale the box uniformly. |
| Right / Bottom              | Keep the offset from the ending edge and scale the box uniformly.   |
| Center                      | Keep the offset from the center and scale the box uniformly.        |
| Left & right / Top & bottom | Stretch the box between its two reference margins.                  |

Edge offsets and uniform sizes scale by the smaller screen/reference ratio, so
they follow resolution changes without stretching text or media. Scale and stretch
may change a box's aspect ratio; text scales uniformly and wraps within its box,
while images and SVGs use their existing contain/cover setting. Changing constraints
preserves the reference composition; Center retains the element's existing offset
from the reference center rather than automatically moving it to the center.
Use the bottom preview selector for reference size, 16:9, 16:10, 21:9, or portrait.
Previewing a screen shape does not change the slide's saved reference dimensions.
Animation positions use the same constraints at every frame, and canvas movement
and resizing are converted back to reference units. Existing v1 JSON without
anchors defaults to Scale on both axes, including published slides; no database
migration is required. Refresh an already-open monitor player after deployment
to load the new renderer.

Definitions are validated data, never compiled Svelte or evaluated JavaScript.
Slugs address editors; playlist entries use stable database IDs so renaming a slug
does not break playback. Only approved monitor routes can fetch playback or
published media. Versioned slides, playlists, and binary assets are kept outside
generic database CRUD exports so writes follow validation and publication rules.

For programmatic creation, use **Export** in the top toolbar to view or download
a complete JSON example. Generate the same structure and use **Import** to upload
a JSON file or paste a definition before saving or publishing.
The shared types and validation live in `src/lib/slides`. For example:

```ts
import { blankSlide, newElement } from './src/lib/slides/types';

const slide = blankSlide();
const headline = newElement('text', 'headline');
headline.text = 'Safety first';
headline.keyframes = [
	{ x: 160, y: 160, opacity: 0, scale: 1, rotation: 0, atMs: 0, easing: 'linear' },
	{ x: 160, y: 160, opacity: 1, scale: 1, rotation: 0, atMs: 800, easing: 'ease-out' }
];
slide.elements.push(headline);
console.log(JSON.stringify(slide));
```

V1 supports up to 100 elements per container, 500 total across frames/templates,
eight nested frame/template levels, 20 media elements per slide, and 100 keyframes per
element, 100 entries per playlist, and 250 KB slide/playlist definitions. Scheduling
by date/time, additional playlist transition styles, custom live-data templates, asset deletion,
and playlist deletion are future work.

## Component implementations

Import components through `$lib/components`. Standard primitives come directly
from Sveltewind. Local adapters reuse Sveltewind components while preserving the
application's defaults, styles, bindings, and custom snippets.

The application theme bridge preserves styles for direct library exports.
Sveltewind Tabs containers use the application's glass surface, rounding and
spacing through that bridge, matching the site's other controls.
Adapters pass `unstyledTheme` when supplying their existing application classes,
so package preset classes do not change the portal's appearance.

Both shared dialog components use `subtleReveal` from `sveltewind/transitions`.
The Modal panel enters and exits through that transition, including dialogs mounted
conditionally by their callers. Color inputs retain the native color picker and
use the application's `Input.color` theme variant for full-width fields with
standard input corners and padding, containing a small circular swatch that
reflects their bound value.

| Components                                                                  | Sveltewind reuse and application behavior                                                                                                                 |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                                                                      | Wraps Button with `type="button"` by default and automatic disabled styling.                                                                              |
| Em, Hr, Li, Ol, Strong, Ul                                                  | Wrap their counterparts and forward attachment arrays to the native element.                                                                              |
| Form                                                                        | Wraps Form; forwards SvelteKit enhancement as an attachment and retains loading/input/button/error snippets.                                              |
| Input, Select, Textarea                                                     | Wrap their counterparts while retaining labels, option generation, and bindings.                                                                          |
| Dialog                                                                      | Wraps Dialog, maps `open` to `isVisible`, and retains backdrop dismissal and centered scrolling content.                                                  |
| Div                                                                         | Uses Div normally; only the editable branch retains a native element for `bind:innerHTML`.                                                                |
| Radio                                                                       | Uses Radio for the input, retaining the application's label and handle layout.                                                                            |
| Spinner                                                                     | Uses Svg with the existing configurable SVG animations and rounded caps; stock Spinner has different animation controls.                                  |
| Checkbox                                                                    | Composes the library-backed Input, Label, and Div adapters; stock Checkbox puts its input after the handle, which breaks the existing peer-based styling. |
| Datatable, MultiSelect                                                      | Retain the existing feature-specific UI and data contracts, composed from library-backed primitives.                                                      |
| MarkdownToken, Modal, MongooseTable, Post, RangeInput, Slider, SubmitButton | Application-specific compositions using the shared component barrel.                                                                                      |

## Committing changes

Keep using VS Code Source Control: review the staged changes, enter the suggested
commit message, and click **Commit**. Include the staged `changelog.md` file.
No task or terminal command is required from the user.

At the end of a task, the agent prepares and stages one dated changelog entry
covering all current changes, assuming they will be committed as presented. There
is no Pending heading. If more work happens before committing, the agent
replaces that proposal with the updated message rather than adding another entry.

Before each update, the agent reconciles the changelog with Git's first-parent
history, starting with the commit that introduced the changelog. Actual commit
messages and dates replace stale proposals, including when the user edits the
message before committing. Commits made without updating the changelog are also
included on the next reconciliation. The latest entry's date and message are
reconciled with the actual commit during the next task.

The agent's helper is `npm run changelog -- "Proposed commit message"`. It only
writes the changelog; it never stages files, commits, or rewrites Git history.
Agents stage the result as part of their normal handoff. Reconciliation requires
the local Git history; shallow clones can only reflect the history available.

Test reconciliation with `node --test scripts/update-changelog.test.js`.

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Development model reloads

All application models register through `src/lib/server/mongoose/defineModel.ts`.
In development, registration recompiles models with Mongoose's `overwriteModels`
option so Vite server reloads pick up changed fields, middleware, and virtuals
without duplicate-model errors or stale schema reuse. Both the Mongoose and
connection registries point to the updated model. Production retains Mongoose's
normal duplicate-registration guard.

Generic table sanitization also refreshes cached document-array and single-nested
models when their parent schema changes in development. Repeated requests using
the same schema reuse the cached child model. These changes affect in-memory
model registration; they do not delete stored records or drop database collections.

## Playlist transitions

In the playlist editor, set **Playlist transition** to **Crossfade** (the default)
or **None (cut)**. Set the duration in milliseconds (0-60000; default 2000).
Each entry has **Transition into slide N**, which inherits the playlist default
unless explicitly overridden. Overrides follow an entry when it is reordered or
duplicated, including repeated uses of the same slide. **Transition preview**
shows two sample slides using the playlist default.

The player overlaps complete slides, including their backgrounds. Each layer
has the monitor's light/dark base behind any transparency, so a transparent
incoming slide does not suddenly reveal or remove the old slide at the end.
The outgoing layer stays opaque underneath the incoming layer as it fades in;
this avoids an unintended dip through the monitor background between opaque slides.
The first slide fades from the monitor base. A cut or zero-duration transition
switches immediately. The last non-looping slide stays visible and its data
continues updating.

Durations are fully visible hold times. A 10-second hold, 2-second incoming
crossfade, and 2-second transition into the next slide give 14 seconds of total
visibility, with the next slide starting every 12 seconds. The countdown resets
when the incoming slide starts and counts its entrance plus hold time until the
next transition. Element keyframes and repeater clocks start after entrance;
outgoing layers hold their final content pose during the overlap. A held final
slide keeps its repeater paging clock running.

Existing playlists with no transition setting use a 2000ms crossfade in both
editor and playback. This compatibility default requires no database writes.
Old per-slide entrance/exit settings no longer control playback; recreate any
custom timing as a playlist default or entry override, then publish the playlist.
Published transition changes participate in the playback version so monitors
receive them at a slide boundary. Each new visit still revalidates published
content; missing media keeps the outgoing slide visible and retries loading.
