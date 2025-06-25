<script lang="ts">
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import type { Attachment } from 'svelte/attachments';
	import { enhance } from '$app/forms';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	import Div from '../Div/Div.svelte';

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
	use:enhance
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
		<Div class="flex flex-col gap-4 md:flex-row [&>*]:flex-grow">
			{@render buttons()}
		</Div>
	{/if}
</form>
