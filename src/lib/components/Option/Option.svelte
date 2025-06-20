<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		selected?: boolean;
		style?: string;
		value: string | number;
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		selected,
		style,
		value,
		...restProps
	}: Props = $props();
</script>

<option
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge('', className)}
	{selected}
	{style}
	{value}
>
	{#if children}
		{@render children()}
	{/if}
</option>
