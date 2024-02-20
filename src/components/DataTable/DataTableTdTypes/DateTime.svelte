<script lang="ts">
import { DateTime } from 'luxon';
import { twMerge } from 'tailwind-merge';
import { Input, Td } from '$components';
import type { DataTableRow } from '$lib/types';

// handlers
const blurHandlerInternal = (e) => {
	row[key] = DateTime.fromFormat(value, editableFormat).toJSDate();
	if (updateHandler !== undefined) updateHandler(row.id, key, 'dateTime', row[key]);
	blurHandler(e);
};

// props (external)
export let blurHandler: (e: any) => void;
export let focusHandler: (e: any) => void;
export let isEditable: boolean;
export let key: string;
export let keydownHandler: (e: any) => void;
export let row: DataTableRow;
export let updateHandler: ((id: string, key: string, value: any) => void) | undefined;

// props (internal)
const editableFormat = "yyyy-MM-dd'T'HH:mm";
let value = '';

$: if (value === '' && row[key] !== '' && isEditable)
	value = DateTime.fromJSDate(row[key]).toFormat(editableFormat);
$: if (value === '' && row[key] !== '' && !isEditable)
	value = DateTime.fromJSDate(row[key]).toFormat('M/d/yyyy HH:mm');
</script>

<Td class="p-0">
	{#if isEditable}
		<Input
			bind:value={value}
			class="rounded-none ring-1 ring-inset ring-offset-0 hover:ring-violet-500/30 focus:ring-violet-500"
			on:blur={blurHandlerInternal}
			on:focus={focusHandler}
			on:keydown={keydownHandler}
			type="datetime-local"
		/>
	{/if}
	{#if !isEditable}
		<div class="text-right">{value}</div>
	{/if}
</Td>
