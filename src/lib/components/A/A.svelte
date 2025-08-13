<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLAnchorElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLAnchorElement | null;
		href?: string;
		variants?: string[];
	};
	let {
		children,
		class: className,
		element = $bindable(null),
		href,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<a
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.A.default,
		...variants.map((variant: string) => $theme.A[variant]),
		className
	)}
	{href}
>
	{#if children}
		{@render children()}
	{/if}
</a>
