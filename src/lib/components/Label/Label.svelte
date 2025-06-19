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

<label
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge('font-semibold', className)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</label>
