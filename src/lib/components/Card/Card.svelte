<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLDivElement | null;
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

<div
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Card.default,
		...variants.map((variant: string) => $theme.Card[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</div>
