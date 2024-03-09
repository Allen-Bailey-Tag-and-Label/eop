<script lang="ts">
import { Checkbox, Tbody, Td, Tr } from '$components';
import type { DataTableColumn, DataTableRow } from '$lib/types';
import DataTableTd from './DataTableTd.svelte';

// props (external)
export let currentPage: number;
export let columns: DataTableColumn[] = [];
export let isDeleteable: boolean;
export let rows: DataTableRow[] = [];
export let rowsPerPage: number;
export let updateHandler: ((id: string, key: string, type: string, value: any) => void) | undefined;

$: paginatedRowIndexMinimum = currentPage * rowsPerPage;
$: paginatedRowIndexMaximum = Math.min(paginatedRowIndexMinimum + rowsPerPage, rows.length);
</script>

<Tbody>
	{#each rows as row, i}
		{#if i>=paginatedRowIndexMinimum && i < paginatedRowIndexMaximum}
			<Tr>
				{#if isDeleteable && row?._dataTable?.selected !== undefined}
					<Td><Checkbox bind:checked={row._dataTable.selected} tabindex="-1" /></Td>
				{/if}
				{#each columns as { isEditable, key, label, type, ...rest }}
					<DataTableTd
						bind:row={row}
						isEditable={isEditable}
						key={key}
						type={type}
						updateHandler={updateHandler}
						{...rest}
					/>
				{/each}
			</Tr>
		{/if}
	{/each}
</Tbody>
