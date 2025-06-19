<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';

	type Props = { attachments?: Attachment[]; children?: Snippet; class?: string; style?: string };
	let {
		attachments = $bindable([]),
		children,
		class: className,
		style,
		...restProps
	}: Props = $props();
</script>

<div
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		'flex flex-col rounded-sm bg-slate-50/30 p-6 backdrop-blur-md transition duration-200 dark:bg-slate-50/10',
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</div>
