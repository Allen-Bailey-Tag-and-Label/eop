<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory, typeFactory } from '$lib/attachments';
	import { Eye, EyeOff } from '$lib/icons';
	import { theme as themeStore } from '$lib/theme';

	import Button from '../Button/Button.svelte';
	import Div from '../Div/Div.svelte';
	import Label from '../Label/Label.svelte';

	type Props = {
		attachments?: Attachment[];
		autoFocus?: boolean;
		checked?: boolean;
		children?: Snippet;
		class?: string;
		isPasswordButtonVisible?: boolean;
		label?: string;
		name?: string;
		required?: boolean;
		style?: string;
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
	} & any;

	const passwordTypeButtonClickHandler = () =>
		type === 'text' ? (type = 'password') : (type = 'text');
	let {
		attachments = $bindable([]),
		autoFocus = $bindable(),
		checked = $bindable(),
		children,
		class: className,
		isPasswordButtonVisible = false,
		label,
		name,
		required,
		style,
		type = 'text',
		value = $bindable(),
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
			{@attach attachmentFactory(attachments)}
			{autoFocus}
			bind:checked
			class={twMerge(
				$themeStore.Input.default,
				...variants.map((variant: string) => $themeStore.Input[variant]),
				className
			)}
			{name}
			{required}
			{style}
			type="checkbox"
			{value}
		/>
	{:else if type === 'password'}
		<Div class="relative w-full">
			<input
				{...restProps}
				{@attach typeFactory(type)}
				{@attach attachmentFactory(attachments)}
				{autoFocus}
				bind:value
				class={twMerge(
					'w-full',
					$themeStore.Input.default,
					...variants.map((variant: string) => $themeStore.Input[variant]),
					className
				)}
				{name}
				{required}
				{style}
			/>
			{#if isPasswordButtonVisible}
				<Button
					class="absolute top-0 right-3"
					onclick={passwordTypeButtonClickHandler}
					variants={['ghost', 'icon']}
				>
					{#if type === 'password'}
						<EyeOff />
					{:else}
						<Eye />
					{/if}
				</Button>
			{/if}
		</Div>
	{:else}
		<input
			{...restProps}
			{@attach typeFactory(type)}
			{@attach attachmentFactory(attachments)}
			{autoFocus}
			bind:value
			class={twMerge(
				$themeStore.Input.default,
				...variants.map((variant: string) => $themeStore.Input[variant]),
				className
			)}
			{name}
			{required}
			{style}
		/>
	{/if}
{/snippet}
