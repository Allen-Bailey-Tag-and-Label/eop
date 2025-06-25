<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		contenteditable?: boolean | '';
		innerHTML?: string;
		style?: string;
	} & any;
	let {
		attachments = $bindable([]),
		children,
		class: className,
		contenteditable,
		innerHTML = $bindable(),
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if contenteditable === '' || contenteditable}
	<div
		{...restProps}
		{@attach attachmentFactory(attachments)}
		bind:innerHTML
		class={twMerge(
			$themeStore.Div.default,
			...variants.map((variant: string) => $themeStore.Div[variant]),
			className
		)}
		contenteditable=""
		{style}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{:else}
	<div
		{...restProps}
		{@attach attachmentFactory(attachments)}
		class={twMerge(
			$themeStore.Div.default,
			...variants.map((variant: string) => $themeStore.Div[variant]),
			className
		)}
		{style}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
