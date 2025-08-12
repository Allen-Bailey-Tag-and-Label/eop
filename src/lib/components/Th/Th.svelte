<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAttributes<HTMLTableCellElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLTableCellElement | null;
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

<th
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Th.default,
		...variants.map((variant: string) => $theme.Th[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</th>
