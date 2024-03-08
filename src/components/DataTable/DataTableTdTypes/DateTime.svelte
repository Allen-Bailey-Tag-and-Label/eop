<script lang="ts">
import { Input, Td } from '$components';
import type { DataTableRow } from '$lib/types';
import { DateTime } from 'luxon';

// handlers
const blurHandlerInternal = (e) => {
	const value = DateTime.fromFormat(row[key], "yyyy-MM-dd'T'HH:mm").toJSDate();
	if (updateHandler !== undefined) updateHandler(row.id, key, 'dateTime', value);
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

<Td class="p-0">
	{#if isEditable}
		<Input
			bind:value={row[key]}
			class="hover:ring-primary-500/30 focus:ring-primary-500 rounded-none ring-1 ring-inset ring-offset-0"
			on:blur={blurHandlerInternal}
			on:focus={focusHandler}
			on:keydown={keydownHandler}
			type="datetime-local"
		/>
	{/if}
	{#if !isEditable}
		<div class="text-right">{row[key]}</div>
	{/if}
</Td>
