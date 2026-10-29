import type { ColorScheme, SlideColor } from './types';

export const resolveSlideColor = (color: SlideColor, scheme: ColorScheme) =>
	typeof color === 'string' ? color : color[scheme];

export const displayBackground = (scheme: ColorScheme) =>
	scheme === 'dark' ? '#09090c' : '#ffffff';

// Native color inputs only edit RGB; keep alpha separately for consistent browser support.
export const colorRgb = (color: string) =>
	color === 'transparent' ? '#000000' : color.slice(0, 7);
export const hasColorTransparency = (color: string) =>
	color === 'transparent' || (color.length === 9 && parseInt(color.slice(7), 16) < 255);
export const colorOpacity = (color: string) =>
	color === 'transparent'
		? 0
		: color.length === 9
			? Math.round((parseInt(color.slice(7), 16) / 255) * 100)
			: 100;
export const withColorRgb = (color: string, rgb: string) =>
	rgb + (color === 'transparent' ? '00' : color.slice(7));
export function withColorOpacity(color: string, percent: number) {
	if (!Number.isFinite(percent)) return color;
	const alpha = Math.round((Math.max(0, Math.min(100, percent)) / 100) * 255);
	return colorRgb(color) + (alpha === 255 ? '' : alpha.toString(16).padStart(2, '0'));
}
