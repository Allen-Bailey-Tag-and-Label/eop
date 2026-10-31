# Rich text posts

New posts use the shared RichTextEditor component. Tiptap provides editing,
selection, commands, history, and document structure. The toolbar, dialogs, fields,
and surfaces use application Sveltewind components and the shared theme.

The editor uses one Card with a toolbar at the top and the content below it.
The toolbar supports headings, bold, italic, underline, strike, bullet and numbered
lists, alignment, links, images, tables, undo, and redo. Controls are grouped in
this order: history; heading/paragraph and size; text styling and colors;
alignment; lists; links/images/tables; questions (the question-mark icon).
The H dropdown chooses paragraph or heading style. The adjacent size input
applies an explicit size of 8–200 pixels to selected text; clear it for the
inherited size. Font color and highlight color open swatch pickers with reset
actions. These styles are stored in the rich text document and displayed in
both the preview and published post. Existing documents need no conversion.
The Table settings button opens a dialog to create a table with a chosen row and
column count. With the cursor in a table, the same dialog provides row, column,
header, and removal controls. Selecting a table does not add toolbar buttons.

The post editor uses two columns on desktop. On smaller screens, Edit and View
tabs at the top switch between full-height panes without discarding unsaved edits.
The edit and preview panes scroll independently, with padding around their content
to keep focus outlines visible. The outer grid does not clip the panes.

Link settings include a URL, label/text, and Text link or Button link appearance.
Button links use the site's Button theme and remain anchors for navigation. Use
form buttons for actions such as submitting responses. Existing links default to
the normal text appearance. Selecting or placing the cursor inside a link lets
you edit its complete label and destination.

## Images

Select an image and open Image settings to change its source, alternative text,
caption, width, and alignment. The source tabs are Upload, Uploaded images, and
URL. Save a new post before uploading images. Upload accepts PNG, JPEG, and WebP
files up to 3 MB. Uploaded images are specific to that post; the picker shows the
latest 200 uploads. URLs can reference HTTP(S) images or existing site paths.

Image bytes are stored as BSON binary in PostImage documents with a postId. The
post's content stores the image URL reference, rather than base64 or duplicate
image bytes. Binary data is excluded from generic CRUD and operation logs.
Readers fetch images through the post's audience checks in hooks.server.ts.
Editors use a private preview path protected by the existing post management
permission. An uploaded image can be reused within its post without uploading it
again. Uploading alone does not insert it: select it and choose Apply, then save
the post.

## Questions and components

Save a new post before adding questions. Use the editor's Questions
button to create and publish a question set, then Insert it at the editor's
selection. It appears as a selectable Questions block in the editor and as the
actual questions in the post preview. Preview submissions remain disabled.
There is no separate Forms button at the top of the post editor. Legacy Markdown
mode has a Questions button beside Convert to rich text. Question sets are scoped
to the post; another post's sets cannot be selected or attached.

Stored component blocks contain a registered name and validated properties.
PublishedForm is the first registered component. Additional components need a
schema/validation entry, an editor insertion UI, and an explicit renderer mapping.
Post content cannot import or compile arbitrary Svelte code.

## Existing Markdown posts

No bulk database migration is required. Existing posts without a content document
keep their Markdown editor and original public renderer, including custom Svelte
component tags. Merely opening or saving one does not convert it.

Choose Convert to rich text to explicitly convert supported Markdown. Review the
preview and save the post to persist the new format. Headings 1–3, paragraphs,
formatting, links, images, lists, quotes, code, tables, and PublishedForm tags are
supported. Raw HTML, other components, task checkboxes, and unsupported constructs
stop conversion with an error, leaving the Markdown editable. Component examples
inside code blocks remain code.

The original md field is retained when a converted post is saved. It is a legacy
source, not a synchronized Markdown export of later rich text edits. The content
document becomes authoritative for rendering and form-reference tracking.
Markdown separators (`---`) are supported. Saving submits the editor's current
document explicitly and does not reset the form after success. A populated JSON
document takes precedence over a stale format flag. A stale Markdown-only page
cannot erase an existing rich-text document; it is asked to reload instead.
Link attributes emitted by Tiptap, including its optional title, are accepted
during validation so converting and saving a post with links round-trips correctly.

## Storage and rendering

Post.content stores `{ schemaVersion: 1, doc: <Tiptap JSON> }`. The server validates
document size, depth, node structure, URLs, attributes, formatting, and component
references before saving. The renderer outputs escaped text and explicit semantic
elements/Svelte components; it does not insert stored HTML directly. Post.md stays
available for existing content. Both canonical post URLs and legacy news URLs
support either format. Audience enforcement remains in hooks.server.ts.
