<script lang="ts">
import { onMount } from 'svelte';
import { twMerge } from 'tailwind-merge';
import { Card, ProgressIndicator, Table, Tfoot } from '$components';
import type { DataTableColumn, DataTableOrderBy, DataTableRow } from '$lib/types';
import DataTableThead from './DataTableThead.svelte';
import DataTableToolbar from './DataTableToolbar.svelte';
import DataTableTbody from './DataTableTbody.svelte';
import DataTablePagination from './DataTablePagination.svelte';

// props (external)
export let columns: DataTableColumn[] = [];
export let createHandler: ((values: { [key: string]: any }) => void) | undefined = () => {
	rows = sortRows(rows);
};
export let currentPage: number = 0;
export let deleteHandler: (() => void) | undefined = undefined;
export let errors: { key: string; error: string }[] = [];
export let initializeRow = (row: any) => {
	row._dataTable = row?._dataTable || {};
	if (isDeleteable) {
		row._dataTable.selected = false;
	}
	return row;
};
export let isCreateable = true;
export let isDeleteable = true;
export let isEditable = true;
export let isUploadable = true;
export let orderBy: DataTableOrderBy = [];
export let parseUploadValue = (value: string) => {
	// trim value
	value = value.trim();

	// split into rows
	const uploadRows: DataTableRow[] = value.split('\n').map((rowString: string) => {
		// split into array
		const rowArray = rowString.split('\t');

		// create row object
		let row = rowArray.reduce((obj: DataTableRow, value: string, i: number) => {
			const { key, type } = columns[i];
			try {
				obj[key] = value;
				if (type === 'boolean') obj[key] = value.toLowerCase() === 'true' ? true : false;
				if (type === 'float') obj[key] = parseFloat(value);
				if (type === 'int') obj[key] = +value;
			} catch (error) {
				console.log({ key, error, type });
			}
			return obj;
		}, {});

		// initialize row
		row = initializeRow(row);

		return row;
	});

	return uploadRows;
};
export let rows: DataTableRow[] = [];
export let rowsPerPage: number = 10;
export let sortRows: (rows: DataTableRow[]) => DataTableRow[];
export let updateHandler:
	| ((id: string, key: string, type: string, value: any) => void)
	| undefined = undefined;
export let uploadHandler = (value: string) => {
	// parse upload value
	const uploadRows = parseUploadValue(value);

	// add uploadRows to rows
	rows = [...rows, ...uploadRows];

	// sortRows
	if (sortRows) rows = sortRows(rows);
};

// props (internal)
let isInitiated = false;

// props (dynamic)
$: selectedRows = [...rows].filter((row) => row?._dataTable?.selected === true);

onMount(() => {
	rows = rows.map(initializeRow);
	columns = columns.map((column) => {
		column.isEditable = column?.isEditable !== undefined ? column.isEditable : isEditable;
		column.type = column.type || 'string';
		return column;
	});
	isInitiated = true;
});
</script>

{#if errors.length > 0}
	<pre>{JSON.stringify(errors,null,2)}</pre>
{/if}
{#if errors.length === 0}
	<Card class={twMerge("flex-grow", !isInitiated?'self-start':'overflow-auto p-0')}>
		{#if !isInitiated}
			<ProgressIndicator />
		{/if}
		{#if isInitiated}
			<DataTableToolbar
				bind:rows={rows}
				bind:rowsPerPage={rowsPerPage}
				columns={columns}
				createHandler={createHandler}
				deleteHandler={deleteHandler}
				isCreateable={isCreateable}
				isDeleteable={isDeleteable}
				isUploadable={isUploadable}
				selectedRows={selectedRows}
				uploadHandler={uploadHandler}
			/>
			<Card class="flex-grow overflow-auto rounded-none p-0">
				<Table>
					<DataTableThead
						bind:orderBy={orderBy}
						bind:rows={rows}
						bind:sortRows={sortRows}
						columns={columns}
						isDeleteable={isDeleteable}
						selectedRows={selectedRows}
					/>
					<DataTableTbody
						bind:rows={rows}
						columns={columns}
						currentPage={currentPage}
						isDeleteable={isDeleteable}
						rowsPerPage={rowsPerPage}
						updateHandler={updateHandler}
					/>
				</Table>
			</Card>
			<DataTablePagination
				bind:currentPage={currentPage}
				bind:rowsPerPage={rowsPerPage}
				rows={rows}
			/>
		{/if}
	</Card>
{/if}
