<script lang="ts">
	import { DateTime } from 'luxon';
	import { format } from '$lib';
	import { A, Div, H1, ProgressIndicator, Table, Tbody, Td, Th, Thead, Tr } from '$lib/components';
	import type { PageData } from './$types';
	import { twMerge } from 'tailwind-merge';
	import { theme } from 'sveltewind';

	let { data }: { data: PageData } = $props();
	const codeMap = new Map([
		['01', 'UPS Next Day Air'],
		['02', 'UPS 2nd Day Air'],
		['03', 'UPS Ground'],
		['12', 'UPS 3 Day Select'],
		['13', 'UPS Next Day Air Saver'],
		['14', 'UPS Next Day Air Early'],
		['59', 'UPS 2nd Day Air A.M.']
	]);
</script>

{#await data.quote}
	<ProgressIndicator class="mx-auto h-[5rem] w-[5rem]" />
{:then quote}
	{#if quote}
		{@const searchParams = new URLSearchParams(
			Object.keys(quote)
				.filter(
					(key) =>
						![
							'id',
							'classification',
							'createdAt',
							'createdBy',
							'createdById',
							'number',
							'ratedShipment',
							'updatedAt'
						].includes(key)
				)
				.reduce((object, key) => {
					object[key] = quote[key];
					return object;
				}, {})
		)}
		{@const stats = new Map([
			[
				'Date',
				DateTime.fromJSDate(quote.createdAt, { zone: 'America/New_York' }).toFormat(
					'M/d/yy h:mm:ss a'
				)
			],
			['Created By', quote.createdBy.username],
			['Ship From', `${quote.fromAddress}, ${quote.fromCity}, ${quote.fromState} ${quote.fromZip}`],
			['Ship To', `${quote.toAddress}, ${quote.toCity}, ${quote.toState} ${quote.toZip}`],
			['Classification', quote.classification],
			['Number of Packages', quote.numberOfPackages.toString()],
			['Total Weight', `${quote.totalWeight.toString()} lbs.`]
		])}
		<Div class="flex flex-col space-y-4">
			<H1>Quote #{quote.number}</H1>
			<Div class="grid grid-cols-[fit-content(0px)_1fr] gap-x-4">
				{#each [...stats] as [label, value]}
					<Div class="whitespace-nowrap font-bold">{label}:</Div>
					<Div>
						{value}
					</Div>
				{/each}
			</Div>
			<Table>
				<Thead>
					<Tr>
						<Th>Service</Th>
						<Th class="text-right">Cost</Th>
					</Tr>
				</Thead>
				<Tbody>
					{#each quote.ratedShipment.sort((a, b) => +a?.TotalCharges?.MonetaryValue - +b.TotalCharges.MonetaryValue) as { Service: { Code }, TotalCharges: { MonetaryValue } }}
						<Tr>
							<Td>{codeMap.get(Code)}</Td>
							<Td class="text-right">{format.currency(+MonetaryValue)}</Td>
						</Tr>
					{/each}
				</Tbody>
			</Table>
			<A
				class={twMerge(theme.getComponentVariant('button', 'default'), 'lg:self-end')}
				href="/ups/quote/?{searchParams.toString()}"
				variants={[]}
			>
				Duplicate
			</A>
		</Div>
	{:else}
		<H1>Could not find quote</H1>
	{/if}
{/await}
