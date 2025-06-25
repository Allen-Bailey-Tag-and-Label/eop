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
		href?: string;
		style?: string;
		tabIndex?: string;
		variants?: string[];
	} & any;
	let {
		attachments = $bindable([]),
		children,
		class: className,
		href = '#',
		style,
		tabIndex,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<a
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		$themeStore.A.default,
		...variants.map((variant: string) => $themeStore.A[variant]),
		className
	)}
	{href}
	{tabIndex}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</a>
