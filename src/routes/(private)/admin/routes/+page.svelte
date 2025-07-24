<script lang="ts">
	import { Div, MongooseTable } from '$lib/components';
	import { type Column } from '$lib/components/MongooseTable/types.js';
	import { localState } from '$lib/localState';

	let { data } = $props();
	let columns: Column[] = $state([
		{ isCreatable: false, isEditable: false, key: '_id' },
		{ key: 'href', type: 'string' },
		{ key: 'isDirectory', type: 'boolean' },
		'label',
		{ key: '_parentId', type: 'string' }
	]);
	let rows = $state([]);
	let settings = localState('admin/routes', {
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
		<MongooseTable bind:columns bind:rows bind:sort={settings.sort} modelName={'Route'} />
	{/if}
</Div>
