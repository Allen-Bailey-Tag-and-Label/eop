<script lang="ts">
import { twMerge } from 'tailwind-merge';
import { Button, Checkbox, Icon, Th, Thead } from '$components';
import { Check, ChevronDown, Minus } from '$icons';
import type { DataTableColumn, DataTableOrderBy, DataTableRow } from '$lib/types';
import { theme } from '$stores';
import DataTable from './DataTable.svelte';

// handlers
const clickHandler = (key: string) => {
	let orderByObject: { [key: string]: 'asc' | 'desc' } = {};
	let direction: 'asc' | 'desc' = 'asc';
	if (orderByMap.has(key)) {
		direction = orderByMap.get(key) === 'asc' ? 'desc' : 'asc';
	}
	orderByObject[key] = direction;
	orderBy = [orderByObject];
	rows = sortRows(rows);
};
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
export let orderBy: DataTableOrderBy = [];
export let rows: DataTableRow[];
export let selectedRows: DataTableRow[];
export let sortRows = (rows: DataTableRow[]) => {
	const [key, direction] = Object.entries(orderBy[0])[0];
	const column = columns.find((column) => column.key === key);
	if (column !== undefined) {
		rows = [...rows].sort((a, b) => {
			let comparison = 0;
			if (column.type === 'boolean') comparison = a[key] === b[key] ? 0 : a[key] ? -1 : 1;
			if (column.type === 'dateTime') comparison = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
			if (column.type === 'int') comparison = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
			if (column.type === 'string') comparison = a[key].localeCompare(b[key]);
			return comparison * (directionMap.get(direction) || 1);
		});
	}
	return rows;
};

// props (internal)
const directionMap = new Map([
	['asc', 1],
	['desc', -1]
]);

// props (dynamic)
$: orderByMap = orderBy.reduce((map, obj) => {
	const [key] = Object.keys(obj);
	const [direction] = Object.values(obj);
	map.set(key, direction);
	return map;
}, new Map());
$: src = rows.length === selectedRows.length ? Check : selectedRows.length > 0 ? Minus : undefined;
</script>

<Thead>
	{#if isDeleteable}
		<Th>
			<Checkbox
				bind:checked={isDeleteableValue}
				on:change={isDeleteableChangeHandler}
				tabindex="-1"
			>
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
	{#each columns as { key, label }}
		<Th>
			<div class="flex items-center justify-between space-x-4">
				<div>{label}</div>
				{#if orderByMap.has(key)}
					<Icon
						class={twMerge("h-4 w-4 transition duration-200", orderByMap.get(key)==='asc'?undefined:'rotate-180')}
						src={ChevronDown}
					/>
				{/if}
			</div>
			<Button
				class="absolute left-0 top-0 h-full w-full rounded-none ring-1 ring-inset hover:ring-primary-500/30"
				on:click={() => clickHandler(key)}
				tabindex="-1"
				variants={['transparent']}
			/>
		</Th>
	{/each}
</Thead>
