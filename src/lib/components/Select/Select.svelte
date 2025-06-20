<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';

	import Option from '../Option/Option.svelte';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		options: { label: string; value: number | string }[];
		style?: string;
		value?: number | string;
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		options,
		style,
		value = $bindable(),
		...restProps
	}: Props = $props();
</script>

<select
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:value
	class={twMerge(
		'outline-primary-500/0 focus:outline-primary-500 rounded-sm bg-slate-50/30 p-3 outline-1 backdrop-blur-md transition duration-200 hover:outline-gray-400 focus:outline-2 dark:bg-slate-50/10',
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
