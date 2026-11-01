<script lang="ts">
	import { Input as SveltewindInput } from 'sveltewind/components';
	import { unstyledTheme } from '$lib/theme/sveltewind';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { getContext } from 'svelte';
	import { numberScrub, numberScrubContext } from '$lib/attachments/numberScrub';
	import { Div, Label } from '../';
	const scrubNumbers = getContext<boolean>(numberScrubContext) ?? false;

	type Props = Omit<HTMLInputAttributes, 'checked' | 'class' | 'name'> & {
		checked?: boolean;
		children?: Snippet;
		class?: string;
		defaultValue?: string;
		element?: HTMLInputElement | null;
		group?: string;
		label?: string;
		max?: number;
		min?: number;
		name?: string;
		readonly?: boolean;
		required?: boolean;
		step?: number;
		type?:
			| 'button'
			| 'checkbox'
			| 'color'
			| 'date'
			| 'datetime-local'
			| 'email'
			| 'file'
			| 'hidden'
			| 'image'
			| 'month'
			| 'number'
			| 'password'
			| 'radio'
			| 'range'
			| 'reset'
			| 'search'
			| 'submit'
			| 'tel'
			| 'text'
			| 'time'
			| 'url'
			| 'week';
		value?: string;
		variants?: string[];
	};

	let {
		checked = $bindable(false),
		children,
		class: className,
		defaultValue,
		element = $bindable(null),
		group = $bindable(''),
		label,
		max,
		min,
		name,
		readonly,
		required,
		step,
		style,
		type = 'text',
		value = $bindable(''),
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
	{#if type === 'checkbox'}
		<SveltewindInput
			theme={unstyledTheme}
			{...restProps}
			bind:checked
			bind:element
			class={twMerge(
				$theme.Input.default,
				...variants.map((variant: string) => $theme.Input[variant]),
				className
			)}
			{defaultValue}
			{name}
			{readonly}
			{required}
			type="checkbox"
		/>
	{:else if type === 'radio'}
		<SveltewindInput
			theme={unstyledTheme}
			{...restProps}
			bind:group
			bind:element
			class={twMerge(
				$theme.Input.default,
				...variants.map((variant: string) => $theme.Input[variant]),
				className
			)}
			{defaultValue}
			{name}
			{readonly}
			{required}
			type="radio"
			{value}
		/>
	{:else}
		<SveltewindInput
			{@attach type === 'number' && scrubNumbers ? numberScrub : undefined}
			theme={unstyledTheme}
			{...restProps}
			bind:element
			bind:value
			{type}
			class={twMerge(
				$theme.Input.default,
				type === 'color' ? $theme.Input.color : undefined,
				...variants.map((variant: string) => $theme.Input[variant]),
				className
			)}
			{defaultValue}
			{max}
			{min}
			{name}
			{readonly}
			{required}
			{step}
		/>
	{/if}
{/snippet}
