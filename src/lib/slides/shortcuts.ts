export const editorShortcuts = [
	['select', 'KeyV', 'Select and move', 'Alt+Shift'],
	['pan', 'KeyH', 'Hand tool', 'Alt+Shift'],
	['resize', 'KeyR', 'Resize tool', 'Alt'],
	['text', 'Digit1', 'Add text', 'Alt'],
	['qr', 'Digit2', 'Add barcode / QR', 'Alt'],
	['chart', 'Digit3', 'Add chart', 'Alt'],
	['image', 'Digit4', 'Add image', 'Alt'],
	['rectangle', 'Digit5', 'Add rectangle', 'Alt'],
	['ellipse', 'Digit6', 'Add ellipse', 'Alt'],
	['line', 'Digit7', 'Add line', 'Alt'],
	['list', 'Digit8', 'Add repeater', 'Alt'],
	['frame', 'Digit9', 'Add frame', 'Alt'],
	['color', 'KeyC', 'Element color', 'Alt'],
	['layers', 'KeyL', 'Layers', 'Alt'],
	['properties', 'KeyP', 'Properties', 'Alt'],
	['animation', 'KeyA', 'Animation properties', 'Alt'],
	['settings', 'KeyO', 'Slide settings', 'Alt'],
	['assets', 'KeyB', 'Asset library', 'Alt'],
	['data', 'KeyD', 'Data links', 'Alt+Shift'],
	['upload', 'KeyU', 'Upload asset', 'Alt'],
	['import', 'KeyI', 'Import', 'Alt'],
	['export', 'KeyE', 'Export', 'Alt+Shift'],
	['save', 'KeyS', 'Save draft', 'Ctrl'],
	['publish', 'KeyY', 'Publish slide', 'Alt'],
	['remove', 'KeyX', 'Remove selected element', 'Alt'],
	['removeKeyframe', 'KeyJ', 'Remove keyframe at current time', 'Alt'],
	['addMenu', 'Backquote', 'Open Add menu', 'Alt'],
	['play', 'Space', 'Play / pause', 'Ctrl'],
	['start', 'Home', 'Timeline start', 'Alt+Shift'],
	['end', 'End', 'Timeline end', 'Alt+Shift'],
	['previous', 'PageUp', 'Previous keyframe', 'Alt'],
	['next', 'PageDown', 'Next keyframe', 'Alt'],
	['back', 'ArrowLeft', 'Back 100ms', 'Ctrl'],
	['forward', 'ArrowRight', 'Forward 100ms', 'Ctrl'],
	['fineBack', 'Comma', 'Back 10ms', 'Alt'],
	['fineForward', 'Period', 'Forward 10ms', 'Alt'],
	['keyframe', 'KeyK', 'Add keyframe', 'Alt'],
	['seek', 'KeyG', 'Enter timeline time', 'Alt'],
	['zoomIn', 'Equal', 'Zoom in', 'Alt'],
	['zoomOut', 'Minus', 'Zoom out', 'Alt'],
	['fit', 'KeyF', 'Fit canvas', 'Alt+Shift'],
	['aspect', 'KeyW', 'Cycle preview aspect ratio', 'Alt'],
	['scheme', 'KeyM', 'Toggle preview color mode', 'Alt'],
	['help', 'Slash', 'Keyboard shortcuts', 'Alt']
] as const;
export type EditorAction = (typeof editorShortcuts)[number][0];
export function typingTarget(target: EventTarget | null) {
	return (
		typeof Element !== 'undefined' &&
		target instanceof Element &&
		!!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
	);
}
export function shortcutText(action: string) {
	const item = editorShortcuts.find(([id]) => id === action);
	return item
		? `${item[3]}+${item[1]
				.replace(/^Key|^Digit/, '')
				.replace('Equal', '+')
				.replace('Minus', '-')
				.replace('Slash', '/')
				.replace('Comma', ',')
				.replace('Period', '.')}`
		: '';
}
export function shortcutAction(event: KeyboardEvent): EditorAction | undefined {
	if (event.defaultPrevented || event.isComposing || event.metaKey || typingTarget(event.target))
		return;
	return editorShortcuts.find(
		([, code, , modifiers]) =>
			code === event.code &&
			event.ctrlKey === modifiers.includes('Ctrl') &&
			event.altKey === modifiers.includes('Alt') &&
			event.shiftKey === modifiers.includes('Shift')
	)?.[0];
}
export function parseTimelineTime(value: string): number | undefined {
	const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s)?$/i);
	if (!match) return;
	const result = Number(match[1]) * (match[2]?.toLowerCase() === 'ms' ? 1 : 1000);
	return Number.isFinite(result) ? Math.round(result) : undefined;
}
export function adjacentKeyframe(times: number[], current: number, direction: -1 | 1) {
	const sorted = [...new Set(times)].sort((a, b) => a - b);
	return direction > 0
		? sorted.find((time) => time > current)
		: sorted.reverse().find((time) => time < current);
}
