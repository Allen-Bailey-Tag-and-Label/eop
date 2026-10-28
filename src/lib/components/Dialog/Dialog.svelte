<script lang="ts">
	import { Dialog as SveltewindDialog } from 'sveltewind/components';
	import { subtleReveal } from 'sveltewind/transitions';
	import { unstyledTheme } from '$lib/theme/sveltewind';
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Div } from '../';

	type Props = Omit<HTMLAttributes<HTMLDialogElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLDialogElement | null;
		open?: boolean;
		variants?: string[];
	};
	let {
		children,
		class: className,
		element = $bindable(null),
		open = $bindable(false),
		oncancel,
		onclose,
		variants = [],
		...restProps
	}: Props = $props();

	// The package handles visibility; preserve application callbacks alongside its handlers.
	const forwardEvents: Attachment<HTMLDialogElement> = (node) => {
		const cancel = (event: Event) =>
			oncancel?.(event as Event & { currentTarget: HTMLDialogElement });
		const close = (event: Event) =>
			onclose?.(event as Event & { currentTarget: HTMLDialogElement });
		node.addEventListener('cancel', cancel);
		node.addEventListener('close', close);
		return () => {
			node.removeEventListener('cancel', cancel);
			node.removeEventListener('close', close);
		};
	};
</script>

<SveltewindDialog
	theme={unstyledTheme}
	transition={[subtleReveal, {}]}
	bind:isVisible={open}
	{...restProps}
	{@attach forwardEvents}
	bind:element
	class={twMerge(
		$theme.Dialog.default,
		...variants.map((variant: string) => $theme.Dialog[variant]),
		className
	)}
	onclick={(event) => {
		if (event.target === element) open = false;
	}}
>
	{#if children}
		<Div
			class="pointer-events-none flex h-full max-h-screen w-full max-w-screen items-center justify-center overflow-auto"
		>
			<Div class="pointer-events-auto flex max-h-full max-w-full flex-col overflow-auto p-4">
				{@render children()}
			</Div>
		</Div>
	{/if}
</SveltewindDialog>
