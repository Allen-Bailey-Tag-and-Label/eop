<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAttributes<HTMLTableRowElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLTableRowElement | null;
		variants?: string[];
	};
	let {
		children,
		class: className,
		element = $bindable(null),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<tr
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Tr.default,
		...variants.map((variant: string) => $theme.Tr[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</tr>
