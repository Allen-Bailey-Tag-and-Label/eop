<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAttributes<HTMLTableCellElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		colspan?: number;
		element?: HTMLTableCellElement | null;
		variants?: string[];
	};
	let {
		children,
		class: className,
		colspan,
		element = $bindable(null),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<td
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Td.default,
		...variants.map((variant: string) => $theme.Td[variant]),
		className
	)}
	{colspan}
>
	{#if children}
		{@render children()}
	{/if}
</td>
