<script lang="ts">
	import { Datatable, Div } from '$lib/components';
	import { localState } from '$lib/localState';

	let { data } = $props();
	let rows = $state([]);
	let settings = localState('ups/quote-finder', {
		columns: [
			{ label: 'Quote #', key: 'quote' },
			{ key: 'date', type: 'timestamp' },
			'address',
			'city',
			'state',
			'zip',
			'classification'
		],
		sort: { direction: 'desc', key: 'quote' }
	});
	const updateRows = async (rowsPromise: Promise<any[]>) => {
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
			bind:columns={settings.columns}
			bind:rows
			bind:sort={settings.sort}
			isDeletable={false}
			isEditable={false}
		/>
	{/if}
</Div>
