<script lang="ts">
	import { A, Details, Div, H1, H3, P, QuoteLayout, QuoteProgress, Summary } from '$lib/components';
	import { dateTime } from '$lib/formats';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import ShippingQuoteResults from '$lib/shipping/QuoteResults.svelte';
	import type { PageProps } from './$types';
	import type { PackageGroup, FreightItem } from '$lib/shipping/types';
	const isFreight = (item: PackageGroup): item is FreightItem => 'freightClass' in item;
	let { data }: PageProps = $props();
	const quote = $derived(data.quote);
	const progress = $derived(
		quote.origin === 'legacy-ups'
			? [{ text: 'UPS rates: Saved historical prices', status: 'complete' }]
			: quote.attempts.map((attempt) => ({
					text: `${attempt.service} rates: ${attempt.status === 'success' ? 'Complete' : attempt.status === 'not-configured' ? 'Not configured' : 'Failed'}`,
					status: attempt.status === 'success' ? 'complete' : attempt.status,
					message: attempt.message
				}))
	);
</script>

<svelte:head><title>Shipping quote {quote.number} - EOP</title></svelte:head>
<Div class="w-full min-w-0 space-y-6">
	<Div class="flex flex-wrap items-baseline justify-between gap-2">
		<H1>Quote {quote.number}</H1>
		<P>{quote.createdAt ? dateTime(new Date(quote.createdAt)) : 'Created: Unknown'}</P>
	</Div>
	<QuoteLayout {shipment} {packages} {extras} {actions} {rates} />
</Div>

{#snippet shipment()}
	<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-6">
		{#each [{ title: 'Ship From', address: quote.shipFrom }, { title: 'Ship To', address: quote.shipTo }] as section (section.title)}
			<Div class="min-w-0 space-y-2">
				<H3 class="text-base">{section.title}</H3>
				<P class="break-words"
					>{section.address.address}<br />{section.address.city}, {section.address.state}
					{section.address.zip}{section.address.residential ? ' - Residential' : ''}</P
				>
			</Div>
		{/each}
	</Div>
{/snippet}

{#snippet packages()}
	<Div class="col-span-full min-w-0 space-y-4">
		{#if quote.request}
			{#if quote.request.upsScenarios?.length}
				<H3 class="text-base">UPS package options</H3>
				{#each quote.request.upsScenarios as scenario, index (scenario.id)}
					<P
						>{scenario.label ||
							(scenario.unitQuantity
								? `${scenario.unitQuantity.toLocaleString()} units`
								: `Rate row ${index + 1}`)} - {scenario.packageTotalCount} packages - {scenario.packageTotalWeight}
						lb total</P
					>
				{/each}
			{/if}
			{#if quote.request.ltlScenarios?.length}
				<H3 class="text-base">LTL pallet options</H3>
				{#each quote.request.ltlScenarios as scenario, index (scenario.id)}
					<P
						>{scenario.label ||
							(scenario.unitQuantity
								? `${scenario.unitQuantity.toLocaleString()} units`
								: `Rate row ${index + 1}`)} - {scenario.freight.reduce(
							(sum, item) => sum + item.quantity,
							0
						)} pallets - {scenario.freight
							.reduce((sum, item) => sum + item.quantity * item.weight, 0)
							.toLocaleString(undefined, { maximumFractionDigits: 3 })} lb total</P
					>
					<Details
						><Summary>Pallet details</Summary><Div class="space-y-2 pt-2">
							{#each scenario.freight as item (item.id)}<P
									>{item.quantity} x {item.weight} lb - {item.length} x {item.width} x {item.height}
									in - NMFC {item.nmfc} - {item.stackable ? 'Stackable' : 'Not stackable'}</P
								>{/each}
						</Div></Details
					>
				{/each}
			{/if}
			{#each [{ title: 'UPS packaging', service: 'UPS', items: quote.request.packages }, { title: 'LTL handling units', service: 'LTL', items: quote.request.freight }] as section (section.title)}
				{#if quote.request.services !== (section.service === 'UPS' ? 'LTL' : 'UPS') && section.items.length && !(section.service === 'UPS' && quote.request.upsScenarios?.length) && !(section.service === 'LTL' && quote.request.ltlScenarios?.length)}
					<Div class="space-y-2"
						><H3 class="text-base">{section.title}</H3>
						{#each section.items as item (item.id)}
							<P
								>{item.quantity} x {item.weight} lb{#if item.length && item.width && item.height}
									- {item.length} x {item.width} x {item.height} in{/if}{#if isFreight(item)}
									{#if item.description}
										- {item.description}{/if}{#if item.freightClass}
										- Class {item.freightClass}{/if} - NMFC {item.nmfc || 'Not specified'} - {item.stackable
										? 'Stackable'
										: 'Not stackable'}{/if}</P
							>
						{/each}</Div
					>
				{/if}
			{/each}
		{:else}
			<P>Packages: {quote.packageTotalCount ?? 'Unknown'}</P><P
				>Total weight: {quote.packageTotalWeight ?? 'Unknown'} lb</P
			>
		{/if}
	</Div>
{/snippet}

{#snippet extras()}
	<Div class="col-span-full min-w-0 space-y-2">
		{#if quote.request}
			<P>Services: {quote.request.services}</P><P>Ship date: {quote.request.shipDate}</P>
			<P>Validation: {quote.request.validateAddresses ? 'Validated' : 'Not requested'}</P>
			{#if quote.request.customer}<P>Customer: {quote.request.customer}</P>{/if}
			{#if quote.request.reference}<P>Reference: {quote.request.reference}</P>{/if}
			{#if quote.request.services !== 'UPS'}
				<H3 class="text-base">LTL services requested</H3>
				{#each [{ key: 'pickupLiftgate', label: 'Liftgate pickup' }, { key: 'deliveryLiftgate', label: 'Liftgate delivery' }, { key: 'insidePickup', label: 'Inside pickup' }, { key: 'insideDelivery', label: 'Inside delivery' }, { key: 'limitedAccessPickup', label: 'Limited access pickup' }, { key: 'limitedAccessDelivery', label: 'Limited access delivery' }] as option (option.key)}
					{#if quote.request.accessorials[option.key as keyof typeof quote.request.accessorials]}<P
							>{option.label}</P
						>{/if}
				{/each}
			{/if}
		{:else}<P
				>Historical UPS quote. Only the original customer prices were recorded; carrier costs and
				markup breakdowns are unavailable. Current markup rules are not applied.</P
			>{/if}
	</Div>
{/snippet}

{#snippet actions()}
	<Div class="flex flex-wrap justify-end gap-2">
		<A href="/shipping/quote-finder" class={twMerge($theme.Button.default)}>Quote history</A>
		{#if quote.request}<A
				href={`/shipping/quote?from=${quote.number}`}
				class={twMerge($theme.Button.default)}>Quote again</A
			>
		{:else}<A href={`/ups/quote/${quote.number}`} class={twMerge($theme.Button.default)}
				>Open original UPS quote</A
			>{/if}
	</Div>
{/snippet}

{#snippet rates()}
	<QuoteProgress
		steps={progress}
		summary={quote.attempts.length
			? `${quote.attempts.filter((attempt) => attempt.status === 'success').length} of ${quote.attempts.length} providers returned rates`
			: undefined}
	/>
	<ShippingQuoteResults {quote} />
	{#if quote.origin !== 'legacy-ups' && !quote.rates.length}<P
			>No rates were returned. The shipment and provider status were saved for review.</P
		>{/if}
{/snippet}
