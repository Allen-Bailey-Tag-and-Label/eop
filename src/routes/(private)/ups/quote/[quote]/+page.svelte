<script lang="ts">
	import { Card, Div, H1, Table, Tbody, Td, Th, Thead, Tr } from '$lib/components';
	import { currency, dateTime } from '$lib/formats';
	import { is } from '$lib/is';

	let { data } = $props();
	let quote: any = $state();

	const updateQuote = async (promise: Promise<unknown>) => {
		const resolved = await promise;
		quote = resolved;
	};

	$effect(() => {
		updateQuote(data.quote);
	});
</script>

<Div class="flex flex-col p-4">
	{#if quote === undefined}
		Loading...
	{:else}
		<Div class="flex flex-col items-start space-y-6">
			<H1>Quote {quote.quote}</H1>
			<Div class="grid grid-cols-[fit-content(0px)_fit-content(0px)] gap-x-2">
				{@render detail('Date', dateTime(new Date(quote.date)))}
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
			<Card class="rounded-none p-0">
				<Table>
					<Thead>
						<Tr>
							<Th>Description</Th>
							<Th class="text-right">Rate</Th>
						</Tr>
					</Thead>
					<Tbody>
						{#each quote.rates.filter((rate) => is.object(rate)) as { description, rate }}
							<Tr>
								<Td>{description}</Td>
								<Td class="text-right">{currency(rate)}</Td>
							</Tr>
						{/each}
					</Tbody>
				</Table>
			</Card>
		</Div>
	{/if}
</Div>

{#snippet detail(label: string, value: any)}
	<Div class="font-bold whitespace-nowrap">{label}:</Div>
	<Div class="whitespace-nowrap">{value}</Div>
{/snippet}
