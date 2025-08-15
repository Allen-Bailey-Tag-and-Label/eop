<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { Check } from '$lib/icons';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Div, Label, Input } from '../';

	type Props = Omit<HTMLAttributes<HTMLInputElement>, 'checked' | 'class' | 'style'> & {
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
	<Label
		class={twMerge(
			$theme.Checkbox.default,
			...variants.map((variant: string) => $theme.Checkbox[variant]),
			className
		)}
		{style}
	>
		<Input
			{...restProps}
			{@attach attachmentFactory(attachments)}
			bind:checked
			bind:element
			class="peer sr-only absolute h-0 w-0"
			{name}
			type="checkbox"
		/>
		{#if handle}
			{@render handle()}
		{:else}
			<Div
				class="peer-checked:bg-primary-500 peer-checked:outline-primary-500 peer-focus:outline-primary-500 flex h-6 w-6 items-center justify-center rounded px-0 py-0 outline outline-current transition duration-200 peer-focus:outline-2"
			>
				<Div
					class={twMerge('text-white transition duration-200', checked ? 'scale-100' : 'scale-0')}
				>
					<Check size={16} />
				</Div>
			</Div>
		{/if}
	</Label>
{/snippet}
