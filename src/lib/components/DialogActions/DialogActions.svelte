<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import Button from '../Button/Button.svelte';
	import Div from '../Div/Div.svelte';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		onClose?: () => void;
		closeLabel?: string;
		variants?: string[];
	};
	let {
		children,
		class: className,
		onClose,
		closeLabel = 'Close',
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div
	role="group"
	aria-label="Dialog actions"
	{...restProps}
	class={twMerge(
		$theme.Modal.actions,
		...variants.map((variant) => $theme.Modal[variant]),
		className
	)}
>
	{#if onClose}<Button variants={['ghost']} onclick={onClose}>{closeLabel}</Button>{/if}
	{#if children}{@render children()}{/if}
</Div>
