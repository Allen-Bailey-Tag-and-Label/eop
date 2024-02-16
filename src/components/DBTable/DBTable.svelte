<script lang="ts">
import { deserialize } from '$app/forms';
import { DataTable } from '$components';
import type { DataTableRow } from '$lib/types';

// props (external)
export let createHandler = async (values: { [key: string]: any }) => {
	const formData = new FormData();
	if (model) formData.append('model', model);
	formData.append('values', JSON.stringify(values));
	const response = await fetch('/api/dbTable?/create', {
		method: 'POST',
		body: formData
	});
	const {
		data: { row }
	} = deserialize(await response.text());
	rows = [...rows, { ...row, _dataTable: { selected: false } }];
};
export let deleteHandler = async () => {
	const formData = new FormData();
	const ids = rows.filter((row) => row._dataTable.selected).map((row) => row.id);
	formData.append('ids', JSON.stringify(ids));
	if (model) formData.append('model', model);
	await fetch('/api/dbTable?/delete', {
		method: 'POST',
		body: formData
	});
	rows = rows.filter((row) => !row._dataTable.selected);
};
export let model: string | undefined = undefined;
export let rows: DataTableRow[] = [];
</script>

{#if model === undefined}
	<div class="text-red-500">Missing prop "model" from DBTable</div>
{/if}
{#if model !== undefined}
	<DataTable
		bind:rows={rows}
		createHandler={createHandler}
		deleteHandler={deleteHandler}
		{...$$restProps}
	/>
{/if}
