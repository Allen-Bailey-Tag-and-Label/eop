<script lang="ts">
	import { Datatable, Div } from '$lib/components';
	import { localState } from '$lib/localState';

	let { data } = $props();
	let rows = $state([]);
	let settings = localState('admin/routes', {
		columns: [
			{ isCreatable: false, isFilterable: false, key: '_id', type: 'string' },
			{ key: 'href', type: 'string' },
			{ key: 'isDirectory', type: 'boolean' },
			'label',
			{ key: 'parentId', type: 'string' }
		],
		sort: { direction: 'asc', key: 'href' }
	});
	const updateRows = async (rowsPromise: Promise<any[]>) => {
		const resolved = await rowsPromise;
		rows = resolved;
	};

	$effect(() => {
		updateRows(data.rows);
	});
</script>

<Div class="flex flex-col p-4">
	{#if rows.length === 0}
		<Div>Loading...</Div>
	{:else}
		<Datatable bind:columns={settings.columns} bind:rows bind:sort={settings.sort} />
	{/if}
</Div>
