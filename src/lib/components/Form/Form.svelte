<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { enhance } from '$app/forms';
	import { theme } from '$lib/theme';
	import { Div } from '../';

	type Props = Omit<HTMLAttributes<HTMLFormElement>, 'class' | 'style'> & {
		action?: string;
		buttons?: Snippet;
		children?: Snippet;
		class?: string;
		error?: Snippet;
		form?: any;
		inputs?: Snippet;
		method?: 'GET' | 'POST';
		submitFunction?: SubmitFunction;
		style?: string;
		variants?: string[];
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
		submitFunction = () => {
			return async ({ update }) => await update();
		},
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<form
	{...restProps}
	{action}
	class={twMerge(
		$theme.Form.default,
		...variants.map((variant: string) => $theme.Form[variant]),
		className
	)}
	{method}
	{style}
	use:enhance={submitFunction}
>
	{#if children}
		{@render children()}
	{/if}
	{#if inputs}
		<Div class="flex flex-col space-y-6">
			{@render inputs()}
			{#if error}
				<Div class="min-h-6 text-red-500">
					{@render error()}
				</Div>
			{/if}
		</Div>
	{/if}
	{#if buttons}
		<Div class="flex flex-col space-y-4 md:flex-row md:justify-end md:space-y-0 md:space-x-2">
			{@render buttons()}
		</Div>
	{/if}
</form>
