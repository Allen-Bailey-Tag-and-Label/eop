<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Div, Input, Label } from '..';

	type Props = Omit<HTMLAttributes<HTMLInputElement>, 'class' | 'group' | 'style' | 'value'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLInputElement | null;
		handle?: Snippet;
		group?: any;
		label?: string;
		style?: string;
		value?: any;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		handle,
		group = $bindable(''),
		label,
		style,
		value,
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
			$theme.Radio.default,
			...variants.map((variant: string) => $theme.Radio[variant]),
			className
		)}
	>
		<Input
			{...restProps}
			{@attach attachmentFactory(attachments)}
			bind:element
			bind:group
			class="peer sr-only absolute h-0 w-0"
			{value}
			type="radio"
		/>
		{#if handle}
			{@render handle()}
			{#if children}
				<Div>
					{@render children()}
				</Div>
			{/if}
		{:else}
			<Div
				class="bg-primary-500/0 peer-checked:bg-primary-500 peer-checked:outline-primary-500 relative flex h-6 w-6 items-center justify-center rounded-full outline outline-gray-200 transition duration-200 dark:outline-gray-700"
			>
				<Div
					class={twMerge(
						'h-2/5 w-2/5 rounded-full bg-gray-50/0 transition duration-200 dark:bg-gray-950/0',
						group === value ? 'bg-gray-50 dark:bg-gray-950' : undefined
					)}
				/>
			</Div>
			{#if children}
				<Div>
					{@render children()}
				</Div>
			{/if}
		{/if}
	</Label>
{/snippet}
