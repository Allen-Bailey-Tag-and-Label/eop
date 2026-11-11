<script lang="ts">
	import { untrack } from 'svelte';
	import { A, Button, Div, H1, H3, P, QuoteProgress } from '$lib/components';
	import { dateTime } from '$lib/formats';
	import { advanceUpsQuote } from '../quote.remote';
	import { quoteIsPending, type UpsQuoteView } from '$lib/ups/quote';
	import type { PageProps } from './$types';
	import { theme } from '$lib/theme/index.js';
	import { twMerge } from 'tailwind-merge';
	import { QuoteLayout } from '$lib/components';
	import RateComparison from '$lib/ups/RateComparison.svelte';

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
		<QuoteProgress
			{busy}
			summary={quote.scenarios?.length
				? `${quote.scenarios.filter((scenario) => scenario.status === 'complete').length} of ${quote.scenarios.length} rate rows complete`
				: undefined}
			message={networkError || quote.generation.message}
			steps={[
				{
					status: quote.generation.validation,
					text:
						quote.generation.validation === 'skipped'
							? 'Address validation: Not requested'
							: quote.generation.validation === 'complete'
								? 'Address validation: Complete'
								: quote.generation.validation === 'failed'
									? 'Address validation: Failed'
									: 'Validating destination address\u2026'
				},
				{
					status: ['complete', 'skipped'].includes(quote.generation.validation)
						? quote.generation.rates
						: 'waiting',
					text:
						quote.generation.rates === 'complete'
							? 'UPS rates: Complete'
							: quote.generation.rates === 'failed'
								? 'UPS rates: Failed'
								: ['complete', 'skipped'].includes(quote.generation.validation)
									? 'Getting UPS rates\u2026'
									: 'UPS rates: Waiting for address validation'
				}
			]}
		>
			{#snippet actions()}{#if networkError || quote.generation?.message}<Button
						disabled={busy}
						onclick={() => retry?.()}>Retry</Button
					>{/if}{/snippet}
		</QuoteProgress>
	{/if}

	{#if quote.scenarios?.length}
		<RateComparison scenarios={quote.scenarios} />
	{:else if !quote.generation || quote.generation.rates === 'complete'}
		<RateComparison
			rates={quote.rates}
			packageTotalCount={quote.packageTotalCount}
			packageTotalWeight={quote.packageTotalWeight}
		/>
	{/if}
{/snippet}
