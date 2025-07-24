<script lang="ts">
	import { Datatable, Div } from '$lib/components';
	import { localState } from '$lib/localState';

	let { data } = $props();
	let columns = $state(['label']);
	let rows = $state([]);
	let settings = localState('admin/roles', {
		sort: { direction: 'asc', key: 'label' }
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
		<Datatable bind:columns bind:rows bind:sort={settings.sort} />
	{/if}
</Div>
