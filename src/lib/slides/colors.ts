import type { ColorScheme, SlideColor } from './types';

export const resolveSlideColor = (color: SlideColor, scheme: ColorScheme) =>
	typeof color === 'string' ? color : color[scheme];

export const displayBackground = (scheme: ColorScheme) =>
	scheme === 'dark' ? '#09090c' : '#ffffff';
