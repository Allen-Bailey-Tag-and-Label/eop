# Published content and remote display refresh

Displays fetch `/monitors/playback` without caching every 30 seconds and before
each new slide. The server reads the current published slide documents for the
assigned published playlist. Publishing an included slide does not require
republishing the playlist. Draft-only edits do not appear on monitors.

New content is normally applied between slides to preserve the current animation
and transition. A long slide can therefore delay visible changes beyond the
30-second background check. Held final slides in non-looping playlists also
accept published changes. Offline displays keep their last available content.

## Previous and next slide

Use **Prev** or **Next** beside a monitor in **Admin → Monitors → Management**.
The selected display interrupts its current slide and moves one entry backward or
forward in its playback order, using the playlist's configured transition. Its
slide timer and animations restart. Looping playlists wrap; non-looping playlists
stop at the first or last entry. A monitor without an assigned playlist has these
controls disabled.

Status checks run every two seconds, separately from the 30-second content poll.
Each click is queued persistently for that monitor and acknowledged after being
handled. Click order is preserved, including offline requests. Up to 100 requests
can be waiting per monitor; a full queue rejects additional requests. The display
remembers handled command IDs in session storage to avoid replaying a slide change
when an acknowledgment fails or the page reloads. If session storage is disabled,
this protection lasts until the page reloads.

Before stepping, the player requests fresh published content. Failed content
requests leave the command queued for retry. Commands belong to
the playlist assignment that was shown in management when clicked; an obsolete
command cannot step a newly assigned playlist. Random-start playlists retain their
current rotated playback order. Repeated slide entries are separate steps.

## Hard refresh

Use **Admin → Monitors → Management → Hard refresh** beside the target monitor.
The server increments that approved monitor's persistent `refreshVersion`.
Status polling delivers the version, normally within two seconds online.
Offline devices receive it when their status requests reconnect.

The display makes a full document navigation to its current URL with a new
`_monitorRefresh` query value. Monitor HTML and status responses use `no-store`;
the service worker does not intercept/cache fetches. Reloading resets playback,
animations, and in-memory media while loading the current document and referenced
application assets. Approval cookies, playlist assignments, and color mode remain.

The initial refresh version comes from the server-rendered display data. A new
page treats that version as its baseline, preventing an old command from causing
an endless reload loop. The request is not consumed by a status read, and repeated
admin requests increment atomically. Each device only receives its own version.
Hard refresh clears earlier queued slide changes so those commands cannot undo
the requested playback reset.

## Deployment and limits

Displays already open before navigation controls are deployed need one initial
reload to load the navigation listener and faster polling. The existing Hard
refresh control can request that reload (older clients may take 30 seconds).

The control reloads the web display; it does not reboot the Raspberry Pi or restart
Chromium. It requires the page's JavaScript and status polling to be running.
A fully frozen or crashed browser requires recovery through device management.
The management success message confirms the request was queued, not that the
device has completed its reload.
