<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

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

<tbody
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Tbody.default,
		...variants.map((variant: string) => $theme.Tbody[variant]),
		className
	)}
>
	{#if children}
		{@render children()}
	{/if}
</tbody>
