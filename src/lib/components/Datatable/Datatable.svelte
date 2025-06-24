<script lang="ts">
	import { untrack } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import {
		ChevronDown,
		ChevronFirst,
		ChevronLast,
		ChevronLeft,
		ChevronRight,
		Trash,
		TriangleAlert
	} from '$lib/icons';
	import { currency } from '$lib/formats';

	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import Div from '../Div/Div.svelte';
	import P from '../P/P.svelte';
	import Select from '../Select/Select.svelte';
	import Table from '../Table/Table.svelte';
	import Tbody from '../Tbody/Tbody.svelte';
	import Td from '../Td/Td.svelte';
	import Th from '../Th/Th.svelte';
	import Thead from '../Thead/Thead.svelte';
	import Tr from '../Tr/Tr.svelte';

	import {
		compareFn,
		type ColumnSanitized,
		type PaginationSanitized,
		type Props,
		type SortSanitized,
		type TdSnippet
	} from './';

	const initColumnSanitized = (key: string) => {
		const columnSanitized: ColumnSanitized = {
			compareFn: compareFn.string,
			isEditable,
			key,
			label: key,
			snippet: stringTd,
			type: 'string'
		};

		if (rows.length > 0) {
			for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
				if (rows[rowIndex][key] !== null) {
					const type = typeof rows[rowIndex][key];
					columnSanitized.compareFn = compareFn[type];
					columnSanitized.snippet = tdSnippetMap.get(type) || stringTd;
					columnSanitized.type = type;
					break;
				}
			}
		}

		return columnSanitized;
	};
	let isAllRowsSelected = $state(false);
	let isDeleteDialogOpen = $state(false);
	let paginationSanitized: PaginationSanitized = $state({
		currentPage: 0,
		rowsPerPage: 10
	});
	let {
		columns = $bindable(),
		isDeletable = true,
		isEditable = true,
		isSortable = true,
		pagination = $bindable(true),
		rows = $bindable([]),
		sort = $bindable({ direction: 'asc', index: -1, key: '' }),
		tbody,
		thead,
		toolbar
	}: Props = $props();
	let rowsCheckboxValues: boolean[] = $state([]);
	let sortSanitized: SortSanitized = $state({
		direction: 'asc',
		index: -1,
		key: ''
	});
	const tdSnippetMap = new Map([
		['bigint', bigintTd],
		['boolean', booleanTd],
		['currency', currencyTd],
		['function', functionTd],
		['number', numberTd],
		['object', objectTd],
		['string', stringTd],
		['symbol', symbolTd],
		['undefined', undefinedTd]
	]);

	// $derives
	const columnsSanitized: ColumnSanitized[] = $derived.by(() => {
		return columns.map((column) => {
			const columnSanitized: ColumnSanitized =
				typeof column === 'string'
					? untrack(() => initColumnSanitized(column))
					: {
							compareFn: column?.compareFn || compareFn[column?.type || 'string'],
							isEditable,
							key: column.key,
							label: column?.label || column.key,
							snippet: column?.snippet || tdSnippetMap.get(column?.type || 'string') || stringTd,
							type: column?.type || 'string'
						};

			return columnSanitized;
		});
	});
	const isSelectable: boolean = $derived.by(() => isDeletable);
	const paginationIndexes: { start: number; end: number } = $derived.by(() => {
		const start = paginationSanitized.currentPage * paginationSanitized.rowsPerPage;
		let end = start + paginationSanitized.rowsPerPage;
		if (end > rows.length) end = rows.length;
		return { start, end };
	});
	const paginationTotalPages: number = $derived.by(() =>
		Math.ceil(rows.length / paginationSanitized.rowsPerPage)
	);
	const paginationOptions: { label: string; value: number }[] = $derived.by(() => {
		if (paginationTotalPages === 0) return [{ label: '0-0', value: 0 }];
		return Array(paginationTotalPages)
			.fill(0)
			.map((_, value) => {
				const start = value * paginationSanitized.rowsPerPage;
				let end = start + paginationSanitized.rowsPerPage;
				if (end > rows.length) end = rows.length;
				return { label: `${start + 1}-${end}`, value };
			});
	});
	const rowsSelected: boolean[] = $derived.by(() =>
		rowsCheckboxValues.filter((rowCheckboxValue) => rowCheckboxValue)
	);

	// $effects
	$effect(() => {
		if (JSON.stringify(pagination)) {
			untrack(() => {
				if (pagination === true)
					paginationSanitized = Object.assign(
						{ currentPage: 0, rowsPerPage: 10 },
						paginationSanitized
					);
				if (typeof pagination === 'object')
					paginationSanitized = Object.assign(paginationSanitized, pagination);
			});
		}
	});
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
			{#if isDeletable}
				<Button
					disabled={rowsSelected.length > 0 ? undefined : true}
					isIcon={true}
					onclick={() => (isDeleteDialogOpen = true)}
					theme="error"
				>
					<Trash />
				</Button>
			{/if}
		</Div>
	{/if}
	<Div class="relative flex flex-col overflow-auto">
		<Table class="bg-transparent dark:bg-transparent">
			{#if thead}
				{@render thead()}
			{:else}
				<Thead class="sticky top-0">
					<Tr>
						{#if isSelectable}
							<Th class="relative z-10 w-6">
								<Checkbox
									bind:checked={isAllRowsSelected}
									class="bg-slate-950 dark:bg-slate-50"
									onchange={() => {
										rowsCheckboxValues = rowsCheckboxValues.map((_, rowIndex) => {
											if (pagination !== false) {
												if (rowIndex < paginationIndexes.start || rowIndex >= paginationIndexes.end)
													return false;
											}
											return isAllRowsSelected;
										});
									}}
								/>
							</Th>
						{/if}
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
			{/if}
			{#if tbody}
				{@render tbody()}
			{:else}
				<Tbody>
					{#each rows as row, rowIndex}
						{#if pagination === false || (rowIndex >= paginationIndexes.start && rowIndex < paginationIndexes.end)}
							<Tr>
								{#if isSelectable}
									<Td>
										{#if rowsCheckboxValues[rowIndex] !== undefined}
											<Checkbox bind:checked={rowsCheckboxValues[rowIndex]} />
										{/if}
									</Td>
								{/if}
								{#each columnsSanitized as { isEditable, key, snippet }}
									{@render snippet({ isEditable, key, row, rowIndex })}
								{/each}
							</Tr>
						{/if}
					{/each}
				</Tbody>
			{/if}
		</Table>
	</Div>
	{#if pagination !== false}
		<Div class="flex items-center justify-center space-x-2 px-6 py-3 lg:space-x-4">
			<Button
				disabled={paginationSanitized.currentPage === 0 ? 'disabled' : undefined}
				isIcon={true}
				onclick={() => (paginationSanitized.currentPage = 0)}
			>
				<ChevronFirst />
			</Button>
			<Button
				disabled={paginationSanitized.currentPage === 0 ? 'disabled' : undefined}
				isIcon={true}
				onclick={() => paginationSanitized.currentPage--}
			>
				<ChevronLeft />
			</Button>
			<Select bind:value={paginationSanitized.currentPage} options={paginationOptions} />
			<Button
				disabled={paginationSanitized.currentPage === Math.max(0, paginationTotalPages - 1)
					? 'disabled'
					: undefined}
				isIcon={true}
				onclick={() => paginationSanitized.currentPage++}
			>
				<ChevronRight />
			</Button>
			<Button
				disabled={paginationSanitized.currentPage === Math.max(0, paginationTotalPages - 1)
					? 'disabled'
					: undefined}
				isIcon={true}
				onclick={() => (paginationSanitized.currentPage = paginationTotalPages - 1)}
			>
				<ChevronLast />
			</Button>
		</Div>
	{/if}
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

{#snippet bigintTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	<Td>Bigint</Td>
{/snippet}
{#snippet booleanTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	{#if isEditable && rows[rowIndex][key] !== undefined}
		<Td>
			<Checkbox bind:checked={rows[rowIndex][key]} />
		</Td>
	{:else}
		<Td class="uppercase">{row[key]}</Td>
	{/if}
{/snippet}
{#snippet currencyTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	{#if isEditable && rows[rowIndex][key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={
					() => {
						return currency(rows[rowIndex][key]);
					},
					(string) => {
						const value = parseFloat(string.replace(/[^0-9.-]+/g, ''));
						rows[rowIndex][key] = value;
					}
				}
				class="focus:outline-primary-500 outline-primary-500/0 hover:outline-primary-500 rounded-none bg-transparent p-3 text-right outline-1 backdrop-blur-none focus:outline-1 dark:bg-transparent"
				contenteditable={true}
			>
				{rows[rowIndex][key]}
			</Div>
		</Td>
	{:else}
		<Td class="text-right">{currency(row[key] || JSON.stringify(row[key], null, 2))}</Td>
	{/if}
{/snippet}
{#snippet functionTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	<Td>{row[key] || JSON.stringify(row[key], null, 2)}</Td>
{/snippet}
{#snippet numberTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	{#if isEditable && rows[rowIndex][key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={
					() => {
						return typeof rows[rowIndex][key] === 'number'
							? rows[rowIndex][key].toString()
							: rows[rowIndex][key];
					},
					(value) => {
						value = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]+/g, ''));
						rows[rowIndex][key] = value;
					}
				}
				class="focus:outline-primary-500 outline-primary-500/0 hover:outline-primary-500 rounded-none bg-transparent p-3 text-right outline-1 backdrop-blur-none focus:outline-1 dark:bg-transparent"
				contenteditable={true}
			>
				{rows[rowIndex][key]}
			</Div>
		</Td>
	{:else}
		<Td class="text-right">{row[key] || JSON.stringify(row[key], null, 2)}</Td>
	{/if}
{/snippet}
{#snippet objectTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	<Td>{row[key] || JSON.stringify(row[key], null, 2)}</Td>
{/snippet}
{#snippet stringTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	{#if isEditable && rows[rowIndex][key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={rows[rowIndex][key]}
				class="focus:outline-primary-500 outline-primary-500/0 hover:outline-primary-500 rounded-none bg-transparent p-3 outline-1 backdrop-blur-none focus:outline-1 dark:bg-transparent"
				contenteditable={true}
			>
				{rows[rowIndex][key]}
			</Div>
		</Td>
	{:else}
		<Td>{row[key] || JSON.stringify(row[key], null, 2)}</Td>
	{/if}
{/snippet}
{#snippet symbolTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	<Td>Symbol</Td>
{/snippet}
{#snippet undefinedTd({ isEditable, key, row, rowIndex }: TdSnippet)}
	<Td>{row[key] || JSON.stringify(row[key], null, 2)}</Td>
{/snippet}
