<script lang="ts">
	import {
		A,
		Button,
		Details,
		Div,
		H1,
		H3,
		P,
		QuoteLayout,
		QuoteProgress,
		Summary
	} from '$lib/components';
	import { untrack } from 'svelte';
	import { advanceShippingQuote } from '../../quote/quote.remote';
	import type { QuoteView } from '$lib/shipping/types';
	import { dateTime } from '$lib/formats';
	import { theme } from '$lib/theme';
	import { twMerge } from 'tailwind-merge';
	import ShippingQuoteResults from '$lib/shipping/QuoteResults.svelte';
	import type { PageProps } from './$types';
	import type { PackageGroup, FreightItem } from '$lib/shipping/types';
	const isFreight = (item: PackageGroup): item is FreightItem => 'freightClass' in item;
	let { data }: PageProps = $props();
	let quote = $state<QuoteView>(untrack(() => data.quote));
	const quoteIsPending = (value: QuoteView) =>
		!!value.generation &&
		(value.generation.validation === 'pending' ||
			value.generation.validation === 'running' ||
			value.generation.rates === 'pending' ||
			value.generation.rates === 'running') &&
		value.generation.validation !== 'failed';
	let busy = $state(false);
	let networkError = $state('');
	let retry: (() => void) | undefined;
	$effect(() => {
		const incoming = data.quote;
		quote = incoming;
		networkError = '';
		let stopped = false,
			working = false;
		let timer: ReturnType<typeof setTimeout>;
		let pollTimer: ReturnType<typeof setTimeout>;
		let endWait: (() => void) | undefined;
		const run = async (isRetry = false) => {
			if (working || stopped) return;
			working = true;
			busy = true;
			networkError = '';
			try {
				do {
					let polling = true;
					const poll = async () => {
						try {
							const progress = await advanceShippingQuote({ quote: incoming.number, poll: true });
							if (polling && !stopped) quote = progress;
						} catch {
							// The owning request reports connection failures; polling is best effort.
						} finally {
							if (polling && !stopped) pollTimer = setTimeout(poll, 1000);
						}
					};
					pollTimer = setTimeout(poll, 1000);
					let result: QuoteView;
					try {
						result = await advanceShippingQuote({ quote: incoming.number, retry: isRetry });
					} finally {
						polling = false;
						clearTimeout(pollTimer);
					}
					if (stopped) return;
					quote = result;
					isRetry = false;
					if (!quoteIsPending(result)) break;
					// Another page can own the active lease; wait before checking it again.
					if (result.generation?.validation === 'running' || result.generation?.rates === 'running')
						await new Promise<void>((resolve) => {
							endWait = resolve;
							timer = setTimeout(resolve, 1000);
						});
				} while (!stopped);
			} catch (cause) {
				if (!stopped)
					networkError =
						cause instanceof Error
							? cause.message
							: 'Connection interrupted. Retry to continue this quote.';
			} finally {
				working = false;
				if (!stopped) busy = false;
			}
		};
		retry = () => {
			void run(true);
		};
		untrack(() => {
			if (quoteIsPending(incoming)) void run();
			else busy = false;
		});
		return () => {
			stopped = true;
			clearTimeout(timer);
			clearTimeout(pollTimer);
			endWait?.();
		};
	});
	const progress = $derived(
		quote.generation
			? [
					{
						text:
							quote.generation.validation === 'skipped'
								? 'Address validation: Not requested'
								: `Address validation: ${quote.generation.validation}`,
						status: quote.generation.validation
					},
					...quote.generation.tasks.map((task) => ({
						text: `${task.service} - ${task.label}: ${task.status}`,
						status: ['complete', 'skipped'].includes(quote.generation!.validation)
							? task.status
							: 'waiting',
						message: task.message
					}))
				]
			: quote.origin === 'legacy-ups'
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
			<P
				>Validation: {quote.generation
					? quote.generation.validation === 'complete'
						? 'Validated'
						: quote.generation.validation === 'skipped'
							? 'Not requested'
							: quote.generation.validation === 'failed'
								? 'Failed'
								: 'Requested'
					: quote.request.validateAddresses
						? 'Validated'
						: 'Not requested'}</P
			>
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
		{busy}
		message={networkError || quote.generation?.message}
		steps={progress}
		summary={quote.generation
			? `${quote.generation.tasks.filter((task) => ['complete', 'failed'].includes(task.status)).length} of ${quote.generation.tasks.length} rate requests finished`
			: quote.attempts.length
				? `${quote.attempts.filter((attempt) => attempt.status === 'success').length} of ${quote.attempts.length} providers returned rates`
				: undefined}
	>
		{#snippet actions()}{#if networkError || quote.generation?.validation === 'failed' || quote.generation?.rates === 'failed'}<Button
					disabled={busy}
					onclick={() => retry?.()}>Retry</Button
				>{/if}{/snippet}
	</QuoteProgress>
	<ShippingQuoteResults {quote} />
	{#if quote.origin !== 'legacy-ups' && !quote.rates.length && !busy && !quoteIsPending(quote)}<P
			>No rates were returned. The shipment and provider status were saved for review.</P
		>{/if}
{/snippet}
