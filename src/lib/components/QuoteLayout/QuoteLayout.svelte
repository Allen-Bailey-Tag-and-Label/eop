<script lang="ts">
	import { onMount, type ComponentProps, type Snippet } from 'svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { Card, Details, Div, H2, Summary } from '$lib/components';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<ComponentProps<typeof Div>, 'children'> & {
		shipment: Snippet;
		packages: Snippet;
		extras: Snippet;
		actions?: Snippet;
		rates?: Snippet;
	};
	let {
		shipment,
		packages,
		extras,
		actions,
		rates,
		class: className,
		variants = [],
		...restProps
	}: Props = $props();
	let desktop = $state(false);
	let opened = $state<Record<string, boolean>>({ 'Shipment Details': true });
	onMount(() => {
		const media = window.matchMedia('(min-width: 1024px)');
		const update = () => (desktop = media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	});
</script>

<Div
	{...restProps}
	{variants}
	class={twMerge(
		`grid w-fit max-w-full min-w-0 items-start gap-6 ${rates ? 'lg:grid-cols-[minmax(0,max-content)_minmax(0,max-content)]' : ''}`,
		className
	)}
>
	<Card
		class="grid max-w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 [&_input]:max-w-full [&_select]:max-w-full"
		role="region"
		aria-label="Quote details"
	>
		{@render section('Shipment Details', shipment)}
		{@render section('Package Info', packages, true)}
		{@render section('Extras', extras, true)}
		{#if actions}<Div class="col-span-full min-w-0">{@render actions()}</Div>{/if}
	</Card>
	{#if rates}<Div class="min-w-0 space-y-6" role="region" aria-label="Quote rates"
			>{@render rates()}</Div
		>{/if}
</Div>

{#snippet section(title: string, content: Snippet, divided = false)}
	<Div
		class={`col-span-full grid min-w-0 grid-cols-subgrid gap-y-4 ${divided ? 'border-t border-current/15 pt-6' : ''}`}
	>
		{#if desktop}
			<H2 class="col-span-full text-lg">{title}</H2>
			<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-4">{@render content()}</Div>
		{:else}
			<Details
				open={!!opened[title]}
				class="group/quote-section col-span-full min-w-0"
				ontoggle={(event) => {
					opened[title] = event.currentTarget.open;
				}}
				oninvalidcapture={(event) => {
					opened[title] = true;
					event.currentTarget.open = true;
				}}
			>
				<Summary
					class="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden"
				>
					<H2 class="text-lg">{title}</H2>
					<ChevronDown
						aria-hidden="true"
						size={20}
						class="shrink-0 transition-transform group-open/quote-section:rotate-180"
					/>
				</Summary>
				<Div class="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 pt-4 sm:grid-cols-2"
					>{@render content()}</Div
				>
			</Details>
		{/if}
	</Div>
{/snippet}
