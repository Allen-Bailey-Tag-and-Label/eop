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

<th
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge('bg-slate-50 px-6 py-3 dark:bg-slate-950', className)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</th>
