<script lang="ts">
	import { Card, Checkbox, Div, Icon, Input, Overlay, Portal } from '$lib/components';
	import { fade } from 'svelte/transition';
	import { theme } from 'sveltewind';
	import { clickOutside } from 'sveltewind/actions';
	import { ChevronDown } from 'sveltewind/icons';
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
		name?: string;
		options: Option[];
		value: any[];
	};
	type Option = { label: string; value: any };

	let { isVisible = $bindable(), name, options, value = $bindable([]) }: Props = $props();
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
	let elem: any;
	let innerHeight: number | undefined = $state();
	let innerWidth: number | undefined = $state();

	// $derives
	const style: string = $derived.by(() => {
		const style: Map<string, number> = new Map([]);

		const windowHeightMiddle = (innerHeight || 0) / 2;
		const windowWidthMiddle = (innerWidth || 0) / 2;

		if ((innerWidth || 0) < 640) {
			style.set('bottom', 0);
			style.set('left', 0);
			style.set('max-height', windowHeightMiddle);
			style.set('width', innerWidth || 0);
		}

		if ((innerWidth || 0) >= 640) {
			if (bounds.x - bounds.width / 2 <= windowWidthMiddle) {
				style.set('left', bounds.x);
				style.set('max-width', (innerWidth || 0) - bounds.x);
			}
			if (bounds.x - bounds.width / 2 > windowWidthMiddle) {
				style.set(
					'max-width',
					(innerWidth || 0) - Math.max(0, (innerHeight || 0) - (bounds.x + bounds.width))
				);
				style.set('right', Math.max(0, (innerWidth || 0) - (bounds.x + bounds.width)));
			}

			if (bounds.y - bounds.height / 2 <= windowHeightMiddle) {
				style.set('max-height', (innerHeight || 0) - (bounds.y + bounds.height));
				style.set('top', bounds.y + bounds.height);
			}
			if (bounds.y - bounds.height / 2 > windowHeightMiddle) {
				style.set('bottom', (innerHeight || 0) - bounds.y);
				style.set('max-height', bounds.y);
			}
		}

		const string = [...style].map(([key, value]) => `${key}:${value}px;`).join(' ');

		return string;
	});

	// $effects
	$effect(() => {
		if (isVisible === undefined) isVisible = false;
	});
</script>

<svelte:window bind:innerHeight bind:innerWidth />

<Div
	bind:this={elem}
	class={twMerge(
		theme.getComponentVariant('input', 'default'),
		'relative min-h-12 cursor-pointer items-center rounded-none bg-transparent pr-8 pt-1 dark:bg-transparent'
	)}
	onclick={(e) => {
		bounds = e.currentTarget.getBoundingClientRect();
		isVisible = true;
	}}
>
	<Div class="-ml-2 flex items-center">
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
		<Overlay class="lg:opacity-0" {isVisible} />
		<Card
			class={twMerge(
				'fixed z-[200] flex flex-col overflow-auto rounded-none px-0 py-5 transition duration-200',
				isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
			)}
			{style}
			use={[
				[
					clickOutside,
					() => {
						isVisible = false;
					}
				]
			]}
		>
			<Input class="absolute left-0 top-0 h-0 w-0 opacity-0" {name} {value} />
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
