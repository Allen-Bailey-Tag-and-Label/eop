<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Div, Label, Input } from '../';

	type Props = Omit<HTMLAttributes<HTMLInputElement>, 'class'> & {
		class?: string;
		defaultValue?: string;
		element?: HTMLInputElement | null;
		formatValue?: (v: string) => string;
		isValueVisible?: boolean;
		label?: string;
		name?: string;
		value?: string;
		variants?: string[];
	};

	let {
		class: className,
		defaultValue,
		element = $bindable(null),
		formatValue = (v: string) => v,
		isValueVisible = true,
		label,
		name,
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
			bind:element
			bind:value
			class={twMerge($theme.RangeInput.default, className)}
			{defaultValue}
			{name}
			type="range"
		/>
		{#if isValueVisible}
			<Div>{formatValue(value)}</Div>
		{/if}
	</Div>
{/snippet}
