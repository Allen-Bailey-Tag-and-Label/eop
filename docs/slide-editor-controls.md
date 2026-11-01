# Slide editor controls

Open **Keyboard shortcuts** beside the timeline for the complete shortcut list.
Most commands use one modifier; a few use two to avoid browser menus and navigation.
They are ignored in inputs, inline text editors, dialogs, and popup menus. System
utilities can reserve shortcuts before the browser receives them.

- Tools: Alt+Shift+V selects, Alt+Shift+H pans, Alt+R resizes, and Alt+1 through
  Alt+9 add text, barcode/QR, chart, image, rectangle, ellipse, line, repeater, and frame.
- Timeline: Ctrl+Space plays/pauses, Alt+Shift+Home/End goes to the start/end,
  Alt+PageUp/PageDown jumps to the selected element's previous/next keyframe,
  Ctrl+Left/Right nudges 100ms, and Alt+comma/period nudges 10ms.
- Alt+K adds a keyframe, Alt+J removes the keyframe at the current time, and
  Alt+G focuses the time field. Ctrl+S saves the draft.
- Alt+Shift+D opens data links, Alt+Shift+E exports, and Alt+Shift+F fits the canvas.
  The shortcut reference lists the remaining single-Alt commands.

Plain arrows still nudge objects; Shift+arrows use larger steps. Extra modifiers
must match exactly, so the old three-modifier combinations no longer run commands.

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
