<script lang="ts">
import { Select, Td } from '$components';
import type { DataTableRow } from '$lib/types';

// handlers
const changeHandler = () => {
	if (updateHandler !== undefined) updateHandler(row.id, key, 'one-to-one', row[key]);
};
// props (external)
export let blurHandler: (e: any) => void;
export let focusHandler: (e: any) => void;
export let isEditable: boolean;
export let key: string;
export let keydownHandler: (e: any) => void;
export let options: { label: string; value: string }[];
export let row: DataTableRow;
export let updateHandler: ((id: string, key: string, type: string, value: any) => void) | undefined;
</script>

<Td
	class="px-0 py-0 outline-none ring-1 ring-inset ring-transparent transition duration-200 hover:ring-primary-500/30 focus:ring-primary-500"
>
	<Select
		bind:value={row[key]}
		class="w-full rounded-none py-3 ring-1 ring-inset ring-offset-0 focus:ring-primary-500"
		on:change={changeHandler}
		options={options}
		disabled={!isEditable ? 'disabled' : undefined}
	/>
</Td>
