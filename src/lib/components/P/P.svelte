<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLParagraphElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLParagraphElement | null;
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

<p
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.P.default,
		...variants.map((variant: string) => $theme.P[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</p>
