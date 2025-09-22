<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory, focusFirst, focusTrap, portal } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Card, Div } from '..';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		isOpen?: boolean;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		isOpen = $bindable(false),
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<!-- {#if isOpen} -->
<Div
	{@attach portal()}
	class={twMerge(
		isOpen ? undefined : 'pointer-events-none',
		'flex h-full w-full items-center justify-center px-4 pt-[calc(1rem_+_env(safe-area-inset-top))] pb-[calc(1rem_+_env(safe-area-inset-bottom))] transition duration-200',
		isOpen ? 'bg-black/30 dark:bg-black/70' : 'bg-black/0'
	)}
	inert={isOpen ? undefined : true}
	onclick={() => {
		isOpen = false;
	}}
>
	<Card
		{...restProps}
		{@attach attachmentFactory(attachments)}
		{@attach focusFirst()}
		{@attach focusTrap}
		class={twMerge(
			'transition duration-200',
			isOpen ? undefined : 'pointer-events-none',
			isOpen ? 'opacity-100' : 'opacity-0',
			isOpen ? 'scale-100' : 'scale-[.98]',
			$theme.Modal.default,
			...variants.map((variant: string) => $theme.Modal[variant]),
			className
		)}
		inert={isOpen ? undefined : true}
		onclick={(e: Event) => e.stopPropagation()}
		{style}
	>
		{#if children}
			{@render children()}
		{/if}
	</Card>
</Div>
<!-- {/if} -->
