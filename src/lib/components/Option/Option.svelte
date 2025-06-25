<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		selected?: boolean;
		style?: string;
		variants?: string[];
		value: string | number;
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		selected,
		style,
		variants = [],
		value,
		...restProps
	}: Props = $props();
</script>

<option
	{...restProps}
	{@attach attachmentFactory(attachments)}
	class={twMerge(
		$themeStore.Option.default,
		...variants.map((variant: string) => $themeStore.Option[variant]),
		className
	)}
	{selected}
	{style}
	{value}
>
	{#if children}
		{@render children()}
	{/if}
</option>
