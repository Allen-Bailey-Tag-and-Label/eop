<script lang="ts">
	import { Badge, Button, Card, Checkbox, Div, Icon, Portal } from '$lib/components';
	import { fade } from 'svelte/transition';
	import { theme } from 'sveltewind';
	import { clickOutside } from 'sveltewind/actions';
	import { ChevronDown, XMark } from 'sveltewind/icons';
	import { twMerge } from 'tailwind-merge';

	type Bounds = {
		bottom: number;
		height: number;
		left: number;
		right: number;
		top: number;
		width: number;
		x: number;
		y: number;
	};
	type Props = {
		isVisible?: boolean;
		options: Option[];
		value: any[];
	};
	type Option = { label: string; value: any };

	let { isVisible = $bindable(), options, value = $bindable([]) }: Props = $props();
	let elem: any;
	let bounds: Bounds = $state({
		bottom: 0,
		height: 0,
		left: 0,
		right: 0,
		top: 0,
		width: 0,
		x: 0,
		y: 0
	});
	const positionAction = (node: Element) => {
		bounds = node.getBoundingClientRect();
	};

	$effect(() => {
		if (isVisible === undefined) isVisible = false;
	});
	$effect(() => {
		if (value) {
			value = value.sort((a, b) => a.localeCompare(b));
		}
	});
</script>

<Div
	bind:this={elem}
	class={twMerge(
		theme.getComponentVariant('input', 'default'),
		'relative min-h-12 cursor-pointer items-center rounded-none bg-transparent pr-8 pt-1 dark:bg-transparent'
	)}
	onclick={() => (isVisible = !isVisible)}
	use={[positionAction]}
>
	<Div class="-ml-2 flex flex-wrap items-center">
		{#each value as valueItem}
			{@const label = options.find((option) => option.value === valueItem)?.label || ''}
			<Div
				class="ml-2 mt-2 flex select-none flex-row items-center rounded bg-primary-500 px-1 py-0 text-sm font-normal text-white"
				isVisible={true}
				transition={[fade]}
			>
				<Div>{label}</Div>
			</Div>
		{/each}
	</Div>
	<Div class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
		<Icon class="h-4 w-4" src={ChevronDown} />
	</Div>
	<Portal>
		<Card
			class={twMerge(
				'fixed flex max-h-[10rem] flex-col overflow-auto px-0 py-5 transition duration-200',
				isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
			)}
			style="left:{bounds?.x || 0}px; top:{(bounds?.y || 0) +
				(bounds?.height || 0)}px; width:{bounds?.width || 0}px"
		>
			{#each options as option}
				{@const checked = value.includes(option.value)}
				{#if option.value !== ''}
					<Div
						class="flex items-center justify-start space-x-2 px-6 py-1 dark:shadow-none"
						variants={['default', 'ghost']}
					>
						<Checkbox
							{checked}
							class="pointer-events-none"
							onchange={(e) => {
								const checked = e.currentTarget.checked;
								if (checked) value.push(option.value);
								if (!checked) value = value.filter((valueItem) => valueItem !== option.value);
							}}
						/>
						<Div>
							{option.label}
						</Div>
					</Div>
				{/if}
			{/each}
		</Card>
	</Portal>
</Div>
