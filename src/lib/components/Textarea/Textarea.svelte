<script lang="ts">
	import { Textarea as SveltewindTextarea } from 'sveltewind/components';
	import { unstyledTheme } from '$lib/theme/sveltewind';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Div, Label } from '..';

	type Props = Omit<HTMLAttributes<HTMLTextAreaElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLTextAreaElement | null;
		label?: string;
		name?: string;
		style?: string;
		value?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		label,
		name,
		style,
		value = $bindable(''),
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if label}
	<Div class="flex w-full flex-col">
		<Label>{label}</Label>
		{@render textarea()}
	</Div>
{:else}
	{@render textarea()}
{/if}

{#snippet textarea()}
	<SveltewindTextarea
		theme={unstyledTheme}
		{...restProps}
		{@attach attachmentFactory(attachments)}
		bind:element
		bind:value
		class={twMerge(
			$theme.Textarea.default,
			...variants.map((variant: string) => $theme.Textarea[variant]),
			className
		)}
		{name}
		{style}
	></SveltewindTextarea>
{/snippet}
