<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLElement | null;
		variants?: string[];
	};
	let {
		children,
		class: className,
		element = $bindable(null),
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<header
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Header.default,
		...variants.map((variant: string) => $theme.Header[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</header>
