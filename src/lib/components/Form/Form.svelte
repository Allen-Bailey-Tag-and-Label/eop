<script lang="ts">
	import { Form as SveltewindForm } from 'sveltewind/components';
	import { unstyledTheme } from '$lib/theme/sveltewind';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { Snippet } from 'svelte';
	import { fromAction } from 'svelte/attachments';
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
		isLoading?: boolean;
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
		isLoading = $bindable(false),
		method = 'POST',
		submitFunction = () => {
			isLoading = true;
			return async ({ update }) => {
				await update();
				isLoading = false;
			};
		},
		style,
		variants = [],
		...restProps
	}: Props = $props();

	const enhanceForm = (formElement: HTMLFormElement, submit: SubmitFunction) =>
		enhance(formElement, submit);
</script>

<SveltewindForm
	theme={unstyledTheme}
	{...restProps}
	{action}
	class={twMerge(
		$theme.Form.default,
		...variants.map((variant: string) => $theme.Form[variant]),
		className
	)}
	method={method === 'GET' ? 'get' : 'post'}
	{style}
	{@attach method === 'POST' ? fromAction(enhanceForm, () => submitFunction) : undefined}
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
</SveltewindForm>
