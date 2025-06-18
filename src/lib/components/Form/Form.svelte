<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Div } from '../';
	import { enhance } from '$app/forms';

	type Props = {
		action?: string;
		buttons?: Snippet;
		children?: Snippet;
		class?: string;
		error?: Snippet;
		form?: any;
		inputs?: Snippet;
		method?: 'GET' | 'POST';
		style?: string;
	};
	let {
		action,
		buttons,
		children,
		class: className,
		error,
		form,
		inputs,
		method = 'POST',
		style,
		...restProps
	}: Props = $props();
</script>

<form
	{action}
	class={twMerge('w-full max-w-sm space-y-12', className)}
	{method}
	{style}
	use:enhance
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
	{#if inputs}
		<Div class="flex flex-col space-y-6">
			{@render inputs()}
			{#if error}
				<Div class="text-red-500 min-h-6">
					{@render error()}
				</Div>
			{/if}
		</Div>
	{/if}
	{#if buttons}
		<Div class="flex flex-col gap-4 md:flex-row [&>*]:flex-grow">
			{@render buttons()}
		</Div>
	{/if}
</form>
