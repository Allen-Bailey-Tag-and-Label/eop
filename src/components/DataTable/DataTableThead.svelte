<script lang="ts">
import { twMerge } from 'tailwind-merge';
import { Checkbox, Icon, Th, Thead } from '$components';
import { Check, Minus } from '$icons';
import type { DataTableColumn, DataTableRow } from '$lib/types';
import { theme } from '$stores';

// handlers
const isDeleteableChangeHandler = () => {
	rows = rows.map((row) => {
		row._dataTable.selected = isDeleteableValue;
		return row;
	});
};

// props (external)
export let columns: DataTableColumn[];
export let isDeleteable: boolean;
export let isDeleteableValue = false;
export let rows: DataTableRow[];
export let selectedRows: DataTableRow[];

// props (dynamic)
$: src = rows.length === selectedRows.length ? Check : selectedRows.length > 0 ? Minus : undefined;
</script>

<Thead>
	{#if isDeleteable}
		<Th>
			<Checkbox bind:checked={isDeleteableValue} on:change={isDeleteableChangeHandler}>
				<svelte:fragment slot="handle">
					<div
						class={twMerge(
                        'relative transition duration-200',
                        $theme.checkbox,
                        src === undefined ? '' : $theme.checkboxChecked,
                      )}
					>
						<Icon class="transform text-transparent transition duration-200" src={Check} />
						<Icon
							class={twMerge("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform transition duration-200", src===Check ? 'scale-100':'scale-0')}
							src={Check}
						/>
						<Icon
							class={twMerge("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform transition duration-200", src=== Minus ? 'scale-100':'scale-0')}
							src={Minus}
						/>
					</div>
				</svelte:fragment>
			</Checkbox>
		</Th>
	{/if}
	{#each columns as { label }}
		<Th>{label}</Th>
	{/each}
</Thead>
