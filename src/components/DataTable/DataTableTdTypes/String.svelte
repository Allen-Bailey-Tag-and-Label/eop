<script lang="ts">
import { twMerge } from 'tailwind-merge';
import { Td } from '$components';
import type { DataTableRow } from '$lib/types';

// handlers
const blurHandlerInternal = (e) => {
	row[key] = e.target.innerText;
	if (updateHandler !== undefined) updateHandler(key, row);
	blurHandler(e);
};

// props (external)
export let blurHandler: (e: any) => void;
export let focusHandler: (e: any) => void;
export let isEditable: boolean;
export let key: string;
export let keydownHandler: (e: any) => void;
export let row: DataTableRow;
export let updateHandler: ((key: string, row: DataTableRow) => void) | undefined;
</script>

<Td
	class={twMerge(isEditable ? "outline-none ring-1 ring-inset ring-transparent transition duration-200 hover:ring-violet-500/30 focus:ring-violet-500" : undefined)}
	contenteditable={isEditable ? "true":undefined}
	on:blur={blurHandlerInternal}
	on:focus={focusHandler}
	on:keydown={keydownHandler}
>
	{row[key]}
</Td>
