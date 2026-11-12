<script lang="ts">
	import { MultiSelect as SveltewindMultiSelect } from 'sveltewind/components';
	import type { ComponentProps } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { tableMultiSelectTheme } from '$lib/theme/sveltewind';

	type Props = ComponentProps<typeof SveltewindMultiSelect>;
	let {
		class: className,
		element = $bindable(null),
		selectionPlacement = 'inline',
		theme: componentTheme,
		value = $bindable([]),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<SveltewindMultiSelect
	{...restProps}
	bind:element
	bind:value
	{selectionPlacement}
	{variants}
	theme={componentTheme ?? (variants.includes('table') ? tableMultiSelectTheme : undefined)}
	class={twMerge(
		$theme.MultiSelect.default,
		...variants.map((variant) => $theme.MultiSelect[variant]),
		className
	)}
/>
