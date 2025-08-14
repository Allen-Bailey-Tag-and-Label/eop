<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import {
		ArrowLeft,
		ChevronDown,
		ChevronFirst,
		ChevronLast,
		ChevronLeft,
		ChevronRight,
		Download,
		Funnel,
		Plus,
		Settings,
		Trash,
		TriangleAlert
	} from '$lib/icons';
	import { currency, dateTime, inputDateTimeLocal } from '$lib/formats';
	import { theme } from '$lib/theme';
	import {
		Button,
		Card,
		Checkbox,
		Div,
		Form,
		Input,
		Modal,
		MultiSelect,
		P,
		Radio,
		Select,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '../';

	import {
		compareFn,
		deleteAt,
		exportFunctions,
		exportOptions,
		filterOperatorOptions,
		getAt,
		setAt
	} from './';
	import type { ColumnType, Props, TdSnippet } from './types';
	import Label from '../Label/Label.svelte';

	let {
		columns = $bindable([]),
		columnInferredTypes = $bindable([]),
		columnsSanitized = $bindable([]),
		create = $bindable({}),
		createModal,
		deleteModal,
		exportOption = $bindable('clipboard'),
		filterModal,
		filterKeyOptions = $bindable([]),
		filtersTemp = $bindable([]),
		filtersTempSanitized = $bindable([]),
		isColumnsReorderable = $bindable(true),
		isCreatable = $bindable(true),
		isCreateModalOpen = $bindable(false),
		isDeletable = $bindable(true),
		isDeleteModalOpen = $bindable(false),
		isEditable = $bindable(true),
		isExportable = $bindable(true),
		isExportModalOpen = $bindable(false),
		isFilterable = $bindable(true),
		isFilterModalOpen = $bindable(false),
		isPaginateable = $bindable(true),
		isSelectable = $bindable(true),
		isSettingsModalOpen = $bindable(false),
		isSettingsVisible = $bindable(),
		isSortable = $bindable(true),
		isToolbarVisible = $bindable(true),
		pagination,
		paginationSettings = $bindable({
			indexes: {
				start: 0,
				end: 0
			},
			options: [],
			totalPages: 0
		}),
		rows = $bindable([]),
		rowsCheckboxValues = $bindable([]),
		rowsFiltered = $bindable([]),
		rowsPaginated = $bindable([]),
		rowsSanitized = $bindable([]),
		rowsSelected = $bindable([]),
		settings = $bindable({
			currentPage: 0,
			filter: [],
			rowsPerPage: 10,
			sortDirection: 'asc',
			sortKey: ''
		}),
		settingsTemp = $bindable({
			rowsPerPage: 10
		}),
		tbody,
		th,
		thead,
		toolbar,
		totalRows = $bindable()
	}: Props = $props();

	let isAllRowsSelected = $state(false);
	const getRowKey = (row: object) => {
		let key = rowKeyMap.get(row);
		if (!key) {
			const random = crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
			rowKeyMap.set(row, random);
			key = random;
		}
		return key;
	};
	const rowKeyMap = new WeakMap<object, string>();

	const tdSnippetMap: Map<ColumnType, Snippet<[TdSnippet]>> = new Map([
		['bigint', bigintTd],
		['boolean', booleanTd],
		['currency', currencyTd],
		['function', functionTd],
		['multiSelect', multiSelectTd],
		['number', numberTd],
		['object', objectTd],
		['select', selectTd],
		['string', stringTd],
		['symbol', symbolTd],
		['timestamp', timestampTd],
		['undefined', undefinedTd]
	]);

	// $effects
	$effect(() => {
		if (columns) {
			untrack(() => {
				columnInferredTypes = columns.map((column) => {
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
		}
	});
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
				class: columnSanitized.class,
				compareFn: columnSanitized.compareFn ?? compareFn[type] ?? compareFn[inferredType],
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
		const isDeletableValue = isDeletable;

		untrack(() => {
			isSelectable = isDeletableValue;
		});
	});
	$effect(() => {
		const isPaginateableValue = isPaginateable;
		untrack(() => {
			if (isSettingsVisible === undefined) isSettingsVisible = isPaginateableValue;
		});
	});
	$effect(() => {
		const isCreatableValue = isCreatable;
		const isDeletableValue = isDeletable;
		const isFilterableValue = isFilterable;

		untrack(() => {
			isToolbarVisible = isCreatableValue || isDeletableValue || isFilterableValue;
		});
	});
	$effect(() => {
		const currentPageValue = settings.currentPage ?? 0;
		const rowsPerPageValue = settings.rowsPerPage ?? 10;
		const totalRowsValue = totalRows ?? rowsFiltered.length;

		untrack(() => {
			paginationSettings.indexes.start = currentPageValue * rowsPerPageValue;
			paginationSettings.indexes.end = Math.min(
				paginationSettings.indexes.start + rowsPerPageValue,
				totalRowsValue
			);
			paginationSettings.totalPages = Math.ceil(totalRowsValue / rowsPerPageValue);
			if (paginationSettings.totalPages === 0)
				paginationSettings.options = [{ label: '0-0', value: 0 }];
			if (paginationSettings.totalPages > 0)
				paginationSettings.options = Array(paginationSettings.totalPages)
					.fill(0)
					.map((_, value) => {
						const start = value * rowsPerPageValue;
						let end = Math.min(start + rowsPerPageValue, totalRowsValue);
						return { label: `${start + 1}-${end}`, value };
					});
		});
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
		rowsFiltered = rowsSanitized.filter(({ row }) => {
			if (!settings?.filter) return;
			return settings.filter.every(({ key, operator, value }) => {
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
		});
	});
	$effect(() => {
		rowsPaginated = rowsFiltered.filter((_, rowIndex) => {
			if (isPaginateable === false) return true;
			if (rowIndex >= paginationSettings.indexes.start && rowIndex < paginationSettings.indexes.end)
				return true;
			return false;
		});
	});
	$effect(() => {
		rowsSanitized = rows.map((row, index) => ({
			_key: getRowKey(row),
			index,
			isSelected: false,
			row
		}));
	});
	$effect(() => {
		rowsSelected = rowsCheckboxValues.filter((rowCheckboxValue) => rowCheckboxValue);
	});
	$effect(() => {
		if (settings.currentPage === undefined) settings.currentPage = 0;
		if (settings.filter === undefined) settings.filter = [];
		if (settings.rowsPerPage === undefined) settings.rowsPerPage = 10;
		if (settings.sortDirection === undefined) settings.sortDirection = 'asc';
		if (settings.sortKey === undefined) settings.sortKey = columnsSanitized[0].key;
		if (settingsTemp.rowsPerPage === undefined) settingsTemp.rowsPerPage = 10;
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
					onclick={() => (isDeleteModalOpen = true)}
					variants={['error', 'icon']}
				>
					<Trash />
				</Button>
			{/if}
			{#if isExportable}
				<Button onclick={() => (isExportModalOpen = true)} variants={['icon']}>
					<Download />
				</Button>
				<Modal bind:isOpen={isExportModalOpen} class="space-y-6">
					<Div class="flex flex-col">
						<Label>Export Type</Label>
						<Div class="grid grid-cols-3 gap-2">
							{#each exportOptions as { label, value }}
								<Radio bind:group={exportOption} {value} variants={['box']}>
									{label}
								</Radio>
							{/each}
						</Div>
					</Div>
					<Div class="flex justify-end space-x-2">
						<Button
							onclick={async () => {
								const headers: string[] = columnsSanitized.map(({ label }) => label);
								const data: any[][] = rowsPaginated.map((row) =>
									columnsSanitized.map(({ key, options, type }) => {
										let value = getAt(rows[row.index], key);

										if (Array.isArray(options)) {
											if (Array.isArray(value))
												return value
													.map((v) => options.find((option) => option.value === v)?.label ?? v)
													.join(', ');
											return options.find((option) => option.value === value)?.label ?? value ?? '';
										}

										if (type === 'boolean') return value ? 'TRUE' : 'FALSE';
										if (type === 'currency') return currency(value);
										if (type === 'timestamp') {
											const date = value instanceof Date ? value : new Date(value);
											return isNaN(+date) ? '' : date.toISOString();
										}

										if (value === null || value === undefined) return '';
										if (typeof value === 'object') return JSON.stringify(value);

										return String(value);
									})
								);

								const exportFunction = exportFunctions.get(exportOption);
								if (exportFunction) await exportFunction({ data, headers });
								isExportModalOpen = false;
							}}
						>
							Export
						</Button>
						<Button onclick={() => (isExportModalOpen = false)} variants={['ghost']}>Cancel</Button>
					</Div>
				</Modal>
			{/if}
			{#if isSettingsVisible}
				<Button
					onclick={() => {
						settingsTemp.rowsPerPage = settings.rowsPerPage ?? 10;
						isSettingsModalOpen = true;
					}}
					variants={['icon']}
				>
					<Settings />
				</Button>
				<Modal bind:isOpen={isSettingsModalOpen} class="space-y-6">
					<Form
						method="GET"
						onsubmit={(e: Event) => {
							e.preventDefault();
							settings.rowsPerPage = settingsTemp.rowsPerPage;
							isSettingsModalOpen = false;
						}}
					>
						{#snippet inputs()}
							<Input
								bind:value={
									() => {
										return settingsTemp.rowsPerPage.toString();
									},
									(string) => {
										settingsTemp.rowsPerPage = +string;
									}
								}
								class="text-right"
								label="Rows Per Page"
								type="number"
							/>
						{/snippet}
						{#snippet buttons()}
							<Button type="submit">Update</Button>
							<Button onclick={() => (isSettingsModalOpen = false)} variants={['ghost']}>
								Cancel
							</Button>
						{/snippet}
					</Form>
				</Modal>
			{/if}
			{#if isFilterable}
				<Button
					onclick={() => {
						filtersTemp = $state.snapshot(settings.filter);
						isFilterModalOpen = true;
					}}
					variants={['icon']}
				>
					<Funnel />
				</Button>
			{/if}
			{#if isCreatable}
				<Button
					onclick={() => {
						create = columnsSanitized.reduce((object: Record<string, any>, { key, type }) => {
							let value: any = '';
							if (type === 'bigint') value = BigInt(0);
							if (type === 'boolean') value = false;
							if (type === 'currency') value = 0;
							if (type === 'function') value = () => {};
							if (type === 'multiSelect') value = [];
							if (type === 'number') value = 0;
							if (type === 'object') value = {};
							if (type === 'select') value = '';
							if (type === 'string') value = '';
							if (type === 'symbol') value = Symbol('');
							if (type === 'timestamp') value = new Date();
							setAt(object, key, value);
							return object;
						}, {});
						isCreateModalOpen = true;
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
											if (isPaginateable !== false) {
												if (
													rowIndex < paginationSettings.indexes.start ||
													rowIndex >= paginationSettings.indexes.end
												)
													return false;
											}
											return isAllRowsSelected;
										});
									}}
								/>
							</Th>
						{/if}
						{#each columnsSanitized as { class: className, compareFn, key, label, ...columnSanitized }, columnIndex}
							{#if th}
								{@render th({
									class: className,
									columnIndex,
									compareFn,
									key,
									label,
									...columnSanitized
								})}
							{:else}
								<Th class={twMerge('px-0 py-0', className)}>
									<Div class="group relative">
										<Button
											class="flex w-full items-center justify-between space-x-2 text-gray-500"
											onclick={() => {
												if (isSortable) {
													if (settings.sortKey !== key) settings.sortDirection = 'asc';
													if (settings.sortKey === key)
														settings.sortDirection =
															settings.sortDirection === 'asc' ? 'desc' : 'asc';
													settings.sortKey = key;

													const indexes = Array.from(rows.keys()).sort((a, b) => {
														if (settings.sortKey === undefined) return 0;
														const sortColumn = columnsSanitized.find(
															(columnSanitized) => columnSanitized.key === settings.sortKey
														);
														if (sortColumn === undefined) return 0;

														let aValue = getAt(rows[a], settings.sortKey);
														let bValue = getAt(rows[b], settings.sortKey);

														if (sortColumn.type === 'select') {
															aValue =
																sortColumn.options.find(
																	(option: { value: any }) => option.value === aValue
																)?.label ?? aValue;
															bValue =
																sortColumn.options.find(
																	(option: { value: any }) => option.value === bValue
																)?.label ?? bValue;
														}

														const comparison = sortColumn.compareFn(
															aValue,
															bValue,
															settings.sortDirection === 'asc' ? 1 : -1
														);

														return comparison || a - b;
													});
													rows = indexes.map((index) => rows[index]);
													rowsCheckboxValues = indexes.map((index) => rowsCheckboxValues[index]);
												}
											}}
											variants={['ghost', 'square']}
										>
											<Div class={twMerge($theme.Th.default, 'px-0 py-0 whitespace-nowrap')}>
												{label}
											</Div>
											{#if isSortable}
												<ChevronDown
													class={twMerge(
														'transition duration-200',
														key === settings.sortKey ? 'scale-100' : 'scale-0',
														settings.sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'
													)}
													size={16}
												/>
											{/if}
										</Button>
										{#if isColumnsReorderable}
											{#if columnIndex > 0}
												<Button
													class={twMerge(
														'absolute top-1/2 left-0 -translate-y-1/2 px-2 py-2 opacity-0 transition duration-200 group-hover:opacity-100'
													)}
													onclick={() => {
														[columns[columnIndex], columns[columnIndex - 1]] = [
															columns[columnIndex - 1],
															columns[columnIndex]
														];
														columns = [...columns];
													}}
												>
													<ArrowLeft size={16} />
												</Button>
											{/if}
											{#if columnIndex < columnsSanitized.length - 1}
												<Button
													class={twMerge(
														'absolute top-1/2 right-0 -translate-y-1/2 rotate-180 px-2 py-2 opacity-0 transition duration-200 group-hover:opacity-100'
													)}
													onclick={() => {
														[columns[columnIndex], columns[columnIndex + 1]] = [
															columns[columnIndex + 1],
															columns[columnIndex]
														];
														columns = [...columns];
													}}
												>
													<ArrowLeft size={16} />
												</Button>
											{/if}
										{/if}
									</Div>
								</Th>
							{/if}
						{/each}
					</Tr>
				</Thead>
			{/if}
			{#if tbody}
				{@render tbody()}
			{:else}
				<Tbody>
					{#each rowsPaginated as row (`${settings.currentPage}:${row._key}`)}
						<Tr>
							{#if isSelectable}
								<Td>
									{#if rowsCheckboxValues[row.index] !== undefined}
										<Checkbox bind:checked={rowsCheckboxValues[row.index]} />
									{/if}
								</Td>
							{/if}
							{#each columnsSanitized as column (column.key)}
								{@render column.snippet({
									isEditable: column.isEditable,
									key: column.key,
									object: rows[row.index],
									options: column.options
								})}
							{/each}
						</Tr>
					{/each}
				</Tbody>
			{/if}
		</Table>
	</Div>
	{#if pagination}
		{@render pagination()}
	{:else if isPaginateable !== false}
		<Div class="flex items-center justify-center space-x-2 px-6 py-3 lg:space-x-4">
			<Button
				disabled={settings.currentPage === 0 ? true : undefined}
				onclick={() => (settings.currentPage = 0)}
				variants={['icon']}
			>
				<ChevronFirst />
			</Button>
			<Button
				disabled={settings.currentPage === 0 ? true : undefined}
				onclick={() => (settings.currentPage = (settings.currentPage ?? 1) - 1)}
				variants={['icon']}
			>
				<ChevronLeft />
			</Button>
			<Select bind:value={settings.currentPage} options={paginationSettings.options} />
			<Button
				disabled={settings.currentPage === Math.max(0, paginationSettings.totalPages - 1)
					? true
					: undefined}
				onclick={() => (settings.currentPage = (settings.currentPage ?? 0) + 1)}
				variants={['icon']}
			>
				<ChevronRight />
			</Button>
			<Button
				disabled={settings.currentPage === Math.max(0, paginationSettings.totalPages - 1)
					? true
					: undefined}
				onclick={() => (settings.currentPage = paginationSettings.totalPages - 1)}
				variants={['icon']}
			>
				<ChevronLast />
			</Button>
		</Div>
	{/if}
</Card>

{#if createModal}
	{@render createModal()}
{:else}
	<Modal bind:isOpen={isCreateModalOpen} class="space-y-6">
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
					isCreateModalOpen = false;
				}}
			>
				Add
			</Button>
			<Button onclick={() => (isCreateModalOpen = false)} variants={['ghost']}>Cancel</Button>
		</Div>
	</Modal>
{/if}

{#if deleteModal}
	{@render deleteModal()}
{:else}
	<Modal bind:isOpen={isDeleteModalOpen} class="items-center space-y-6">
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
			<Button onclick={() => (isDeleteModalOpen = false)} variants={['contrast']}>Cancel</Button>
			<Button
				autofocus={true}
				onclick={() => {
					rows = rows.filter((_, rowIndex) => !rowsCheckboxValues[rowIndex]);
					rowsCheckboxValues = rowsCheckboxValues.filter((rowCheckboxValue) => !rowCheckboxValue);
					isDeleteModalOpen = false;
				}}
				variants={['error']}
			>
				Delete
			</Button>
		</Div>
	</Modal>
{/if}

{#if filterModal}
	{@render filterModal()}
{:else}
	<Modal bind:isOpen={isFilterModalOpen} class="space-y-6">
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
		<Div class="relative flex flex-col overflow-auto">
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
							<Td colspan={4}>No Filters</Td>
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
		</Div>
		<Div class="flex justify-end space-x-2">
			<Button
				onclick={() => {
					settings.filter = $state
						.snapshot(filtersTemp)
						.filter(({ key, operator }) => key !== '' && operator !== '');
					isFilterModalOpen = false;
				}}
			>
				Apply
			</Button>
			<Button onclick={() => (isFilterModalOpen = false)} variants={['ghost']}>Cancel</Button>
		</Div>
	</Modal>
{/if}

{#snippet bigintTd(_: TdSnippet)}
	<Td>Bigint</Td>
{/snippet}
{#snippet booleanTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable}
		<Td>
			<Checkbox
				bind:checked={
					() => {
						const value = getAt(object, key);
						if (value == undefined) return false;
						return value;
					},
					(value) => {
						setAt(object, key, value);
					}
				}
			/>
		</Td>
	{:else}
		<Td class="uppercase">{getAt(object, key)}</Td>
	{/if}
{/snippet}
{#snippet currencyTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={
					() => {
						return currency(getAt(object, key));
					},
					(string) => {
						setAt(object, key, parseFloat(string.replace(/[^0-9.-]+/g, '')));
					}
				}
				class={twMerge(
					$theme.Input.default,
					'rounded-none bg-transparent text-right outline-transparent dark:bg-transparent dark:outline-transparent'
				)}
				contenteditable={true}
			>
				{object?.[key]}
			</Div>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap">
			{currency(getAt(object, key))}
		</Td>
	{/if}
{/snippet}
{#snippet functionTd(_: TdSnippet)}
	<Td>Function</Td>
{/snippet}
{#snippet multiSelectTd({ isEditable, key, object, options }: TdSnippet)}
	{#if isEditable}
		<Td class="hover:outline-primary-500/0 p-0">
			<MultiSelect
				bind:value={
					() => {
						return getAt(object, key);
					},
					(value) => {
						setAt(object, key, value);
					}
				}
				class="rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
				{options}
			/>
		</Td>
	{:else}
		<Td class="whitespace-nowrap">
			{options.find((option: any) => option.value === getAt(object, key))?.label ?? "can't find"}
		</Td>
	{/if}
{/snippet}
{#snippet numberTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable}
		<Td class="hover:outline-primary-500/0 p-0">
			<Div
				bind:innerHTML={
					() => {
						const value = getAt(object, key);
						if (typeof value === 'number') return value.toString();
						return value;
					},
					(value) => {
						if (typeof value === 'number') setAt(object, key, value);
						if (typeof value === 'string')
							setAt(object, key, parseFloat(value.replace(/[^0-9.-]+/g, '')));
					}
				}
				class={twMerge(
					$theme.Input.default,
					'rounded-none bg-transparent text-right outline-transparent dark:bg-transparent dark:outline-transparent'
				)}
				contenteditable={true}
			>
				{getAt(object, key)}
			</Div>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap">
			{getAt(object, key)}
		</Td>
	{/if}
{/snippet}
{#snippet objectTd(_: TdSnippet)}
	<Td class="whitespace-nowrap">Object</Td>
{/snippet}
{#snippet selectTd({ isEditable, key, object, options }: TdSnippet)}
	{#if isEditable}
		<Td class="hover:outline-primary-500/0 p-0">
			{@const rawOptions = options ?? []}
			{@const hasBlank = rawOptions.some((o: any) => o?.value === '')}
			{@const dedupedOptions = Array.from(
				// Map by value to remove duplicates; keeps first occurrence
				new Map(rawOptions.map((o: any) => [o?.value, o])).values()
			)}
			{@const sanitizedOptions = [
				...(hasBlank ? [] : [{ label: '', value: '' }]),
				...dedupedOptions
			]}
			<Select
				bind:value={
					() => {
						const v = getAt(object, key);
						return options?.some((o: any) => o?.value === v) ? v : '';
					},
					(value) => {
						if (value === '' || value === undefined) {
							deleteAt(object, key);
						} else {
							setAt(object, key, value);
						}
					}
				}
				class="w-full rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
				options={sanitizedOptions}
			/>
		</Td>
	{:else}
		<Td class="whitespace-nowrap">
			{options.find((o: any) => o?.value === getAt(object, key))?.label ?? "can't find"}
		</Td>
	{/if}
{/snippet}
{#snippet stringTd({ isEditable, key, object }: TdSnippet)}
	{#if object}
		{#if isEditable}
			<Td class="hover:outline-primary-500/0 p-0">
				<Div
					bind:innerHTML={
						() => {
							return getAt(object, key);
						},
						(value) => {
							setAt(object, key, value);
						}
					}
					class={twMerge(
						$theme.Input.default,
						'rounded-none bg-transparent whitespace-nowrap outline-transparent dark:bg-transparent dark:outline-transparent'
					)}
					contenteditable={true}
				>
					{getAt(object, key)}
				</Div>
			</Td>
		{:else}
			<Td class="whitespace-nowrap">{getAt(object, key)}</Td>
		{/if}
	{/if}
{/snippet}
{#snippet symbolTd(_: TdSnippet)}
	<Td>Symbol</Td>
{/snippet}
{#snippet timestampTd({ isEditable, key, object }: TdSnippet)}
	{#if isEditable}
		<Td class="hover:outline-primary-500/0 p-0">
			<Input
				bind:value={
					() => {
						return inputDateTimeLocal(getAt(object, key));
					},
					(value: string) => {
						setAt(objectTd, key, new Date(value));
					}
				}
				class="w-full rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
				type="datetime-local"
			/>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap">{dateTime(getAt(object, key))}</Td>
	{/if}
{/snippet}
{#snippet undefinedTd(_: TdSnippet)}
	<Td class="whitespace-nowrap">undefined</Td>
{/snippet}
