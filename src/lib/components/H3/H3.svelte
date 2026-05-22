<script lang="ts">
	import { type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAttributes<HTMLHeadingElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLHeadingElement | null;
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

<h3
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.H3.default,
		...variants.map((variant: string) => $theme.H3[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</h3>
