<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory, focusTrap } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';

	import Div from '../Div/Div.svelte';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		elem?: HTMLDialogElement;
		open?: boolean;
		style?: string;
		variants?: string[];
	} & any;
	let {
		attachments = $bindable([focusTrap]),
		children,
		class: className,
		elem = $bindable(),
		open = $bindable(false),
		style, 
		variants = [],
		...restProps
	}: Props = $props();

	onMount(() => {
		if (!elem) return;

		if (open) elem.showModal();
		if (!open) elem.close();

		const eventCancel = elem.addEventListener('cancel', () => (open = false));
		const eventClose = elem.addEventListener('close', () => (open = false));

		return () => {
			elem.removeEventListener('cancel', eventCancel);
			elem.removeEventListener('close', eventClose);
		};
	});

	$effect(() => {
		if (open) elem.showModal();
		if (!open) elem.close();
	});
</script>

<dialog
	{...restProps}
	{@attach attachmentFactory(attachments)}
	bind:this={elem}
	class={twMerge(
		$themeStore.Dialog.default,
		...variants.map((variant: string) => $themeStore.Dialog[variant]),
		className
	)}
	onclick={(event) => {
		if (event.target === elem) open = false;
	}}
	{style}
>
	{#if children}
		<Div class="flex items-center justify-center w-full h-full pointer-events-none">
			<Div class="pointer-events-auto">
				{@render children()}
			</Div>
		</Div>
	{/if}
</dialog>
