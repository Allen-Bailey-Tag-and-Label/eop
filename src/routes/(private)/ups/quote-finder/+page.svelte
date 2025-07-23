<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { A, Datatable, Div, Td } from '$lib/components';
	import { type Column, type TdSnippet } from '$lib/components/Datatable/types.js';
	import { localState } from '$lib/localState';
	import { theme } from '$lib/theme/index.js';
	import { type Row, type RowPromise } from './types';

	let { data } = $props();
	let columns: Column[] = $state([
		{ isFilterable: false, key: ' ', snippet: optionsTd },
		{ label: 'Quote #', key: 'quote', type: 'number' },
		{ key: 'date', type: 'timestamp' },
		'address',
		'city',
		'state',
		'zip',
		'classification'
	]);
	let rows: Row[] = $state([]);
	let settings = localState('ups/quote-finder', {
		filters: [],
		sort: { direction: 'desc', key: 'quote' }
	});
	const updateRows = async (rowsPromise: Promise<RowPromise[]>) => {
		const resolved = await rowsPromise;
		rows = resolved.map(
			({
				classification,
				quote,
				date,
				shipTo: { AddressLine: address, City: city, StateProvinceCode: state, PostalCode: zip }
			}) => ({
				quote,
				date: new Date(date),
				address,
				city,
				state,
				zip,
				classification
			})
		);
	};

	$effect(() => {
		updateRows(data.rows);
	});
</script>

<Div class="flex flex-col p-4">
	{#if rows.length === 0}
		<Div>Loading...</Div>
	{:else}
		<Datatable
			bind:columns
			bind:filters={settings.filters}
			bind:rows
			bind:sort={settings.sort}
			isDeletable={false}
			isEditable={false}
		/>
	{/if}
</Div>

{#snippet optionsTd({ isEditable, key, object }: TdSnippet)}
	<Td class="py-0">
		<Div class="flex space-x-2">
			<A class={twMerge($theme.Button.default, 'px-2 py-1')} href="/ups/quote/{object.quote}">
				View
			</A>
			<A class={twMerge($theme.Button.default, 'px-2 py-1')} href="/ups/quote">Duplicate</A>
		</Div>
	</Td>
{/snippet}
