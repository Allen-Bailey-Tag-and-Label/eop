<script lang="ts">
import { Checkbox, Td } from '$components';
import type { DataTableRow } from '$lib/types';

// handlers
const changeHandler = (e) => {};
const clickHandler = (e) => {
	if (!isEditable) e.preventDefault();
};

// props (external)
export let blurHandler: (e: any) => void;
export let focusHandler: (e: any) => void;
export let isEditable: boolean;
export let key: string;
export let keydownHandler: (e: any) => void;
export let row: DataTableRow;
</script>

<Td>
	<Checkbox
		bind:checked={row[key]}
		on:blur={blurHandler}
		on:change={changeHandler}
		on:click={clickHandler}
		on:focus={focusHandler}
		on:keydown={keydownHandler}
	/>
</Td>
