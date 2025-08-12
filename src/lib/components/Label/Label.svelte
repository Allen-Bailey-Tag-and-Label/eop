<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLLabelElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLLabelElement | null;
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

<label
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Label.default,
		...variants.map((variant: string) => $theme.Label[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</label>
