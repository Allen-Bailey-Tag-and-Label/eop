<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLButtonElement>, 'class' | 'disabled'> & {
		children?: Snippet;
		class?: string;
		disabled?: boolean;
		element?: HTMLButtonElement | null;
		formaction?: string;
		type?: 'button' | 'submit';
		variants?: string[];
	};
	let {
		children,
		class: className,
		disabled,
		element = $bindable(null),
		formaction,
		type = 'button',
		variants = [],
		...restProps
	}: Props = $props();
</script>

<button
	{...restProps}
	bind:this={element}
	class={twMerge(
		$theme.Button.default,
		...variants.map((variant: string) => $theme.Button[variant]),
		disabled ? $theme.Button.disabled : undefined,
		className
	)}
	{disabled}
	{formaction}
	{type}
>
	{#if children}
		{@render children()}
	{/if}
</button>
