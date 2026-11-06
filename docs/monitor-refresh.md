# Published content and remote display refresh

Displays fetch `/monitors/playback` without caching every 30 seconds and before
each new slide. The server reads the current published slide documents for the
assigned published playlist. Publishing an included slide does not require
republishing the playlist. Draft-only edits do not appear on monitors.

New content is normally applied between slides to preserve the current animation
and transition. A long slide can therefore delay visible changes beyond the
30-second background check. Held final slides in non-looping playlists also
accept published changes. Offline displays keep their last available content.

## Hard refresh

Use **Admin → Monitors → Management → Hard refresh** beside the target monitor.
The server increments that approved monitor's persistent `refreshVersion`.
Existing status polling delivers the version, normally within 30 seconds online.
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

## Deployment and limits

Displays already open before this feature is deployed need one initial reload
to load the new refresh listener. Subsequent requests can be sent remotely.

The control reloads the web display; it does not reboot the Raspberry Pi or restart
Chromium. It requires the page's JavaScript and status polling to be running.
A fully frozen or crashed browser requires recovery through device management.
The management success message confirms the request was queued, not that the
device has completed its reload.
