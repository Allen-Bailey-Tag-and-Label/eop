<script lang="ts">
	import { MultiSelect as SveltewindMultiSelect } from 'sveltewind/components';
	import type { ComponentProps } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = ComponentProps<typeof SveltewindMultiSelect>;
	let {
		class: className,
		element = $bindable(null),
		selectionPlacement = 'inline',
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
	class={twMerge(
		$theme.MultiSelect.default,
		...variants.map((variant) => $theme.MultiSelect[variant]),
		className
	)}
/>
