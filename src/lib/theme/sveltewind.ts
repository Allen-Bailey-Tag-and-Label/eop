import { theme, Theme as SveltewindTheme } from 'sveltewind/theme';
import { classic } from 'sveltewind/themes';
import type { ComponentKey, Theme } from './types';
import { twMerge } from 'tailwind-merge';

// Adapters already supply the application's classes; do not layer preset styles on top.
export const unstyledTheme = new SveltewindTheme();
export const tableMultiSelectTheme = new SveltewindTheme();

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
	// MultiSelect's inline control contains both its chips and search input.
	theme.set.component('comboboxControl', {
		base: twMerge(
			applicationTheme.Input.default,
			'flex h-12 min-w-0 items-center gap-2 py-0 focus-within:outline-2 focus-within:outline-primary-500 aria-disabled:cursor-not-allowed aria-disabled:opacity-50'
		)
	});
	theme.set.component('comboboxLabel', {
		base: twMerge(applicationTheme.Label.default, 'mb-2 block')
	});
	for (const component of migratedComponents) {
		const { default: base, ...variants } = applicationTheme[component];
		theme.set.component(component.toLowerCase(), { base, variants });
	}
	// Scope cell appearance to table controls without changing standalone form fields.
	tableMultiSelectTheme.set.theme({
		...theme.get.theme(),
		comboboxControl: {
			...theme.get.component('comboboxControl'),
			base: twMerge(theme.get.base('comboboxControl'), applicationTheme.MultiSelect.tableControl)
		},
		multiSelectInlineValues: {
			...theme.get.component('multiSelectInlineValues'),
			base: twMerge(
				theme.get.base('multiSelectInlineValues'),
				applicationTheme.MultiSelect.tableValues
			)
		}
	});
}
