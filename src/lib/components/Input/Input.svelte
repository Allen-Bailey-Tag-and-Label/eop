<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { typeFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Div, Label } from '../';

	type Props = Omit<HTMLAttributes<HTMLInputElement>, 'checked' | 'class' | 'name'> & {
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
		<input
			{...restProps}
			{@attach typeFactory(type)}
			bind:checked
			bind:this={element}
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
		<input
			{...restProps}
			{@attach typeFactory(type)}
			bind:group
			bind:this={element}
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
		<input
			{...restProps}
			{@attach typeFactory(type)}
			bind:this={element}
			bind:value
			class={twMerge(
				$theme.Input.default,
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
