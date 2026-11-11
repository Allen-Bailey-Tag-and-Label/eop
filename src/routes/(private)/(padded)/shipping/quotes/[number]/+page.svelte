<script lang="ts">
	import { A, Card, Div, H1, H2, P, Table, Thead, Tbody, Tr, Th, Td } from '$lib/components';
	import { currency } from '$lib/formats';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import type { PageProps } from './$types';
	import type { PackageGroup, FreightItem } from '$lib/shipping/types';
	const isFreight = (item: PackageGroup): item is FreightItem => 'freightClass' in item;
	let { data }: PageProps = $props();
	const quote = $derived(data.quote);
	const hasScenarios = $derived(quote.rates.some((rate) => rate.scenarioId));
</script>

<svelte:head><title>Shipping quote {quote.number} - EOP</title></svelte:head>
<Div class="space-y-6">
	<Div class="flex flex-wrap items-center justify-between gap-4"
		><H1>Quote {quote.number}</H1><Div class="flex flex-wrap gap-2"
			><A
				href="/shipping/quote-finder"
				class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
				>Quote history</A
			>{#if quote.request}<A
					href={`/shipping/quote?from=${quote.number}`}
					class={twMerge($theme.Button.default, 'inline-flex items-center hover:no-underline')}
					>Quote again</A
				>{/if}</Div
		></Div
	>
	<Card class="space-y-3"
		><H2>Shipment</H2>
		<P>Created: {quote.createdAt ? new Date(quote.createdAt).toLocaleString() : 'Unknown'}</P>
		<P
			>Ship from: {quote.shipFrom.address}, {quote.shipFrom.city}, {quote.shipFrom.state}
			{quote.shipFrom.zip}</P
		>
		<P
			>Ship to: {quote.shipTo.address}, {quote.shipTo.city}, {quote.shipTo.state}
			{quote.shipTo.zip}{quote.shipTo.residential ? ' · Residential' : ''}</P
		>
		{#if quote.request}<P
				>Services: {quote.request.services} · Ship date: {quote.request.shipDate}</P
			><P
				>Customer: {quote.request.customer || 'Not specified'} · Reference: {quote.request
					.reference || 'Not specified'}</P
			>{:else}<P
				>Packages: {quote.packageTotalCount ?? 'Unknown'} · Total weight: {quote.packageTotalWeight ??
					'Unknown'} lb</P
			>{/if}
	</Card>
	{#if quote.origin === 'legacy-ups'}
		<P
			>Historical UPS quote. Only the original customer prices were recorded; carrier costs and
			markup breakdowns are unavailable. Current markup rules are not applied.</P
		>
		<Card class="overflow-x-auto p-0"
			><Table class="w-full"
				><Thead><Tr><Th>UPS service</Th><Th>Saved customer price</Th></Tr></Thead><Tbody
					>{#each quote.legacyRates as rate, index (index)}<Tr
							><Td>{rate.description}</Td><Td>{currency(rate.priceCents / 100)}</Td></Tr
						>{/each}</Tbody
				></Table
			></Card
		>
		<A href={`/ups/quote/${quote.number}`}>Open original UPS quote</A>
	{:else}
		{#each quote.attempts as attempt (attempt.service)}<Card
				><H2>{attempt.service}</H2><P role={attempt.status === 'success' ? undefined : 'status'}
					>{attempt.message}</P
				></Card
			>{/each}
		{#if quote.rates.length}<Card class="overflow-x-auto p-0"
				><Table class="w-full"
					><Thead
						><Tr
							>{#if hasScenarios}<Th>Shipment</Th>{/if}<Th>Service</Th><Th>Carrier</Th><Th
								>Rate basis</Th
							><Th>Carrier cost</Th><Th>Markup</Th><Th>Customer price</Th></Tr
						></Thead
					><Tbody
						>{#each quote.rates as rate, index (index)}<Tr
								>{#if hasScenarios}<Td>{rate.scenarioLabel ?? 'Shipment'}</Td>{/if}<Td
									>{rate.description}</Td
								><Td>{rate.carrier}</Td><Td>{rate.rateBasis}</Td><Td
									>{currency(rate.costCents / 100)}</Td
								><Td
									>{rate.markup.percentBps / 100}% · {currency(rate.markup.amountCents / 100)}<P
										class="text-xs">{rate.markup.label} · Revision {rate.markup.revision}</P
									></Td
								><Td class="font-semibold">{currency(rate.priceCents / 100)}</Td></Tr
							>{/each}</Tbody
					></Table
				></Card
			>{:else}<Card
				><P>No rates were returned. The shipment and provider status were saved for review.</P
				></Card
			>{/if}
		{#if quote.request}
			{#if quote.request.upsScenarios?.length}
				<Card class="space-y-3"
					><H2>UPS package options</H2>
					{#each quote.request.upsScenarios as scenario, index (scenario.id)}
						<P
							>{scenario.label ||
								(scenario.unitQuantity
									? `${scenario.unitQuantity.toLocaleString()} units`
									: `Rate row ${index + 1}`)} · {scenario.packageTotalCount} packages · {scenario.packageTotalWeight}
							lb total</P
						>
						{#if scenario.message}<P role="status">{scenario.message}</P>{/if}
					{/each}
				</Card>
			{/if}
			{#each [{ title: 'UPS packaging', items: quote.request.packages }, { title: 'LTL handling units', items: quote.request.freight }] as section (section.title)}
				{#if section.items.length && !(section.title === 'UPS packaging' && quote.request.upsScenarios?.length)}<Card
						class="space-y-3"
						><H2>{section.title}</H2>{#each section.items as item (item.id)}<P
								>{item.quantity} × {item.weight} lb · {item.length} × {item.width} × {item.height} in{#if isFreight(item)}
									{#if item.description}· {item.description}{/if}{#if item.freightClass}
										· Class {item.freightClass}{/if} · NMFC {item.nmfc || 'Not specified'} · {item.stackable
										? 'Stackable'
										: 'Not stackable'}{/if}</P
							>{/each}</Card
					>{/if}
			{/each}
			{#if quote.request.services !== 'UPS'}<Card class="space-y-3"
					><H2>LTL services requested</H2
					>{#each [{ key: 'pickupLiftgate', label: 'Liftgate pickup' }, { key: 'deliveryLiftgate', label: 'Liftgate delivery' }, { key: 'insidePickup', label: 'Inside pickup' }, { key: 'insideDelivery', label: 'Inside delivery' }, { key: 'limitedAccessPickup', label: 'Limited access pickup' }, { key: 'limitedAccessDelivery', label: 'Limited access delivery' }] as option (option.key)}{#if quote.request.accessorials[option.key as keyof typeof quote.request.accessorials]}<P
								>{option.label}</P
							>{/if}{/each}</Card
				>{/if}
		{/if}
	{/if}
</Div>
