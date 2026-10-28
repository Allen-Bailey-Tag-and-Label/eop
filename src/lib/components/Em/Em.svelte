<script lang="ts">
	import { Em as SveltewindEm } from 'sveltewind/components';
	import { unstyledTheme } from '$lib/theme/sveltewind';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLElement | null;
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

<SveltewindEm
	theme={unstyledTheme}
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:element
	class={twMerge(
		$theme.Em.default,
		...variants.map((variant: string) => $theme.Em[variant]),
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</SveltewindEm>
