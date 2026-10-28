<script lang="ts">
	import { Ul as SveltewindUl } from 'sveltewind/components';
	import { unstyledTheme } from '$lib/theme/sveltewind';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLUListElement | null;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<SveltewindUl
	theme={unstyledTheme}
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:element
	class={twMerge(
		$theme.Ul.default,
		...variants.map((variant: string) => $theme.Ul[variant]),
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</SveltewindUl>
