<script lang="ts">
	import { Div, MongooseTable, Td } from '$lib/components';
	import { type TdSnippet } from '$lib/components/Datatable/types.js';
	import { currency } from '$lib/formats';

	let { data } = $props();
	let rows = $state([]);
</script>

<Div class="flex flex-col p-4">
	<MongooseTable
		bind:rows
		{data}
		isCreatable={false}
		isDeletable={false}
		isEditable={false}
		modelName={'UpsQuote'}
		virtualColumns={[
			{ key: 'ground', label: 'Ground', snippet: groundSnippet },
			{ key: 'shipTo.AddressLine', label: 'Street', type: 'string' },
			{ key: 'shipTo.City', label: 'City', type: 'string' },
			{ key: 'shipTo.StateProvinceCode', label: 'State', type: 'string' },
			{ key: 'shipTo.PostalCode', label: 'ZIP', type: 'string' }
		]}
	/>
</Div>

{#snippet groundSnippet({ object }: TdSnippet)}
	<Td class="text-right">
		{currency(
			object.rates.find((rate: { description: string }) => rate.description === 'Ground').rate ?? 0
		)}
	</Td>
{/snippet}
