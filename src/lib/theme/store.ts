import { writable } from 'svelte/store';
import { twMerge } from 'tailwind-merge';
import { type Component, type ComponentKey, type Theme } from './types';
import { defaultTheme } from './themes';

const { subscribe, ...store } = writable<Theme>(defaultTheme);

const set = {
	component: (componentKey: ComponentKey, value: Component) =>
		store.update((current: Theme) => {
			current[componentKey] = value;
			return current;
		}),
	theme: (value: Theme) => store.set(value),
	variant: (componentKey: ComponentKey, variant: string, value: string) =>
		store.update((current: Theme) => {
			current[componentKey][variant] = value;
			return current;
		})
};
const update = {
	component: (componentKey: ComponentKey, value: Component) =>
		store.update((current: Theme) => {
			for (const variant in value) {
				current[componentKey][variant] = twMerge(current[componentKey][variant], value[variant]);
			}
			return current;
		}),
	theme: (value: Theme) =>
		store.update((current: Theme) => {
			for (const key in value) {
				const componentKey = key as ComponentKey;
				for (const variant in value[componentKey]) {
					current[componentKey][variant] = twMerge(
						current[componentKey][variant],
						value[componentKey][variant]
					);
				}
			}
			return current;
		}),
	variant: (componentKey: ComponentKey, variant: string, value: string) =>
		store.update((current: Theme) => {
			current[componentKey][variant] = twMerge(current[componentKey][variant], value);
			return current;
		})
};

export { set, subscribe, update };
