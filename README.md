# sv

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

1. Open **Admin → Monitors → Slides** and create a slide. The editor fills the
   available application height without page scrolling. Use **Settings** in the
   top toolbar for title, unique slug, reference dimensions, background, and duration.
   The default reference is 1920 × 1080. Playback always fills the available screen;
   element constraints adapt the layout without letterboxing the slide.
2. Use **Add** or the left tool rail for text, images, SVG assets, rectangles,
   ellipses, or lines. Select and drag elements to move them; arrow keys nudge by
   one reference unit (Shift for ten). The resize tool provides a corner handle. Moving an
   animated element shifts its complete animation path. Use the hand tool to pan
   the view, and the bottom zoom/fit controls to navigate without changing the slide.
   The right inspector has Properties, Layers, and Animation tabs and scrolls
   independently. It can be hidden for more canvas space. Upload assets through
   **Upload asset** in the top toolbar:
   PNG/JPEG/WebP images under 3 MB or SVGs under 300 KB. SVG scripts, external
   references, embedded HTML, and styles are removed; use element timelines for
   animation. Assets are immutable and stored separately in MongoDB, with IDs
   referenced by slides. No extra hosting service or environment secrets are needed.
3. Use an animation preset or edit keyframes. Each keyframe specifies a complete
   pose (x, y, opacity, scale, rotation), time in milliseconds, and easing into
   that frame. Playback, scrubbing, and clickable keyframe markers remain at the
   bottom of the editor. Set the slide duration (1–600 seconds) in Settings.
   **Background type** offers **Solid color** or **Transparent**. Transparent
   backgrounds show a checkerboard matched to the selected preview mode and reveal
   the monitor's light or dark display background.
   Later elements render in front. The final pose is held until the slide ends.
   **Whole-slide transitions** in Settings control the entrance and exit separately:
   choose **Fade** or **None** and set each duration in milliseconds. Both default
   to a 2000 ms fade, including existing slides. Fades include the background and
   every element and run inside the total slide duration. If their combined time
   exceeds the effective playlist duration, both shorten proportionally. The final
   slide of a non-looping playlist omits its exit fade so it stays visible.
   Play or scrub the timeline to preview fades; the stopped editor at time zero
   and the upcoming-slide thumbnail remain fully visible for editing and review.
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
   countdown uses the playlist duration override when set. Non-looping playlists
   show **End of playlist** and hold at **0:00** after the final slide.
   Media uses a bounded 64 MB in-memory cache; offline persistence across browser
   restarts is not provided. Revocation polling remains active independently.

The editor and player share the renderer and deterministic timeline evaluator.

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

V1 supports up to 100 elements (20 media elements) per slide, 100 keyframes per
element, 100 entries per playlist, and 250 KB slide/playlist definitions. Scheduling
by date/time, additional slide transition styles, custom live-data templates, asset deletion,
and playlist deletion are future work.

## Component implementations

Import components through `$lib/components`. Standard primitives come directly
from Sveltewind. Local adapters reuse Sveltewind components while preserving the
application's defaults, styles, bindings, and custom snippets.

The application theme bridge preserves styles for direct library exports.
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
