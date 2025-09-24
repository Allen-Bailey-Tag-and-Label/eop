<script lang="ts">
	import { ChevronDown, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { focusFirst, focusTrap, portal } from '$lib/attachments';
	import { theme } from '$lib/theme';
	import { Button, Card, Checkbox, Div, Input, Label } from '..';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = Omit<HTMLAttributes<HTMLButtonElement>, 'class'> & {
		children?: Snippet;
		class?: string;
		dropDown?: Snippet;
		element?: any;
		isOpen?: boolean;
		label?: string;
		name?: string;
		onclick?: (e: Event) => void;
		options?: { label: string; value: any }[];
		placeholder?: string;
		value?: any[];
		variants?: string[];
	};

	let {
		children,
		class: className,
		dropDown,
		element = $bindable(null),
		isOpen = $bindable(false),
		label,
		name,
		onclick = (e: Event) => {
			e.stopPropagation();
			isOpen = !isOpen;
		},
		options = $bindable([]),
		placeholder = $bindable('Select Options...'),
		value = $bindable([]),
		variants = $bindable([]),
		...restProps
	}: Props = $props();
</script>

{#if label}
	<Div class="flex w-full flex-col">
		<Label>{label}</Label>
		{@render multiSelect()}
	</Div>
{:else}
	{@render multiSelect()}
{/if}

{#snippet multiSelect()}
	<Button
		{...restProps}
		bind:element
		class={twMerge(
			$theme.MultiSelect.default,
			...variants.map((variant: string) => $theme.MultiSelect[variant]),
			isOpen ? $theme.MultiSelect.isOpen : undefined,
			className
		)}
		{onclick}
	>
		{#if children}
			{@render children()}
		{:else}
			<Div class="flex flex-grow">
				{placeholder}
			</Div>
			{#if value.length > 0}
				<Div
					class={twMerge(
						$theme.Button.default,
						$theme.Button.error,
						'items-center px-2 py-0 backdrop-blur-none'
					)}
				>
					<Div>{value.length}</Div>
					<span
						onclick={(e: Event) => {
							e.stopPropagation();
							isOpen = false;
							value = [];
						}}
						onkeydown={(e: KeyboardEvent) => {
							if (e.key === ' ' || e.key === 'Enter') {
								isOpen = false;
								value = [];
							}
						}}
						role="button"
						tabindex={-1}
					>
						<X size="16" />
					</span>
				</Div>
			{/if}
			<Div
				class={twMerge(
					'flex items-center justify-center transition duration-200',
					isOpen ? 'rotate-180' : undefined
				)}
			>
				<ChevronDown size="16" />
			</Div>
		{/if}
	</Button>
{/snippet}

{#each value as valueItem}
	<Input class="absolute top-0 left-0 hidden h-0 w-0" {name} value={valueItem} />
{/each}

<Div {@attach portal({ anchorElement: element })} onclick={(e: Event) => e.stopPropagation()}>
	{#if isOpen}
		{#if dropDown}
			{@render dropDown()}
		{:else}
			<Card
				{@attach focusFirst()}
				{@attach focusTrap}
				class="max-h-[12rem] overflow-x-visible overflow-y-auto rounded-t-none px-0"
			>
				{#each [...options].sort((a, b) => a.label.localeCompare(b.label)) as option}
					<Button
						class="flex w-full items-center space-x-2 px-6 py-0 backdrop-blur-none"
						onclick={() => {
							if (value.includes(option.value)) {
								value = value.filter((v) => v !== option.value);
							} else {
								value.push(option.value);
							}
						}}
						variants={['glass']}
					>
						<Checkbox
							checked={value.includes(option.value)}
							class="pointer-events-none"
							tabindex={-1}
						/>
						<Div class="flex flex-grow">{option.label}</Div>
					</Button>
				{/each}
			</Card>
		{/if}
	{/if}
</Div>

<svelte:body
	onclick={() => {
		isOpen = false;
	}}
	onkeydown={(e: KeyboardEvent) => {
		if (e.key === 'Escape') isOpen = false;
	}}
/>
