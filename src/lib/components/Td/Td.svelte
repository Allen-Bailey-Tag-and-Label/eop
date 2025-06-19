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

<td
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		'ring-primary-500/0 hover:ring-primary-500 px-6 py-3 ring-1 transition duration-200',
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</td>
