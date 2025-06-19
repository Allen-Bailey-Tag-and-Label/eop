<script lang="ts">
	import type { Snippet } from 'svelte';
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

<thead
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		'border-b border-slate-50/100 bg-slate-50/30 dark:border-slate-50/30 dark:bg-slate-50/10',
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</thead>
