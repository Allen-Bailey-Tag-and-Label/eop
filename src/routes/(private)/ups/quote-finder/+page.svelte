<script lang="ts">
	import { Eye } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { A, Datatable, Div, Td } from '$lib/components';
	import { type TdSnippet } from '$lib/components/Datatable/types.js';
	import { localState } from '$lib/localState';
	import { theme } from '$lib/theme/index.js';
	import { type Row, type RowPromise } from './types';

	let { data } = $props();
	let columns = $state([
		{ key: 'test', snippet: optionsTd },
		{ label: 'Quote #', key: 'quote' },
		{ key: 'date', type: 'timestamp' },
		'address',
		'city',
		'state',
		'zip',
		'classification'
	]);
	let rows: Row[] = $state([]);
	let settings = localState('ups/quote-finder', {
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
			bind:rows
			bind:sort={settings.sort}
			isDeletable={false}
			isEditable={false}
		/>
	{/if}
</Div>

{#snippet optionsTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	<Td class="py-0">
		<A
			class={twMerge($theme.Button.default, $theme.Button.icon, 'w-10')}
			href="/ups/quote/{rows[rowIndex].quote}"
		>
			<Eye />
		</A>
	</Td>
{/snippet}
