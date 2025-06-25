import * as components from '$lib/components';

export type Component = {
	default: string;
	[variant: string]: string;
};
export type ComponentKey = keyof typeof components;
export type Theme = {
	[key in ComponentKey]: Component;
};
