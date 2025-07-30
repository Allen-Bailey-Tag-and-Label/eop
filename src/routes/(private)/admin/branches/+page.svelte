<script lang="ts">
	import { Div, MongooseTable } from '$lib/components';
	import { type Column } from '$lib/components/DataTable';

	let { data } = $props();
	let columns: Column[] = $state([{ key: 'number', type: 'number' }, 'label']);
	let rows: any[] = $state([]);
	const updateBranches = async (promise: Promise<any[]>) => {
		const resolved = await promise;
		rows = resolved;
	};

	$effect(() => {
		updateBranches(data.branches);
	});
</script>

<Div class="flex flex-col p-4">
	{#if rows.length === 0}
		<Div>Loading...</Div>
	{:else}
		<MongooseTable bind:columns bind:rows modelName="Branch" />
	{/if}
</Div>
