<script lang="ts">
	import { theme } from '$lib/theme';
	import { X } from '@lucide/svelte';
	import { Button, Div, H2 } from '$lib/components';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'class'> & {
		title?: string;
		titleId?: string;
		closeAriaLabel?: string;
		disabled?: boolean;
		onClose: () => void;
		class?: string;
		variants?: string[];
	};
	let {
		title,
		titleId,
		closeAriaLabel = 'Close dialog',
		disabled = false,
		onClose,
		class: className,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div
	{...restProps}
	class={twMerge(
		$theme.Modal.header,
		...variants.map((variant) => $theme.Modal[variant]),
		className
	)}
>
	{#if title}<H2 id={titleId} class="text-lg">{title}</H2>{:else}<span></span>{/if}
	<Button
		variants={['ghost', 'icon']}
		class="shrink-0"
		aria-label={closeAriaLabel}
		{disabled}
		onclick={onClose}><X size={18} /></Button
	>
</Div>
