<script lang="ts">
	import { Input as SveltewindInput } from 'sveltewind/components';
	import { unstyledTheme } from '$lib/theme/sveltewind';
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { Check } from '$lib/icons';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Div, Label } from '../';
	import { scale } from 'svelte/transition';

	type Props = Omit<HTMLInputAttributes, 'checked' | 'class' | 'style'> & {
		attachments?: Attachment[];
		checked?: boolean;
		children?: Snippet;
		class?: string;
		element?: HTMLInputElement | null;
		handle?: Snippet;
		label?: string;
		name?: string;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		checked = $bindable(false),
		children,
		class: className,
		element = $bindable(null),
		handle,
		label,
		name,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if label}
	<Div class="flex w-full flex-col">
		<Label>{label}</Label>
		{@render input()}
	</Div>
{:else}
	{@render input()}
{/if}

{#snippet input()}
	<Label class={twMerge('relative inline-flex items-center', className)} {style}>
		<SveltewindInput
			theme={unstyledTheme}
			{...restProps}
			aria-label={restProps['aria-label'] ?? label}
			{@attach attachmentFactory(attachments)}
			bind:checked
			bind:element
			class="peer sr-only"
			{name}
			type="checkbox"
		/>
		{#if handle}
			{@render handle()}
		{:else}
			<Div
				class={twMerge(
					$theme.Checkbox.default,
					...variants.map((variant: string) => $theme.Checkbox[variant])
				)}
			>
				<Div class={twMerge('text-white transition duration-200')}>
					{#if checked}
						<div transition:scale={{ duration: 200 }}>
							<Check size={16} />
						</div>
					{/if}
				</Div>
			</Div>
		{/if}
	</Label>
{/snippet}
