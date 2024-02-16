<script lang="ts">
import { onMount } from 'svelte';
import { twMerge } from 'tailwind-merge';
import { Card, ProgressIndicator, Table } from '$components';
import type { DataTableColumn, DataTableRow } from '$lib/types';
import DataTableThead from './DataTableThead.svelte';
import DataTableToolbar from './DataTableToolbar.svelte';
import DataTableTbody from './DataTableTbody.svelte';

// props (external)
export let columns: DataTableColumn[] = [];
export let createHandler: ((values: { [key: string]: any }) => void) | undefined = undefined;
export let deleteHandler: (() => void) | undefined = undefined;
export let isCreatable = true;
export let isDeleteable = true;
export let rows: DataTableRow[] = [];

// props (internal)
let isInitiated = false;

// props (dynamic)
$: isToolbarNeeded = isDeleteable;
$: selectedRows = [...rows].filter((row) => row?._dataTable?.selected === true);

onMount(() => {
	rows = rows.map((row) => {
		row._dataTable = {};
		if (isDeleteable) {
			row._dataTable.selected = false;
		}
		return row;
	});
	columns = columns.map((column) => {
		if (column?.type === undefined) column.type = 'string';
		return column;
	});
	isInitiated = true;
});
</script>

<Card class={twMerge("rounded-none", !isInitiated?'self-start':'overflow-auto p-0')}>
	{#if !isInitiated}
		<ProgressIndicator />
	{/if}
	{#if isInitiated}
		{#if isToolbarNeeded}
			<DataTableToolbar
				bind:rows={rows}
				columns={columns}
				createHandler={createHandler}
				deleteHandler={deleteHandler}
				isCreatable={isCreatable}
				isDeleteable={isDeleteable}
				selectedRows={selectedRows}
			/>
		{/if}
		<Card class="overflow-auto rounded-none p-0">
			<Table>
				<DataTableThead
					bind:rows={rows}
					columns={columns}
					isDeleteable={isDeleteable}
					selectedRows={selectedRows}
				/>
				<DataTableTbody bind:rows={rows} columns={columns} isDeleteable={isDeleteable} />
			</Table>
		</Card>
	{/if}
</Card>
