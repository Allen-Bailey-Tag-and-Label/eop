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
		inputs?: Snippet;
		method?: 'GET' | 'POST';
	};
	let {
		action,
		buttons,
		children,
		class: className,
		inputs,
		method = 'POST',
		...restProps
	}: Props = $props();
</script>

<form
	{action}
	class={twMerge('w-full max-w-sm space-y-12', className)}
	{method}
	use:enhance
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
	{#if inputs}
		<Div class="flex flex-col space-y-6">
			{@render inputs()}
		</Div>
	{/if}
	{#if buttons}
		<Div class="flex flex-col gap-4 md:flex-row [&>*]:flex-grow">
			{@render buttons()}
		</Div>
	{/if}
</form>
