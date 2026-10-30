# Rich text posts

New posts use the shared RichTextEditor component. Tiptap provides editing,
selection, commands, history, and document structure. The toolbar, dialogs, fields,
and surfaces use application Sveltewind components and the shared theme.

The toolbar supports headings, bold, italic, underline, strike, bullet and numbered
lists, alignment, links, images, tables, undo, and redo. Select an image and open
Image settings to change its URL, alternative text, caption, width, and alignment.
Images currently use HTTP(S) URLs or existing site paths. This does not upload
files; a file upload/asset picker can be added without changing the document format.

## Questions and components

Save a new post before adding questions. Use Forms or the editor's Questions
button to create and publish a question set, then Insert it at the editor's
selection. It appears as a selectable Questions block in the editor and as the
actual questions in the post preview. Preview submissions remain disabled.

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

## Storage and rendering

Post.content stores `{ schemaVersion: 1, doc: <Tiptap JSON> }`. The server validates
document size, depth, node structure, URLs, attributes, formatting, and component
references before saving. The renderer outputs escaped text and explicit semantic
elements/Svelte components; it does not insert stored HTML directly. Post.md stays
available for existing content. Both canonical post URLs and legacy news URLs
support either format. Audience enforcement remains in hooks.server.ts.
