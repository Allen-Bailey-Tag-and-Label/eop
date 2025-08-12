<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Div } from '../';

	type Props = Omit<HTMLAttributes<HTMLDialogElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLDialogElement;
		open?: boolean;
		variants?: string[];
	};
	let {
		children,
		class: className,
		element = $bindable(),
		open = $bindable(false),
		variants = [],
		...restProps
	}: Props = $props();

	onMount(() => {
		if (!element) return;

		if (open) element.showModal();
		if (!open) element.close();

		const eventCancel = element?.addEventListener('cancel', () => (open = false)) ?? (() => {});
		const eventClose = element?.addEventListener('close', () => (open = false)) ?? (() => {});

		return () => {
			if (element) {
				element.removeEventListener('cancel', eventCancel);
				element.removeEventListener('close', eventClose);
			}
		};
	});

	$effect(() => {
		if (element) {
			if (open) element.showModal();
			if (!open) element.close();
		}
	});
</script>

<dialog
	{...restProps}
	bind:this={element}
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
</dialog>
