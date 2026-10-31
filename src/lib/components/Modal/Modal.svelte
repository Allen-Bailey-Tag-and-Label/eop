<script module lang="ts">
	const modalDepth = Symbol('modalDepth');
</script>

<script lang="ts">
	import { getContext, setContext, type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { subtleReveal } from 'sveltewind/transitions';
	import { attachmentFactory, focusFirst, focusTrap, portal } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Card, Div, DialogHeader } from '..';

	const depth = getContext<number>(modalDepth) ?? 0;
	setContext(modalDepth, depth + 1);

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		isCloseable?: boolean;
		isOpen?: boolean;
		title?: string;
		titleId?: string;
		closeAriaLabel?: string;
		onDismiss?: () => void;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		isCloseable = $bindable(true),
		isOpen = $bindable(false),
		title,
		titleId,
		closeAriaLabel = 'Close dialog',
		onDismiss,
		style,
		variants = [],
		...restProps
	}: Props = $props();
	function dismiss() {
		if (!isCloseable) return;
		isOpen = false;
		onDismiss?.();
	}
</script>

<Div
	{@attach portal()}
	style={`z-index: ${9999 + depth};`}
	class={twMerge(
		isOpen ? undefined : 'pointer-events-none',
		'flex h-full w-full items-center justify-center px-4 pt-[calc(1rem_+_env(safe-area-inset-top))] pb-[calc(1rem_+_env(safe-area-inset-bottom))] transition duration-200',
		isOpen ? 'bg-black/30 dark:bg-black/70' : 'bg-black/0'
	)}
	inert={isOpen ? undefined : true}
	onclick={dismiss}
>
	{#if isOpen}
		<div class="flex h-full w-full items-center justify-center" transition:subtleReveal|global>
			<Card
				role="dialog"
				aria-modal="true"
				aria-label={title}
				{...restProps}
				{@attach attachmentFactory(attachments)}
				{@attach focusFirst()}
				{@attach focusTrap}
				class={twMerge(
					$theme.Modal.default,
					...variants.map((variant: string) => $theme.Modal[variant]),
					className
				)}
				inert={isOpen ? undefined : true}
				onclick={(e: Event) => e.stopPropagation()}
				onkeydown={(event) => {
					restProps.onkeydown?.(event);
					if (event.key === 'Escape' && !event.defaultPrevented) {
						const popover = (event.target as Element).closest('[popover]');
						if (popover?.matches(':popover-open')) return;
						event.preventDefault();
						event.stopPropagation();
						dismiss();
					}
				}}
				{style}
			>
				<DialogHeader
					{title}
					{titleId}
					{closeAriaLabel}
					disabled={!isCloseable}
					onClose={dismiss}
				/>
				{#if children}
					{@render children()}
				{/if}
			</Card>
		</div>
	{/if}
</Div>
