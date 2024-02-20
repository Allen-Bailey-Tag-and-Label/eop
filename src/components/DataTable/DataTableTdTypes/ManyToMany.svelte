<script lang="ts">
import { InputManyToMany, Td } from '$components';
import type { DataTableRow } from '$lib/types';

// handlers
const changeHandler = (e) => {
	if (updateHandler !== undefined) updateHandler(row.id, key, 'many-to-many', row[key]);
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

<Td class="px-0 py-0">
	<InputManyToMany
		bind:value={row[key]}
		class="py-0 ring-offset-0"
		on:blur={blurHandler}
		on:change={changeHandler}
		on:focus={focusHandler}
		on:keydown={keydownHandler}
		options={options}
		readonly={isEditable ? undefined : 'readonly'}
	/>
</Td>
