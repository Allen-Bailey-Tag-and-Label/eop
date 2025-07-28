<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import Div from '../Div/Div.svelte';
	import Label from '../Label/Label.svelte';
	import Input from '../Input/Input.svelte';
	import { theme as themeStore } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';

	type Props = {
		attachments?: Attachment[];
		class?: string;
		formatValue?: (v: string) => string;
		isValueVisible?: boolean;
		label?: string;
		max?: string;
		min?: string;
		name?: string;
		required?: boolean;
		step?: string;
		style?: string;
		value?: string;
		variants?: string[];
	} & any;

	let {
		attachments = $bindable([]),
		class: className,
		formatValue = (v: string) => v,
		isValueVisible = true,
		label,
		max,
		min,
		name,
		required,
		step,
		style,
		value = $bindable('0'),
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if label}
	<Div class="flex w-full flex-col">
		<Label>{label}</Label>
		{@render input()}
	</Div>
{:else}
	{@render input()}
{/if}

{#snippet input()}
	<Div class="flex items-center space-x-2">
		<Input
			{...restProps}
			{@attach attachmentFactory(attachments)}
			bind:value
			class={twMerge($themeStore.RangeInput.default, className)}
			{max}
			{min}
			{name}
			{step}
			type="range"
		/>
		{#if isValueVisible}
			<Div>{formatValue(value)}</Div>
		{/if}
	</Div>
{/snippet}
