import type { defaultTheme } from './themes/default';

export type Component = {
	default: string;
	[variant: string]: string;
};
// Sveltewind components use their own theme; this registry styles local components.
export type ComponentKey = keyof typeof defaultTheme;
export type Theme = {
	[key in ComponentKey]: Component;
};
