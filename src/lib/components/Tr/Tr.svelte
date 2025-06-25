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
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<tr
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		$themeStore.Tr.default,
		...variants.map((variant: string) => $themeStore.Tr[variant]),
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</tr>
