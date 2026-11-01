# Slide editor controls

Open **Keyboard shortcuts** beside the timeline for the complete shortcut list.
Matching tools use Figma's keys: **V** selects/moves, **H** pans, **T** adds text,
**R** adds a rectangle, **O** an ellipse, **L** a line, **Shift+L** an arrow,
and **F** a frame. Hold **Space** to pan temporarily; releasing it restores
the previous tool. The existing resize mode remains Alt+R; it is not Figma's
Scale tool, which also scales child contents.

Selected text takes priority: letters (including uppercase letters) and spaces
start inline editing instead of changing tools. Finish editing with Ctrl+Enter
and deselect the text to use the bare tool keys. Inputs, dialogs and popup menus
keep their normal keyboard behavior.

- Extra shapes: Alt+Shift+P adds a polygon; Alt+Shift+S adds a star. Figma does
  not assign default keys to these shape tools.
- Slide-specific tools: Alt+2 barcode/QR, Alt+3 chart, Alt+4 existing image/graphic,
  Alt+8 repeater. Other commands are listed in **Keyboard shortcuts**.
- Timeline: Ctrl+Space plays/pauses, Alt+Shift+Home/End goes to the start/end,
  Alt+PageUp/PageDown jumps to the selected element's previous/next keyframe,
  Ctrl+Left/Right nudges 100ms, and Alt+comma/period nudges 10ms.
- Alt+K adds a keyframe, Alt+J removes it at the current time, Alt+G focuses the
  time field, and Ctrl+S saves. Plain arrows still nudge objects, with Shift for
  larger steps.

Shapes have editable polygon sides, star points/inner radius, and arrowheads
(start/end/both/none) with shaft width. Fills support light/dark colors and alpha;
strokes follow the shape outline. They work inside frames and repeater templates
and retain the same responsive anchors and animation support as other elements.

Reference: [Figma shape tools](https://help.figma.com/hc/en-us/articles/360040450133-Shape-tools)
and [toolbar](https://help.figma.com/hc/en-us/articles/360041064174-Access-design-tools-from-the-toolbar).

Enter `2.5s`, `2500ms`, or `2.5` (seconds) in **Jump to time** and press Enter.
Seeking pauses playback and clamps to the slide's duration. Keyframe navigation
only considers the selected element, including when editing a frame or template.

Double-click a text element, or select it and start typing, to edit on the canvas.
Enter inserts a new line, Ctrl+Enter finishes, Escape restores the original text,
and clicking elsewhere commits. Text controlled by a data binding remains linked;
edit or remove the binding in Properties instead of overwriting its displayed data.

Numeric fields throughout the slide editor and its dialogs support horizontal
dragging. Click and type normally, or drag at least four pixels to scrub. Each
four pixels changes one declared step; Shift uses ten steps. Minimums, maximums,
and decimal steps are respected. Cancelling a pointer drag restores its starting
value. Fields elsewhere in the site keep their existing behavior.

Hold Shift while dragging a corner handle to preserve the element's aspect ratio.
Side handles continue resizing one axis. Rotated and responsive elements retain
their opposite resize anchor.

The QR code / Barcode tool supports the 111 symbologies in the installed
`@bwip-js/browser` encoder. Select **Barcode symbology** in Properties; linear
formats have specific numeric/check-digit requirements, and specialized formats
may require structured content. Invalid content displays a placeholder instead
of breaking the slide. Corner radius is available under Appearance. Keep enough
quiet space around barcodes and verify scanning after rounding or resizing.

Existing QR elements and exports continue working: their saved type stays `qr`,
and a missing `barcodeSymbology` means `qrcode`.
