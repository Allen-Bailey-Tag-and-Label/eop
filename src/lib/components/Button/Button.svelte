<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		disabled?: boolean;
		style?: string;
		tabIndex?: string;
		type?: 'button' | 'submit';
		variants?: string[];
	} & any;
	let {
		attachments = $bindable([]),
		children,
		class: className,
		disabled,
		style,
		tabIndex,
		type = 'button',
		variants = [],
		...restProps
	}: Props = $props();
</script>

<button
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		$themeStore.Button.default,
		...variants.map((variant: string) => $themeStore.Button[variant]),
		disabled ? $themeStore.Button.disabled : undefined,
		className
	)}
	{disabled}
	{style}
	{tabIndex}
	{type}
>
	{#if children}
		{@render children()}
	{/if}
</button>
