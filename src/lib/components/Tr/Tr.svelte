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

<tr
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		'hover:bg-primary-500/30 dark:hover:bg-primary-500/30 even:hover:bg-primary-500/30 even:dark:hover:bg-primary-500/30 transition duration-200 even:bg-slate-50/30 dark:even:bg-slate-50/10',
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</tr>
