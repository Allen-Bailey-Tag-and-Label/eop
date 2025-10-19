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
		target?: '_blank' | '_parent' | '_self' | '_top' | '_unfencedTop';
		variants?: string[];
	};
	let {
		children,
		class: className,
		element = $bindable(null),
		href,
		target,
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
	{target}
>
	{#if children}
		{@render children()}
	{/if}
</a>
