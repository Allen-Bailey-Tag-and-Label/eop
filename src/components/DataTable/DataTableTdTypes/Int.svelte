<script lang="ts">
import { twMerge } from 'tailwind-merge';
import { Td } from '$components';
import type { DataTableRow } from '$lib/types';

// handlers
const blurHandlerInternal = (e) => {
	row[key] = e.target.innerText;
	if (updateHandler !== undefined) updateHandler(row.id, key, 'int', row[key]);
	blurHandler(e);
};

// props (external)
export let blurHandler: (e: any) => void;
export let focusHandler: (e: any) => void;
export let isEditable: boolean;
export let key: string;
export let keydownHandler: (e: any) => void;
export let row: DataTableRow;
export let updateHandler: ((id: string, key: string, type: string, value: any) => void) | undefined;
</script>

<Td
	class={twMerge(isEditable ? "outline-none ring-1 ring-inset ring-transparent transition duration-200 hover:ring-violet-500/30 focus:ring-violet-500" : undefined)}
	contenteditable={isEditable ? "true":undefined}
	on:blur={blurHandlerInternal}
	on:focus={focusHandler}
	on:keydown={keydownHandler}
	type="number"
>
	{row[key]}
</Td>
