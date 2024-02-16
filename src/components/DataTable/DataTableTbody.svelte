<script lang="ts">
import { Checkbox, Tbody, Td, Tr } from '$components';
import type { DataTableColumn, DataTableRow } from '$lib/types';

// props (external)
export let columns: DataTableColumn[] = [];
export let isDeleteable: boolean;
export let rows: DataTableRow[] = [];
</script>

<Tbody>
	{#each rows as row}
		<Tr>
			{#if isDeleteable && row?._dataTable?.selected !== undefined}
				<Td><Checkbox bind:checked={row._dataTable.selected} /></Td>
			{/if}
			{#each columns as { key }}
				<Td>{row[key]}</Td>
			{/each}
		</Tr>
	{/each}
</Tbody>
