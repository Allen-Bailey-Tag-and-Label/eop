<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAttributes<HTMLTableSectionElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLTableSectionElement | null;
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

<thead
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Thead.default,
		...variants.map((variant: string) => $theme.Thead[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</thead>
