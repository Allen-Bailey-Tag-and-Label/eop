<script lang="ts">
	import { untrack } from 'svelte';
	import {
		A,
		Button,
		Card,
		Div,
		H1,
		H2,
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
	import { quoteIsPending, type UpsQuoteView } from '$lib/ups/quote';
	import type { PageProps } from './$types';
	import { theme } from '$lib/theme/index.js';
	import { twMerge } from 'tailwind-merge';

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
		let endWait: (() => void) | undefined;
		const run = async (isRetry = false) => {
			if (working || stopped) return;
			working = true;
			busy = true;
			networkError = '';
			try {
				do {
					const result = await advanceUpsQuote({ quote: incoming.quote, retry: isRetry });
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
			endWait?.();
		};
	});
</script>

<Div class="flex flex-col items-start">
	<Div class="flex flex-col items-start space-y-6">
		<H1>Quote {quote.quote}</H1>
		{#if quote.generation}
			<Card class="w-full space-y-4" role="status" aria-live="polite" aria-busy={busy}>
				<H2>Quote progress</H2>
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
		<Div class="grid grid-cols-[fit-content(0px)_fit-content(0px)] gap-x-2">
			{@render detail('Date', dateTime(new Date(quote.createdAt)))}
			{@render detail(
				'Ship From',
				`${quote.shipper.AddressLine}, ${quote.shipper.City}, ${quote.shipper.StateProvinceCode} ${quote.shipper.PostalCode}`
			)}
			{@render detail(
				'Ship To',
				`${quote.shipTo.AddressLine}, ${quote.shipTo.City}, ${quote.shipTo.StateProvinceCode} ${quote.shipTo.PostalCode}`
			)}
			{@render detail('Classification', quote.classification)}
			{@render detail('Total Packages', quote.packageTotalCount)}
			{@render detail('Total Weight', quote.packageTotalWeight)}
		</Div>
		{#if !quote.generation || quote.generation.rates === 'complete'}
			<Card class="rounded-none p-0">
				<Table>
					<Thead>
						<Tr>
							<Th>Description</Th>
							<Th class="text-right">Rate</Th>
						</Tr>
					</Thead>
					<Tbody>
						{#each quote.rates as { description, rate }, index (index)}
							<Tr>
								<Td>{description}</Td>
								<Td class="text-right">{currency(rate)}</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Card>
		{/if}

		<Div class="flex w-full justify-end space-x-2">
			<A
				class={twMerge($theme.Button.default)}
				href="/ups/quote?{new URLSearchParams({
					_branchId: quote?._branchId,
					address: quote?.shipTo?.AddressLine,
					isValidated: String(
						quote.generation ? quote.generation.validation !== 'skipped' : quote.isValidated
					),
					zip: quote?.shipTo?.PostalCode,
					city: quote?.shipTo?.City,
					state: quote?.shipTo?.StateProvinceCode,
					totalPackages: String(quote.packageTotalCount),
					totalWeight: String(quote.packageTotalWeight)
				}).toString()}">Duplicate</A
			>
		</Div>
	</Div>
</Div>

{#snippet detail(label: string, value: string | number)}
	<Div class="font-bold whitespace-nowrap">{label}:</Div>
	<Div class="whitespace-nowrap">{value}</Div>
{/snippet}
