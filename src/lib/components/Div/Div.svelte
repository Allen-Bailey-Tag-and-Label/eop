<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		style?: string;
	} & any;
	let {
		attachments = $bindable([]),
		children,
		class: className,
		style,
		...restProps
	}: Props = $props();
</script>

<div {...restProps} {@attach attachmentFactory(attachments)} class={twMerge('', className)} {style}>
	{#if children}
		{@render children()}
	{/if}
</div>
