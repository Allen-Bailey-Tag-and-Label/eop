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
	modelName="UpsQuote"
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
			valueFn: ({ object }) => {
				if (object?.scenarios?.length > 1) return 'Multiple options';
				const rates = object?.scenarios?.[0]?.rates ?? object?.rates;
				const ground = rates?.find(
					(rate: { description: string; serviceCode?: string }) =>
						rate?.description === 'Ground' || rate?.serviceCode === '03'
				);
				return ground ? currency(ground.rate) : 'Unavailable';
			}
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
				class={twMerge($theme.Button.default, $theme.Button.small, 'backdrop-blur-none')}
				href="/ups/quote?from={object?.quote}"
			>
				Duplicate
			</A>
			<A
				class={twMerge($theme.Button.default, $theme.Button.small, 'backdrop-blur-none')}
				href="/ups/quote/{object?.quote}"
			>
				View
			</A>
		</Div>
	</Td>
{/snippet}
