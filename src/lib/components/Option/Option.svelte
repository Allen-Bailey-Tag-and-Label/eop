<script lang="ts">
	import { type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAttributes<HTMLOptionElement>, 'class' | 'selected' | 'value'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLOptionElement | null;
		selected?: boolean;
		value?: number | string;
		variants?: string[];
	};
	let {
		children,
		class: className,
		element = $bindable(null),
		selected,
		value,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<option
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Option.default,
		...variants.map((variant: string) => $theme.Option[variant]),
		className
	)}
	{selected}
	{value}
>
	{#if children}
		{@render children()}
	{/if}
</option>
