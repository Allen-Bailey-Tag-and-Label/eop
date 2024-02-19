<script lang="ts">
import { Select, Td } from '$components';
import type { DataTableRow } from '$lib/types';

// props (external)
export let blurHandler: (e: any) => void;
export let focusHandler: (e: any) => void;
export let isEditable: boolean;
export let key: string;
export let keydownHandler: (e: any) => void;
export let options: { label: string; value: string }[];
export let row: DataTableRow;
</script>

<Td
	class="px-0 py-0 outline-none ring-1 ring-inset ring-transparent transition duration-200 hover:ring-violet-500/30 focus:ring-violet-500"
>
	<Select
		bind:value={row[key].id}
		class="w-full rounded-none py-3 ring-1 ring-inset ring-offset-0 focus:ring-violet-500"
		options={options}
	/>
</Td>
