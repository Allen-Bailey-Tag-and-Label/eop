# Moving slides between environments

Use a slide package to transfer a slide from development to production without
rebuilding its layout, uploaded assets, data links, or API connections.

## Export

1. Save any changes made inside the Data dialog. The package includes persisted
   data-link drafts and published versions; the slide layout uses the editor's
   current state, including unsaved layout changes.
2. Click **Export**, then **Export slide package (ZIP)**.
3. Click **Download slide package**.

The ZIP contains `slide.json` and referenced image/SVG files in `assets/`.
The manifest includes the slide title, slug, layout, nested frames and repeater
bindings, data-link definitions, and API connection settings. Uploaded asset IDs
embedded as values in workflow definitions and source parameters are also copied.
Slide/shared asset and data-link scopes are preserved for newly created resources.

API credentials are not included. Connections carry their environment variable
names, so configure those variables on the destination server. Cached responses,
underlying business records, playlists, and monitor assignments are excluded.
Images whose IDs only appear in database/API responses need a separate migration;
the exporter does not execute data sources or copy the queried database records.

## Import

1. On the destination, open a new or existing slide editor and click **Import**,
   then **Import slide package (ZIP)**.
2. Select the ZIP file. Review does not write to the database.
3. Review the title and choose an unused slug. Import always creates a new slide;
   it never overwrites the slide currently open.
4. For each asset, data link, and API connection, choose **Create a copy** or reuse
   an existing resource. Asset/data-link reuse is limited to shared resources.
   Reused data links must expose compatible outputs and parameters. A published
   packaged data link requires a published replacement.
5. Click **Import as new draft**. IDs are regenerated and remapped throughout
   nested slide elements, templates, workflows, and connections. Existing shared
   resources are not modified. Failed imports remove newly created dependencies.
6. Verify the imported slide, API credentials, and production data previews.
   Publish the slide and add it to a production playlist when ready.

New copies of data links retain their published definitions so bindings can
resolve in previews. The imported slide is always unpublished.

Packages are limited to 4 MB compressed and 20 MB expanded, with at most 100 assets,
100 data links and 30 API connections. Each asset follows the normal image upload
limits and SVG sanitization. Reduce image sizes if the transfer exceeds the limit.
The original JSON import/export remains available for layout-only transfers.
