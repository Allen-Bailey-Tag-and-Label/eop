import type { defaultTheme } from './themes/default';

export type Component = {
	default: string;
	[variant: string]: string;
};
// The application theme styles local components and their migrated Sveltewind counterparts.
export type ComponentKey = keyof typeof defaultTheme;
export type Theme = {
	[key in ComponentKey]: Component;
};
