<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Booleanish, HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'contenteditable' | 'innerHTML'> & {
		children?: Snippet;
		class?: string;
		contenteditable?: Booleanish | 'inherit' | 'plaintext-only' | null;
		element?: HTMLDivElement | null;
		innerHTML?: string;
		variants?: string[];
	};
	let {
		children,
		class: className,
		contenteditable,
		element = $bindable(null),
		innerHTML = $bindable(),
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if contenteditable}
	<div
		{...restProps}
		bind:innerHTML
		bind:this={element}
		class={twMerge(
			$theme.Div.default,
			...variants.map((variant: string) => $theme.Div[variant]),
			className
		)}
		contenteditable="true"
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{:else}
	<div
		{...restProps}
		bind:this={element}
		class={twMerge(
			$theme.Div.default,
			...variants.map((variant: string) => $theme.Div[variant]),
			className
		)}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
