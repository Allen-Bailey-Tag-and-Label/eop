<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory, typeFactory } from '$lib/attachments';
	import { Eye, EyeOff } from '$lib/icons';

	import Button from '../Button/Button.svelte';
	import Div from '../Div/Div.svelte';
	import Label from '../Label/Label.svelte';

	type Props = {
		attachments?: Attachment[];
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
	};

	const defaultClasses =
		'outline-primary-500/0 focus:outline-primary-500 w-full rounded-sm bg-slate-50/30 p-3 outline-1 backdrop-blur-md transition duration-200 hover:outline-gray-400 focus:outline-2 dark:bg-slate-50/10';
	const passwordTypeButtonClickHandler = () =>
		type === 'text' ? (type = 'password') : (type = 'text');
	let {
		attachments = $bindable([]),
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
			bind:checked
			class={twMerge(defaultClasses, className)}
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
				class={twMerge(defaultClasses, className)}
				{name}
				{required}
				{style}
				{value}
			/>
			{#if isPasswordButtonVisible}
				<Button
					class="absolute top-0 right-3"
					isIcon={true}
					onclick={passwordTypeButtonClickHandler}
					theme="ghost"
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
			class={twMerge(defaultClasses, className)}
			{name}
			{required}
			{style}
			{value}
		/>
	{/if}
{/snippet}
