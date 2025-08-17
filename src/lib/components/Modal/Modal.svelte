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

{#if isOpen}
	<Div
		{@attach portal()}
		class="flex h-full w-full items-center justify-center px-4 pt-[calc(1rem_+_env(safe-area-inset-top))] pb-[calc(1rem_+_env(safe-area-inset-bottom))] backdrop-blur-md"
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
				$theme.Modal.default,
				...variants.map((variant: string) => $theme.Modal[variant]),
				className
			)}
			onclick={(e: Event) => e.stopPropagation()}
			{style}
		>
			{#if children}
				{@render children()}
			{/if}
		</Card>
	</Div>
{/if}
