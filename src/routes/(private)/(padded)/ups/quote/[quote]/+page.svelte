<script lang="ts">
	import { untrack } from 'svelte';
	import {
		A,
		Button,
		Card,
		Div,
		H1,
		H2,
		H3,
		P,
		Spinner,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import { currency, dateTime } from '$lib/formats';
	import { advanceUpsQuote } from '../quote.remote';
	import { quoteIsPending, UPS_SERVICES, type UpsQuoteView } from '$lib/ups/quote';
	import type { PageProps } from './$types';
	import { theme } from '$lib/theme/index.js';
	import { twMerge } from 'tailwind-merge';
	import QuoteLayout from '$lib/ups/QuoteLayout.svelte';

	let { data }: PageProps = $props();
	let quote = $state<UpsQuoteView>(untrack(() => data.quote));
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
							const progress = await advanceUpsQuote({ quote: incoming.quote, poll: true });
							if (polling && !stopped) quote = progress;
						} catch {
							// The owning request reports connection failures; polling is best effort.
						} finally {
							if (polling && !stopped) pollTimer = setTimeout(poll, 1000);
						}
					};
					if (quote.scenarios?.length) pollTimer = setTimeout(poll, 1000);
					let result: UpsQuoteView;
					try {
						result = await advanceUpsQuote({ quote: incoming.quote, retry: isRetry });
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
</script>

<Div class="w-full min-w-0 space-y-6">
	<Div class="flex flex-wrap items-baseline justify-between gap-2">
		<H1>Quote {quote.quote}</H1>
		<P>{dateTime(new Date(quote.createdAt))}</P>
	</Div>
	<QuoteLayout {shipment} {packages} {extras} {actions} {rates} />
</Div>

{#snippet shipment()}
	<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-6">
		<Div class="min-w-0 space-y-2">
			<H3 class="text-base">Ship From</H3>
			<P class="break-words"
				>{quote.shipper.AddressLine}<br />{quote.shipper.City}, {quote.shipper.StateProvinceCode}
				{quote.shipper.PostalCode}</P
			>
		</Div>
		<Div class="min-w-0 space-y-2">
			<H3 class="text-base">Ship To</H3>
			<P class="break-words"
				>{quote.shipTo.AddressLine}<br />{quote.shipTo.City}, {quote.shipTo.StateProvinceCode}
				{quote.shipTo.PostalCode}</P
			>
		</Div>
	</Div>
{/snippet}
{#snippet packages()}
	{#if (quote.scenarios?.length ?? 0) > 1}
		<P class="col-span-full"
			>{quote.scenarios?.length} rate rows. Carton counts, weights, and services are shown with each
			result.</P
		>
	{:else}
		<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-4">
			<Div class="min-w-0 space-y-1"
				><P class="font-semibold">Total Packages</P><P>{quote.packageTotalCount}</P></Div
			>
			<Div class="min-w-0 space-y-1"
				><P class="font-semibold">Total Weight</P><P>{quote.packageTotalWeight}</P></Div
			>
			{#if quote.packageGroups?.length}
				<Div class="col-span-full space-y-2">
					<P class="font-semibold"
						>{quote.weightMode === 'total' ? 'Estimated package weights' : 'Package weights'}</P
					>
					{#each quote.packageGroups as group, index (index)}<P
							>{group.quantity}
							{group.quantity === 1 ? 'package' : 'packages'} @ {group.weight} lbs</P
						>{/each}
				</Div>
			{/if}
		</Div>
	{/if}
{/snippet}
{#snippet extras()}
	<Div class="col-span-full grid min-w-0 grid-cols-subgrid gap-y-4">
		<Div class="space-y-1"
			><P class="font-semibold">Classification</P><P>{quote.classification}</P></Div
		>
		<Div class="space-y-1"
			><P class="font-semibold">Validation</P><P
				>{quote.generation
					? quote.generation.validation === 'skipped'
						? 'Not requested'
						: quote.generation.validation === 'complete'
							? 'Validated'
							: 'Requested'
					: quote.isValidated
						? 'Validated'
						: 'Not requested'}</P
			></Div
		>
	</Div>
{/snippet}
{#snippet actions()}
	<Div class="flex flex-wrap justify-end gap-2">
		<A class={twMerge($theme.Button.default)} href="/ups/quote?from={quote.quote}">Duplicate</A>
	</Div>
{/snippet}
{#snippet rates()}
	{#if quote.generation}
		<Card class="w-full space-y-4" role="status" aria-live="polite" aria-busy={busy}>
			<H2>Quote progress</H2>
			{#if quote.scenarios?.length}<P
					>{quote.scenarios.filter((scenario) => scenario.status === 'complete').length} of {quote
						.scenarios.length} rate rows complete</P
				>{/if}
			<Div class="flex items-center gap-3">
				{#if ['pending', 'running'].includes(quote.generation.validation) && !networkError}<Spinner
						class="h-5 w-5 shrink-0"
						aria-hidden="true"
					/>{/if}
				<P
					>{quote.generation.validation === 'skipped'
						? 'Address validation: Not requested'
						: quote.generation.validation === 'complete'
							? 'Address validation: Complete'
							: quote.generation.validation === 'failed'
								? 'Address validation: Failed'
								: 'Validating destination address…'}</P
				>
			</Div>
			<Div class="flex items-center gap-3">
				{#if ['complete', 'skipped'].includes(quote.generation.validation) && ['pending', 'running'].includes(quote.generation.rates) && !networkError}<Spinner
						class="h-5 w-5 shrink-0"
						aria-hidden="true"
					/>{/if}
				<P
					>{quote.generation.rates === 'complete'
						? 'UPS rates: Complete'
						: quote.generation.rates === 'failed'
							? 'UPS rates: Failed'
							: ['complete', 'skipped'].includes(quote.generation.validation)
								? 'Getting UPS rates…'
								: 'UPS rates: Waiting for address validation'}</P
				>
			</Div>
			{#if networkError || quote.generation.message}
				<P role="alert">{networkError || quote.generation.message}</P>
				<Div class="flex justify-end"
					><Button disabled={busy} onclick={() => retry?.()}>Retry</Button></Div
				>
			{/if}
		</Card>
	{/if}

	{#if quote.scenarios?.length}
		{#each quote.scenarios as scenario, index (scenario.id)}
			<Card class="min-w-0 space-y-4" role="region" aria-label={`Rate results ${index + 1}`}>
				<H2 class="text-lg"
					>{scenario.label ||
						(scenario.unitQuantity
							? `${scenario.unitQuantity.toLocaleString('en-US')} units`
							: `Rate row ${index + 1}`)}</H2
				>
				<P
					>{scenario.packageTotalCount}
					{scenario.packageTotalCount === 1 ? 'carton' : 'cartons'} · {scenario.packageTotalWeight} lbs
					total</P
				>
				{#if scenario.casePacking}<P class="text-sm"
						>{scenario.casePacking.unitsPerCarton.toLocaleString('en-US')} units per case · {scenario
							.casePacking.cartonWeight} lbs per full case</P
					>{/if}
				{#each scenario.packageGroups as group, groupIndex (groupIndex)}<P class="text-sm"
						>{group.quantity} @ {group.weight} lbs</P
					>{/each}
				{#if scenario.status === 'complete'}
					<Div class="overflow-x-auto"
						><Table class="w-full"
							><Thead><Tr><Th>Service</Th><Th class="text-right">Rate</Th></Tr></Thead><Tbody>
								{#each scenario.services as code (code)}
									{@const rate = scenario.rates.find((item) => item.serviceCode === code)}
									<Tr
										><Td>{UPS_SERVICES.find((service) => service.code === code)?.title ?? code}</Td
										><Td class="text-right">{rate ? currency(rate.rate) : 'Unavailable'}</Td></Tr
									>
								{/each}
							</Tbody></Table
						></Div
					>
				{:else if scenario.status === 'failed'}<P role="alert">{scenario.message}</P>
				{:else}<Div class="flex items-center gap-3" role="status"
						><Spinner class="h-5 w-5" aria-hidden="true" /><P
							>{scenario.status === 'running' ? 'Getting rates…' : 'Waiting for rates…'}</P
						></Div
					>{/if}
			</Card>
		{/each}
	{:else if !quote.generation || quote.generation.rates === 'complete'}
		<Card class="min-w-0 space-y-4">
			<H2 class="text-lg">Rates</H2>
			<Div class="overflow-x-auto">
				<Table class="w-full">
					<Thead><Tr><Th>Description</Th><Th class="text-right">Rate</Th></Tr></Thead>
					<Tbody>
						{#each quote.rates as { description, rate }, index (index)}
							<Tr><Td>{description}</Td><Td class="text-right">{currency(rate)}</Td></Tr>
						{/each}
					</Tbody>
				</Table>
			</Div>
		</Card>
	{/if}
{/snippet}
