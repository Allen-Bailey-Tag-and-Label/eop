import type { ElementPadding } from './types';

export function paddingSides(value: ElementPadding = 0) {
	if (typeof value === 'number') return { top: value, right: value, bottom: value, left: value };
	if (value.mode === 'axis')
		return { top: value.y, right: value.x, bottom: value.y, left: value.x };
	return { top: value.top, right: value.right, bottom: value.bottom, left: value.left };
}
export function paddingCss(value: ElementPadding | undefined, scale = 1) {
	const p = paddingSides(value);
	return [p.top, p.right, p.bottom, p.left].map((side) => `${side * scale}px`).join(' ');
}
