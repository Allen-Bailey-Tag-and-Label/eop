<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { ChevronDown, Trash, TriangleAlert } from '$lib/icons';

	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import Div from '../Div/Div.svelte';
	import P from '../P/P.svelte';
	import Table from '../Table/Table.svelte';
	import Tbody from '../Tbody/Tbody.svelte';
	import Td from '../Td/Td.svelte';
	import Th from '../Th/Th.svelte';
	import Thead from '../Thead/Thead.svelte';
	import Tr from '../Tr/Tr.svelte';

	import { compareFn } from './';

	type Column = string | ({ key: string } & Partial<Omit<ColumnSanitized, 'key'>>);
	type ColumnSanitized = {
		compareFn: (a: any, b: any) => any;
		key: string;
		label: string;
	};
	type Props = {
		columns: Column[];
		isDeletable?: boolean;
		isSortable?: boolean;
		rows: Row[];
		sort?: Sort;
		toolbar?: Snippet;
	};
	type Row = Record<string, any>;
	type Sort = Partial<SortSanitized>;
	type SortSanitized = {
		direction: 'asc' | 'desc';
		index: number;
		key: string;
	};

	let isAllRowsSelected = $state(false);
	let isDeleteDialogOpen = $state(false);
	let {
		columns = $bindable(),
		isDeletable = true,
		isSortable = true,
		rows = $bindable([]),
		sort = $bindable({ direction: 'asc', index: -1, key: '' }),
		toolbar
	}: Props = $props();
	let rowsCheckboxValues: boolean[] = $state([]);
	let sortSanitized: SortSanitized = $state({
		direction: 'asc',
		index: -1,
		key: ''
	});

	const columnsSanitized: ColumnSanitized[] = $derived.by(() => {
		return columns.map((column) => {
			const columnDefault: ColumnSanitized = {
				compareFn: compareFn.string,
				key: '',
				label: ''
			};
			const columnSanitized: ColumnSanitized = Object.assign(
				columnDefault,
				typeof column === 'string' ? { key: column, label: column } : column
			);

			untrack(() => {
				if (rows.length > 0) {
					for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
						if (rows[rowIndex][columnSanitized.key] !== null) {
							columnSanitized.compareFn = compareFn[typeof rows[rowIndex][columnSanitized.key]];
							if (typeof rows[rowIndex][columnSanitized.key] === 'boolean')
								columnSanitized.compareFn = compareFn.boolean;
							if (typeof rows[rowIndex][columnSanitized.key] === 'number')
								columnSanitized.compareFn = compareFn.number;
							break;
						}
					}
				}
			});

			return columnSanitized;
		});
	});
	const rowsSelected: boolean[] = $derived.by(() =>
		rowsCheckboxValues.filter((rowCheckboxValue) => rowCheckboxValue)
	);

	$effect(() => {
		if (rows.length > rowsCheckboxValues.length) {
			rowsCheckboxValues = [
				...rowsCheckboxValues,
				...Array(rows.length - rowsCheckboxValues.length).fill(false)
			];
		}
	});
	$effect(() => {
		if (JSON.stringify(sort)) {
			untrack(() => {
				if (sort?.direction) sortSanitized.direction = sort.direction;
				if (sort?.index) sortSanitized.index = sort.index;
				if (sort?.key) sortSanitized.key = sort.key;
			});
		}

		if (columnsSanitized.length > 0) {
			untrack(() => {
				if (sortSanitized.index === -1 && sortSanitized.key === '') {
					sortSanitized.index = 0;
					sortSanitized.key = columnsSanitized[0].key;
				}
				if (sortSanitized.index === -1 && sortSanitized.key !== '')
					sortSanitized.index = columnsSanitized.findIndex(
						(columnSanitized) => columnSanitized.key === sortSanitized.key
					);
				if (sortSanitized.index !== -1 && sortSanitized.key === '')
					sortSanitized.key = columnsSanitized[sortSanitized.index].key;
			});
		}
	});
	$effect(() => {
		if (isSortable && JSON.stringify(sortSanitized))
			untrack(() => {
				const indexes = Array.from(rows.keys()).sort(
					(a, b) =>
						columnsSanitized[sortSanitized.index].compareFn(
							rows[a][sortSanitized.key],
							rows[b][sortSanitized.key]
						) * (sortSanitized.direction === 'asc' ? 1 : -1)
				);
				rows = indexes.map((index) => rows[index]);
				rowsCheckboxValues = indexes.map((index) => rowsCheckboxValues[index]);
			});
	});
