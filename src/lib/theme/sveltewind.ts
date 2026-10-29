import { theme, Theme as SveltewindTheme } from 'sveltewind/theme';
import { classic } from 'sveltewind/themes';
import type { ComponentKey, Theme } from './types';

// Adapters already supply the application's classes; do not layer preset styles on top.
export const unstyledTheme = new SveltewindTheme();

theme.set.theme(structuredClone(classic));
// Card delegates to the package Div; local Card had no inherited Div styling.
theme.set.component('div', { base: '', variants: {} });

const migratedComponents = [
	'A',
	'Card',
	'Tabs',
	'H1',
	'H2',
	'H3',
	'Header',
	'Label',
	'Option',
	'P',
	'Table',
	'Tbody',
	'Td',
	'Th',
	'Thead',
	'Tr'
] as const satisfies readonly ComponentKey[];

export function syncSveltewindTheme(applicationTheme: Theme) {
	for (const component of migratedComponents) {
		const { default: base, ...variants } = applicationTheme[component];
		theme.set.component(component.toLowerCase(), { base, variants });
	}
}
