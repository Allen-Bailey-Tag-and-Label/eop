<script lang="ts">
	import { A, Div, MongooseTable, Td } from '$lib/components';
	import { type TdSnippet } from '$lib/components/Datatable/types.js';
	import { currency } from '$lib/formats';
	import { theme } from '$lib/theme/index.js';
	import { twMerge } from 'tailwind-merge';

	let { data } = $props();
	const columnOverrides = $state({
		_branchId: { label: 'Branch' }
	});
	let rows = $state([]);
</script>

<MongooseTable
	bind:rows
	{columnOverrides}
	{data}
	isCreatable={false}
	isDeletable={false}
	isEditable={false}
	modelName={'UpsQuote'}
	virtualColumns={[
		{
			class: 'w-0',
			isFilterable: false,
			isSortable: false,
			key: 'buttons',
			label: '',
			snippet: buttonsSnippet
		},
		{
			key: 'ground',
			label: 'Ground',
			type: 'function',
			valueFn: ({ object }) =>
				currency(
					object?.rates?.find((rate: { description: string }) => rate?.description === 'Ground')
						?.rate ?? 0
				)
		},
		{ key: 'shipTo.AddressLine', label: 'Street', type: 'string' },
		{ key: 'shipTo.City', label: 'City', type: 'string' },
		{ key: 'shipTo.StateProvinceCode', label: 'State', type: 'string' },
		{ key: 'shipTo.PostalCode', label: 'ZIP', type: 'string' }
	]}
/>

{#snippet buttonsSnippet({ object }: TdSnippet)}
	<Td class="py-0">
		<Div class="flex space-x-2">
			<A
				class={twMerge($theme.Button.default, $theme.Button.small)}
				href="/ups/quote?{new URLSearchParams({
					_branchId: object?._branchId,
					address: object?.shipTo?.AddressLine,
					isValidated: object?.isValidated,
					zip: object?.shipTo?.PostalCode,
					city: object?.shipTo?.City,
					state: object?.shipTo?.StateProvinceCode,
					totalPackages: object?.packageTotalCount,
					totalWeight: object?.packageTotalWeight
				}).toString()}"
			>
				Duplicate
			</A>
			<A
				class={twMerge($theme.Button.default, $theme.Button.small)}
				href="/ups/quote/{object?.quote}"
			>
				View
			</A>
		</Div>
	</Td>
{/snippet}
{#snippet groundSnippet({ object }: TdSnippet)}
	<Td class="text-right">
		{currency(
			object.rates.find((rate: { description: string }) => rate.description === 'Ground').rate ?? 0
		)}
	</Td>
{/snippet}
