<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { attachmentFactory } from '$lib/attachments';
	import { theme as themeStore } from '$lib/theme';
	import Div from '../Div/Div.svelte';
	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import Input from '../Input/Input.svelte';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		dropDown?: Snippet;
		isOpen?: boolean;
		name?: string;
		options?: { label: string; value: any }[];
		style?: string;
		value?: any[];
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		dropDown,
		isOpen = $bindable(false),
		name,
		options = $bindable([]),
		style,
		value = $bindable([]),
		variants = [],
		...restProps
	}: Props = $props();

	const toggle = (valueToToggle: any) => {
		if (value.includes(valueToToggle)) {
			value = value.filter((v) => v !== valueToToggle);
		} else {
			value = [...value, valueToToggle];
		}
	};

	const buttonLabel = $derived.by(() =>
		value.map((v) => options.find((option) => option.value === v)?.label).join(', ')
	);
</script>

<Div class="relative">
	<Button
		{...restProps}
		{@attach attachmentFactory(attachments)}
		class={twMerge(
			$themeStore.Input.default,
			$themeStore.MultiSelect.default,
			...variants.map((variant: string) => $themeStore.MultiSelect[variant]),
			className
		)}
		onclick={() => (isOpen = !isOpen)}
		{style}
	>
		{#if children}
			{@render children()}
		{:else}
			<Div>
				{buttonLabel}
			</Div>
			<Div class={twMerge('transition duration-200', isOpen ? 'rotate-180' : undefined)}>
				<ChevronDown />
			</Div>
		{/if}
	</Button>
	{#each value as v}
		<Input {name} type="hidden" value={v} />
	{/each}
	{#if isOpen}
		{#if dropDown}
			{@render dropDown()}
		{:else}
			<Card
				class="absolute -bottom-4 left-0 flex max-h-[18rem] w-full translate-y-full flex-col overflow-auto"
			>
				{#each options as option, optionIndex}
					<Button
						class="flex justify-start space-x-2 px-3"
						onclick={() => toggle(option.value)}
						variants={['ghost']}
					>
						<Checkbox
							class="pointer-events-none"
							checked={value.includes(option.value)}
							disabled={true}
						/>
						<Div>{option.label}</Div>
					</Button>
				{/each}
			</Card>
		{/if}
	{/if}
</Div>
