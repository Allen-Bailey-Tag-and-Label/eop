<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	import Option from '../Option/Option.svelte';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		options: { label: string; value: number | string }[];
		style?: string;
		variants?: string[];
		value?: number | string;
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		options,
		style,
		value = $bindable(),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<select
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:value
	class={twMerge(
		$themeStore.Select.default,
		...variants.map((variant: string) => $themeStore.Select[variant]),
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{:else}
		{#each options as option}
			<Option selected={option.value === value ? true : undefined} value={option.value}>
				{option.label}
			</Option>
		{/each}
	{/if}
</select>
