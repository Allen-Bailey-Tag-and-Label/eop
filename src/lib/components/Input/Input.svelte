<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Eye, EyeOff, Icon } from '$lib/icons';
	import { Button, Div, Label } from '../';

	type Props = {
		children?: Snippet;
		class?: string;
		isPasswordButtonVisible?: boolean;
		label?: string;
		name?: string;
		required?: boolean;
		type?: 'password' | 'text';
		value?: string;
	};
	let {
		children,
		class: className,
		isPasswordButtonVisible = false,
		label,
		name,
		required,
		type = 'text',
		value,
		...restProps
	}: Props = $props();

	const passwordTypeButtonClickHandler = () =>
		type === 'text' ? (type = 'password') : (type = 'text');
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
	<Div class="relative w-full">
		<input
			class={twMerge(
				'outline-primary-500/0 focus:outline-primary-500 w-full rounded-sm bg-slate-50/30 p-3 outline-1 backdrop-blur-md transition duration-200 hover:outline-gray-400 focus:outline-2 dark:bg-slate-50/10',
				className
			)}
			{name}
			{required}
			{type}
			{value}
			{...restProps}
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
{/snippet}
