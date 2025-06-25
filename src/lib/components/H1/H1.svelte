<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
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

<h1
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge('block text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white', className)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</h1>
