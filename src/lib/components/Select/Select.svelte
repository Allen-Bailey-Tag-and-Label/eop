<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	import Div from '../Div/Div.svelte';
	import Label from '../Label/Label.svelte';
	import Option from '../Option/Option.svelte';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		label?: string;
		name?: string;
		options: { label: string; value: number | string }[];
		required?: boolean;
		style?: string;
		variants?: string[];
		value?: number | string;
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		label,
		name,
		options,
		required,
		style,
		value = $bindable(),
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if label}
	<Div class="flex w-full flex-col">
		<Label>{label}</Label>
		{@render select()}
	</Div>
{:else}
	{@render select()}
{/if}

{#snippet select()}
	<select
		{...restProps}
		{@attach attachmentFactory(attachments)}
		bind:value
		class={twMerge(
			$themeStore.Select.default,
			...variants.map((variant: string) => $themeStore.Select[variant]),
			className
		)}
		{name}
		{required}
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
{/snippet}