</script>

<Card class="flex flex-col overflow-auto p-0">
	{#if toolbar}
		{@render toolbar()}
	{:else}
		<Div class="flex items-center justify-end px-6 py-3">
			<Button
				disabled={rowsSelected.length > 0 ? undefined : true}
				isIcon={true}
				onclick={() => (isDeleteDialogOpen = true)}
				theme="error"
			>
				<Trash />
			</Button>
		</Div>
	{/if}
	<Div class="relative flex flex-col overflow-auto">
		<Table>
			<Thead class="sticky top-0">
				<Tr>
					<Th class="relative z-10 w-6">
						<Checkbox
							bind:checked={isAllRowsSelected}
							class="bg-slate-950 dark:bg-slate-50"
							onchange={() => {
								rowsCheckboxValues = rowsCheckboxValues.map((_) => isAllRowsSelected);
							}}
						/>
					</Th>
					{#each columnsSanitized as { key, label }, index}
						<Th class="px-0 py-0">
							<Button
								class="flex w-full items-center justify-between"
								isRounded={false}
								onclick={() => {
									if (isSortable) {
										sortSanitized = {
											direction:
												sortSanitized.key !== key
													? 'asc'
													: sortSanitized.direction === 'asc'
														? 'desc'
														: 'asc',
											index,
											key
										};
									}
								}}
								theme="ghost"
							>
								<Div>{label}</Div>
								{#if isSortable}
									<ChevronDown
										class={twMerge(
											'transition duration-200',
											key === sortSanitized.key ? 'scale-100' : 'scale-0',
											sortSanitized.direction === 'asc' ? 'rotate-0' : 'rotate-180'
										)}
										size={16}
									/>
								{/if}
							</Button>
						</Th>
					{/each}
				</Tr>
			</Thead>
			<Tbody>
				{#each rows as row, rowIndex}
					<Tr>
						<Td>
							{#if rowsCheckboxValues[rowIndex] !== undefined}
								<Checkbox bind:checked={rowsCheckboxValues[rowIndex]} />
							{/if}
						</Td>
						{#each columnsSanitized as { key }}
							<Td>{row[key] || JSON.stringify(row[key], null, 2)}</Td>
						{/each}
					</Tr>
				{/each}
			</Tbody>
		</Table>
	</Div>
</Card>

<Dialog bind:open={isDeleteDialogOpen}>
	<Card class="items-center space-y-6">
		<Div class="text-red-500">
			<TriangleAlert size={80} />
		</Div>
		<P>
			Are you sure you want to delete {rowsSelected.length} row{rowsSelected.length === 1
				? ''
				: 's'}?<br />
			This cannot be undone.
		</P>
		<Div class="grid w-full grid-cols-2 gap-4">
			<Button onclick={() => (isDeleteDialogOpen = false)} theme="contrast">Cancel</Button>
			<Button
				autoFocus={true}
				onclick={() => {
					rows = rows.filter((_, rowIndex) => !rowsCheckboxValues[rowIndex]);
					rowsCheckboxValues = rowsCheckboxValues.filter((rowCheckboxValue) => !rowCheckboxValue);
					isDeleteDialogOpen = false;
				}}
				theme="error"
			>
				Delete
			</Button>
		</Div>
	</Card>
</Dialog>
