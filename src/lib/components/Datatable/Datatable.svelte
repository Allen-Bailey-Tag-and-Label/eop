<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import {
		ChevronDown,
		ChevronFirst,
		ChevronLast,
		ChevronLeft,
		ChevronRight,
		Funnel,
		Plus,
		Trash,
		TriangleAlert
	} from '$lib/icons';
	import { currency, dateTime, inputDateTimeLocal } from '$lib/formats';
	import { theme as themeStore } from '$lib/theme';

	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import Div from '../Div/Div.svelte';
	import Input from '../Input/Input.svelte';
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
		filterOperatorOptions,
		type ColumnType,
		type PaginationSanitized,
		type Props,
		type SortSanitized,
		type TdSnippet
	} from './';
	import { type RowSanitized } from './types';

	let {
		columns = $bindable([]),
		columnsSanitized = $bindable([]),
		create = $bindable({}),
		createDialog,
		deleteDialog,
		filters = $bindable([]),
		filterDialog,
		filterKeyOptions = $bindable([]),
		filtersTemp = $bindable([]),
		filtersTempSanitized = $bindable([]),
		isCreatable = true,
		isCreateDialogOpen = $bindable(false),
		isDeletable = true,
		isDeleteDialogOpen = $bindable(false),
		isEditable = true,
		isFilterable = true,
		isFilterDialogOpen = $bindable(false),
		isSortable = true,
		pagination = $bindable(true),
		rows = $bindable([]),
		rowsCheckboxValues = $bindable([]),
		rowsSelected = $bindable([]),
		sort = $bindable({ direction: 'asc', index: -1, key: '' }),
		tbody,
		thead,
		toolbar
	}: Props = $props();
	let isAllRowsSelected = $state(false);
	let paginationSanitized: PaginationSanitized = $state({
		currentPage: 0,
		rowsPerPage: 10
	});
	let sortSanitized: SortSanitized = $state({
		direction: 'asc',
		index: -1,
		key: ''
	});
	const tdSnippetMap: Map<ColumnType, Snippet<[TdSnippet]>> = new Map([
		['bigint', bigintTd],
		['boolean', booleanTd],
		['currency', currencyTd],
		['function', functionTd],
		['number', numberTd],
		['object', objectTd],
		['select', selectTd],
		['string', stringTd],
		['symbol', symbolTd],
		['timestamp', timestampTd],
		['undefined', undefinedTd]
	]);

	// $derives
	const columnInferredTypes: ColumnType[] = $derived.by(() => {
		return columns.map((column) => {
			const key = typeof column === 'string' ? column : column.key;
			let type: ColumnType = 'string';

			if (rows.length > 0) {
				for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
					if (rows[rowIndex][key] !== null) {
						type = typeof rows[rowIndex][key];
						break;
					}
				}
			}

			return type;
		});
	});
	const isSelectable: boolean = $derived.by(() => isDeletable);
	const isToolbarVisible: boolean = $derived.by(() => isCreatable || isDeletable || isFilterable);
	const paginationIndexes: { start: number; end: number } = $derived.by(() => {
		const start = paginationSanitized.currentPage * paginationSanitized.rowsPerPage;
		let end = start + paginationSanitized.rowsPerPage;
		if (end > rowsFiltered.length) end = rowsFiltered.length;
		return { start, end };
	});
	const paginationTotalPages: number = $derived.by(() =>
		Math.ceil(rowsFiltered.length / paginationSanitized.rowsPerPage)
	);
	const paginationOptions: { label: string; value: number }[] = $derived.by(() => {
		if (paginationTotalPages === 0) return [{ label: '0-0', value: 0 }];
		return Array(paginationTotalPages)
			.fill(0)
			.map((_, value) => {
				const start = value * paginationSanitized.rowsPerPage;
				let end = start + paginationSanitized.rowsPerPage;
				if (end > rowsFiltered.length) end = rowsFiltered.length;
				return { label: `${start + 1}-${end}`, value };
			});
	});
	const rowsSanitized: RowSanitized[] = $derived.by(() =>
		rows.map((row, index) => ({ index, isSelected: false, row }))
	);
	const rowsFiltered: RowSanitized[] = $derived.by(() =>
		rowsSanitized.filter(({ row }) => {
			return filters.every(({ key, operator, value }) => {
				const cell = row[key];

				switch (operator) {
					case 'contains':
						return typeof cell === 'string' && cell.toLowerCase().includes(value.toLowerCase());
					case 'does not contain':
						return typeof cell === 'string' && !cell.toLowerCase().includes(value.toLowerCase());
					case 'does not equal':
						return cell !== value;
					case 'equals':
						return cell === value;
					case 'greater than':
						return parseFloat(cell) > parseFloat(value);
					case 'greater than or equals':
						return parseFloat(cell) >= parseFloat(value);
					case 'less than':
						return parseFloat(cell) < parseFloat(value);
					case 'less than or equals':
						return parseFloat(cell) <= parseFloat(value);
					default:
						return true;
				}
			});
		})
	);
	const rowsPaginated: RowSanitized[] = $derived.by(() =>
		rowsFiltered.filter((_, rowIndex) => {
			if (pagination === false) return true;
			if (rowIndex >= paginationIndexes.start && rowIndex < paginationIndexes.end) return true;
			return false;
		})
	);

	// $effects
	$effect(() => {
		columnsSanitized = columns.map((column, columnIndex) => {
			const inferredType = untrack(() => columnInferredTypes[columnIndex]);
			const inferredSnippet = tdSnippetMap.get(inferredType);

			const columnSanitized = typeof column === 'string' ? { key: column, label: column } : column;

			const type = columnSanitized.type ?? inferredType;
			const snippet =
				columnSanitized.snippet ??
				(columnSanitized.type && tdSnippetMap.get(columnSanitized.type)) ??
				inferredSnippet ??
				stringTd;

			return {
				compareFn: columnSanitized.compareFn ?? compareFn[inferredType],
				isCreatable: columnSanitized.isCreatable ?? isCreatable,
				isEditable: columnSanitized.isEditable ?? isEditable,
				isFilterable: columnSanitized.isFilterable ?? isFilterable,
				key: columnSanitized.key,
				label: columnSanitized.label ?? columnSanitized.key,
				options: columnSanitized.options ?? [],
				snippet,
				type
			};
		});
	});
	$effect(() => {
		filterKeyOptions = [
			{ label: '', value: '' },
			...columnsSanitized
				.filter(({ isFilterable }) => isFilterable)
				.map(({ label, key }) => ({ label, value: key }))
		];
	});
	$effect(() => {
		filtersTempSanitized = filtersTemp
			.map((filterTemp) => {
				const columnSanitized = columnsSanitized.find(
					(columnSanitized) => columnSanitized.key === filterTemp.key
				);
				if (columnSanitized === undefined) return null;
				const options = columnSanitized.options;
				const snippet = columnSanitized.snippet;
				return { ...filterTemp, options, snippet };
			})
			.filter((value) => value !== null);
	});
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
		if (paginationSanitized.currentPage > paginationTotalPages - 1)
			paginationSanitized.currentPage = paginationTotalPages - 1;
		if (paginationSanitized.currentPage < 0) paginationSanitized.currentPage = 0;
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
		rowsSelected = rowsCheckboxValues.filter((rowCheckboxValue) => rowCheckboxValue);
	});
	$effect(() => {
		if (JSON.stringify(sort)) {
			untrack(() => {
				if (sort?.direction) sortSanitized.direction = sort.direction;
				if (typeof sort?.index === 'number') sortSanitized.index = sort.index;
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
				const indexes = Array.from(rows.keys()).sort((a, b) => {
					const sortColumn = columnsSanitized[sortSanitized.index];
					if (sortColumn === undefined) return 0;
					return (
						sortColumn.compareFn(rows[a][sortSanitized.key], rows[b][sortSanitized.key]) *
						(sortSanitized.direction === 'asc' ? 1 : -1)
					);
				});
				rows = indexes.map((index) => rows[index]);
				rowsCheckboxValues = indexes.map((index) => rowsCheckboxValues[index]);
			});
	});
</script>

<Card class="flex flex-col overflow-auto p-0">
	{#if toolbar}
		{@render toolbar()}
	{:else if isToolbarVisible}
		<Div class="flex items-center justify-end space-x-2 px-6 py-3">
			{#if isDeletable}
				<Button
					disabled={rowsSelected.length > 0 ? undefined : true}
					onclick={() => (isDeleteDialogOpen = true)}
					variants={['error', 'icon']}
				>
					<Trash />
				</Button>
			{/if}
			{#if isFilterable}
				<Button
					onclick={() => {
						filtersTemp = $state.snapshot(filters);
						isFilterDialogOpen = true;
					}}
					variants={['icon']}
				>
					<Funnel />
				</Button>
			{/if}
			{#if isCreatable}
				<Button
					onclick={() => {
						create = columnsSanitized.reduce((obj, { key, type }) => {
							if (type === 'bigint') obj[key] = BigInt(0);
							if (type === 'boolean') obj[key] = false;
							if (type === 'currency') obj[key] = 0;
							if (type === 'function') obj[key] = () => {};
							if (type === 'number') obj[key] = 0;
							if (type === 'object') obj[key] = {};
							if (type === 'select') obj[key] = '';
							if (type === 'string') obj[key] = '';
							if (type === 'symbol') obj[key] = Symbol('');
							if (type === 'timestamp') obj[key] = new Date();
							return obj;
						}, {});
						isCreateDialogOpen = true;
					}}
					variants={['icon']}
				>
					<Plus />
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
									class="flex w-full items-center justify-between text-gray-500"
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
											if (sort.direction !== undefined) sort.direction = sortSanitized.direction;
											if (sort.index !== undefined) sort.index = sortSanitized.index;
											if (sort.key !== undefined) sort.key = sortSanitized.key;
										}
									}}
									variants={['ghost', 'square']}
								>
									<Div class={twMerge($themeStore.Th.default, 'px-0 py-0 whitespace-nowrap')}>
										{label}
									</Div>
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
					{#each rowsPaginated as { index: rowIndex }}
						<Tr>
							{#if isSelectable}
								<Td>
									{#if rowsCheckboxValues[rowIndex] !== undefined}
										<Checkbox bind:checked={rowsCheckboxValues[rowIndex]} />
									{/if}
								</Td>
							{/if}
							{#each columnsSanitized as { isEditable, key, options, snippet }}
								{@render snippet({ isEditable, key, object: rows[rowIndex], options })}
							{/each}
						</Tr>
					{/each}
				</Tbody>
			{/if}
		</Table>
	</Div>
	{#if pagination !== false}
		<Div class="flex items-center justify-center space-x-2 px-6 py-3 lg:space-x-4">
			<Button
				disabled={paginationSanitized.currentPage === 0 ? 'disabled' : undefined}
				onclick={() => (paginationSanitized.currentPage = 0)}
				variants={['icon']}
			>
				<ChevronFirst />
			</Button>
			<Button
				disabled={paginationSanitized.currentPage === 0 ? 'disabled' : undefined}
				onclick={() => paginationSanitized.currentPage--}
				variants={['icon']}
			>
				<ChevronLeft />
			</Button>
			<Select bind:value={paginationSanitized.currentPage} options={paginationOptions} />
			<Button
				disabled={paginationSanitized.currentPage === Math.max(0, paginationTotalPages - 1)
					? 'disabled'
					: undefined}
				onclick={() => paginationSanitized.currentPage++}
				variants={['icon']}
			>
				<ChevronRight />
			</Button>
			<Button
				disabled={paginationSanitized.currentPage === Math.max(0, paginationTotalPages - 1)
					? 'disabled'
					: undefined}
				onclick={() => (paginationSanitized.currentPage = paginationTotalPages - 1)}
				variants={['icon']}
			>
				<ChevronLast />
			</Button>
		</Div>
	{/if}
</Card>

{#if createDialog}
	{@render createDialog()}
{:else}
	<Dialog bind:open={isCreateDialogOpen}>
		<Card class="space-y-6">
			<Table>
				<Tbody>
					{#each columnsSanitized as { isCreatable, key, label, options, snippet }}
						{#if isCreatable}
							<Tr>
								<Td class="whitespace-nowrap">{label}</Td>
								{@render snippet({ isEditable: true, key, object: create, options })}
							</Tr>
						{/if}
					{/each}
				</Tbody>
			</Table>
			<Div class="flex justify-end space-x-2">
				<Button
					onclick={() => {
						rows.push({ ...create });
						isCreateDialogOpen = false;
					}}
				>
					Add
				</Button>
				<Button onclick={() => (isCreateDialogOpen = false)} variants={['ghost']}>Cancel</Button>
			</Div>
		</Card>
	</Dialog>
{/if}

{#if deleteDialog}
	{@render deleteDialog()}
{:else}
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
				<Button onclick={() => (isDeleteDialogOpen = false)} variants={['contrast']}>Cancel</Button>
				<Button
					autoFocus={true}
					onclick={() => {
						rows = rows.filter((_, rowIndex) => !rowsCheckboxValues[rowIndex]);
						rowsCheckboxValues = rowsCheckboxValues.filter((rowCheckboxValue) => !rowCheckboxValue);
						isDeleteDialogOpen = false;
					}}
					variants={['error']}
				>
					Delete
				</Button>
			</Div>
		</Card>
	</Dialog>
{/if}

{#if filterDialog}
	{@render filterDialog()}
{:else}
	<Dialog bind:open={isFilterDialogOpen}>
		<Card class="space-y-6">
			<Div class="flex items-center justify-end space-x-2">
				<Button
					onclick={() => {
						filtersTemp.push({ key: '', operator: '', options: [], value: '' });
					}}
				>
					<Div class="flex items-center space-x-2">
						<Plus />
						<Div>Add Filter</Div>
					</Div>
				</Button>
				<Button onclick={() => (filtersTemp = [])} variants={['ghost']}>Clear Filters</Button>
			</Div>
			<Table>
				<Thead>
					<Tr>
						<Th></Th>
						<Th>Column</Th>
						<Th>Operator</Th>
						<Th>Value</Th>
					</Tr>
				</Thead>
				<Tbody>
					{#if filtersTemp.length === 0}
						<Tr>
							<Td colspan="4">No Filters</Td>
						</Tr>
					{:else}
						{#each filtersTemp as _, filterTempIndex}
							<Tr>
								<Td class="px-2 py-0">
									<Button
										class="w-10"
										onclick={() => {
											filtersTemp = filtersTemp.filter((_, i) => filterTempIndex !== i);
										}}
										variants={['icon', 'error']}
									>
										<Trash />
									</Button>
								</Td>
								<Td class="p-0">
									<Select
										bind:value={filtersTemp[filterTempIndex].key}
										class="rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
										options={filterKeyOptions}
									/>
								</Td>
								<Td class="p-0">
									<Select
										bind:value={filtersTemp[filterTempIndex].operator}
										class="rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
										options={filterOperatorOptions}
									/>
								</Td>
								{#if filtersTempSanitized?.[filterTempIndex]?.snippet === undefined}
									<Td></Td>
								{:else}
									{@render filtersTempSanitized[filterTempIndex].snippet({
										isEditable: true,
										key: 'value',
										object: filtersTemp[filterTempIndex],
										options: filtersTempSanitized[filterTempIndex].options
									})}
								{/if}
							</Tr>
						{/each}
					{/if}
				</Tbody>
			</Table>
			<Div class="flex justify-end space-x-2">
				<Button
					onclick={() => {
						filters = $state
							.snapshot(filtersTemp)
							.filter(({ key, operator }) => key !== '' && operator !== '');
						isFilterDialogOpen = false;
					}}
				>
					Apply
				</Button>
				<Button onclick={() => (isFilterDialogOpen = false)} variants={['ghost']}>Cancel</Button>
			</Div>
		</Card>
	</Dialog>
{/if}

{#snippet bigintTd({ isEditable, key, object }: TdSnippet)}
	<Td>Bigint</Td>
{/snippet}
{#snippet booleanTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable && object[key] !== undefined}
		<Td>
			<Checkbox bind:checked={object[key]} />
		</Td>
	{:else}
		<Td class="uppercase">{object[key]}</Td>
	{/if}
{/snippet}
{#snippet currencyTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable && object[key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={
					() => {
						return currency(object[key]);
					},
					(string) => {
						const value = parseFloat(string.replace(/[^0-9.-]+/g, ''));
						object[key] = value;
					}
				}
				class={twMerge(
					$themeStore.Input.default,
					'rounded-none bg-transparent text-right outline-transparent dark:bg-transparent dark:outline-transparent'
				)}
				contenteditable={true}
			>
				{object[key]}
			</Div>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap"
			>{currency(object[key] || JSON.stringify(object[key], null, 2))}</Td
		>
	{/if}
{/snippet}
{#snippet functionTd({ isEditable, key, object }: TdSnippet)}
	<Td>{object[key] || JSON.stringify(object[key], null, 2)}</Td>
{/snippet}
{#snippet numberTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable && object[key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={
					() => {
						return typeof object[key] === 'number' ? object[key].toString() : object[key];
					},
					(value) => {
						value = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]+/g, ''));
						object[key] = value;
					}
				}
				class={twMerge(
					$themeStore.Input.default,
					'rounded-none bg-transparent text-right outline-transparent dark:bg-transparent dark:outline-transparent'
				)}
				contenteditable={true}
			>
				{object[key]}
			</Div>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap"
			>{object[key] || JSON.stringify(object[key], null, 2)}</Td
		>
	{/if}
{/snippet}
{#snippet objectTd({ isEditable, key, object }: TdSnippet)}
	<Td class="whitespace-nowrap">{object[key] || JSON.stringify(object[key], null, 2)}</Td>
{/snippet}
{#snippet selectTd({ isEditable, key, object, options }: TdSnippet)}
	{#if isEditable && object[key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Select
				bind:value={object[key]}
				class="rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
				{options}
			/>
		</Td>
	{:else}
		<Td class="whitespace-nowrap">{object[key] || ''}</Td>
	{/if}
{/snippet}
{#snippet stringTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable && object[key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={object[key]}
				class={twMerge(
					$themeStore.Input.default,
					'rounded-none bg-transparent whitespace-nowrap outline-transparent dark:bg-transparent dark:outline-transparent'
				)}
				contenteditable={true}
			>
				{object[key]}
			</Div>
		</Td>
	{:else}
		<Td class="whitespace-nowrap">{object[key] || ''}</Td>
	{/if}
{/snippet}
{#snippet symbolTd({ isEditable, key, object }: TdSnippet)}
	<Td>Symbol</Td>
{/snippet}
{#snippet timestampTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable && object[key] !== undefined}
		<Td class="hover:outline-primary-500/0 p-0">
			<Input
				bind:value={
					() => {
						return inputDateTimeLocal(object[key]);
					},
					(value: string) => {
						object[key] = new Date(value);
					}
				}
				class="w-full rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
				type="datetime-local"
			/>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap">{dateTime(object[key])}</Td>
	{/if}
{/snippet}
{#snippet undefinedTd({ isEditable, key, object }: TdSnippet)}
	<Td class="whitespace-nowrap">{object[key] || JSON.stringify(object[key], null, 2)}</Td>
{/snippet}
