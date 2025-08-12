<script lang="ts">
	import { type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { theme } from '$lib/theme';
	import { Div, Label, Option } from '../';

	type Props = Omit<HTMLAttributes<HTMLSelectElement>, 'class' | 'value'> & {
		children?: Snippet;
		class?: string;
		element?: HTMLSelectElement | null;
		label?: string;
		options?: { label: string; value: number | string }[];
		value?: number | string;
		variants?: string[];
	} & any;
	let {
		children,
		class: className,
		element = $bindable(null),
		label,
		options = [],
		value = $bindable(),
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if label}
	<Div class="flex w-full flex-col">
		<Label>{label}</Label>
		{@render select()}
	</Div>
{:else}
	{@render select()}
{/if}

{#snippet select()}
	<select
		{...restProps}
		bind:this={element}
		bind:value
		class={twMerge(
			$theme.Select.default,
			...variants.map((variant: string) => $theme.Select[variant]),
			className
		)}
	>
		{#if children}
			{@render children()}
		{:else}
			{#each options as option}
				<Option selected={option.value === value ? true : undefined} value={option.value}>
					{option.label}
				</Option>
			{/each}
		{/if}
	</select>
{/snippet}
