<script lang="ts">
	import { Div, MongooseTable } from '$lib/components';
	import { localState } from '$lib/localState';

	let { data } = $props();
	let rows = $state([]);
	let settings = localState('admin/routes', {
		columns: [
			{ isCreatable: false, isFilterable: false, key: '_id', type: 'string' },
			{ key: 'href', type: 'string' },
			{ key: 'isDirectory', type: 'boolean' },
			'label'
		],
		sort: { direction: 'asc', key: 'href' }
	});
	const updateRows = async (rowsPromise: Promise<any[]>) => {
		const resolved = await rowsPromise;
		rows = resolved;
	};

	$effect(() => {
		updateRows(data.rows);
		console.log(data.rows);
	});
</script>

<Div class="flex flex-col p-4">
	{#if rows.length === 0}
		<Div>Loading...</Div>
	{:else}
		<MongooseTable
			bind:columns={settings.columns}
			bind:rows
			bind:sort={settings.sort}
			modelName={'Route'}
		/>
	{/if}
</Div>
