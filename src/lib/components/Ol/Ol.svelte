<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLOListElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLOListElement | null;
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

<ol
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:this={element}
	class={twMerge(
		$theme.Ol.default,
		...variants.map((variant: string) => $theme.Ol[variant]),
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</ol>
