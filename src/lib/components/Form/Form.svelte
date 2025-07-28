<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import type { Attachment } from 'svelte/attachments';
	import { enhance } from '$app/forms';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	import Div from '../Div/Div.svelte';
	import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

	type Props = {
		attachments?: Attachment[];
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
		attachments = $bindable([]),
		buttons,
		children,
		class: className,
		error,
		form,
		inputs,
		method = 'POST',
		submitFunction = ({ action, cancel, formData, formElement, submitter }) => {
			return async ({ update }) => await update();
		},
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<form
	{...restProps}
	{@attach attachmentFactory(attachments)}
	{action}
	class={twMerge(
		$themeStore.Form.default,
		...variants.map((variant: string) => $themeStore.Form[variant]),
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
