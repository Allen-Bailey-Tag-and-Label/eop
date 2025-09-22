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
		Label,
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
		getAt,
		getExportData,
		getFilterOptions,
		setAt
	} from './';
	import type { Props, TdSnippet } from './types';

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
		isAllRowsSelected = $bindable(false),
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
		scrollContainer = $bindable(null),
		scrollHandler = $bindable((e?: Event) => {
			const target = scrollContainer ?? (e?.target as HTMLElement) ?? null;
			if (!target) return;
			scrollTop = target.scrollTop;
		}),
		scrollTop = $bindable(0),
		settings = $bindable({
			currentPage: 0,
			filter: [],
			rowsPerPage: 10,
			sortDirection: 'asc',
			sortKey: ''
		}),
		settingsTemp = $bindable({
			isPaginateable: true,
			rowsPerPage: 10
		}),
		tbody,
		th,
		thead,
		toolbar,
		totalRows = $bindable(),
		virtualOverscan = $bindable(5),
		virtualRowHeight = $bindable('h-10')
	}: Props<any> = $props();
	let containerHeight = $state(0);
	const getRowKey = (row: object) => {
		let key = rowKeyMap.get(row);
		if (!key) {
			const random = crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
			rowKeyMap.set(row, random);
			key = random;
		}
		return key;
	};
	let resizeObserver: ResizeObserver | null = null;
	const rowKeyMap = new WeakMap<object, string>();
	const tailwindHeights: Record<string, number> = {
		'h-1': 4,
		'h-2': 8,
		'h-3': 12,
		'h-4': 16,
		'h-5': 20,
		'h-6': 24,
		'h-7': 28,
		'h-8': 32,
		'h-9': 36,
		'h-10': 40,
		'h-11': 44,
		'h-12': 48,
		'h-14': 56,
		'h-16': 64,
		'h-20': 80,
		'h-24': 96,
		'h-28': 112,
		'h-32': 128,
		'h-36': 144,
		'h-40': 160,
		'h-44': 176,
		'h-48': 192,
		'h-52': 208,
		'h-56': 224,
		'h-60': 240,
		'h-64': 256
	};
	const tdSnippetMap: Map<string, Snippet<[TdSnippet]>> = new Map([
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

	// $derives
	const virtualization = $derived.by(() => {
		const length = (rowsPaginated ?? []).length;

		// virtualization OFF or variable-height placeholder -> full range
		if (isPaginateable || virtualRowHeight === 'auto') {
			return {
				startIndex: 0,
				endIndex: length,
				topSpacerHeight: 0,
				bottomSpacerHeight: 0,
				rowPx: 0
			};
		}

		// Convert Tailwind class to px (fallback 40px)
		const rh = tailwindHeights[String(virtualRowHeight)] ?? 40;
		const containerHpx = containerHeight || 0;
		const visibleCount = Math.max(0, Math.ceil(containerHpx / rh));
		const rawStart = Math.floor((scrollTop || 0) / rh);
		const start = Math.max(0, rawStart - (virtualOverscan ?? 0));
		const end = Math.min(length, start + visibleCount + (virtualOverscan ?? 0) * 2);

		return {
			startIndex: start,
			endIndex: end,
			topSpacerHeight: start * rh,
			bottomSpacerHeight: Math.max(0, (length - end) * rh),
			rowPx: rh
		};
	});

	// $effects
	$effect(() => {
		if (columns) {
			untrack(() => {
				columnInferredTypes = columns.map((column) => {
					const key = typeof column === 'string' ? column : column.key;
					let type: string = 'string';

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
				(columnSanitized.type ? tdSnippetMap.get(columnSanitized.type) : undefined) ??
				inferredSnippet ??
				stringTd;

			return {
				class: columnSanitized.class,
				compareFn: columnSanitized.compareFn ?? compareFn[type] ?? compareFn[inferredType],
				isCreatable: columnSanitized.isCreatable ?? isCreatable,
				isEditable: columnSanitized.isEditable ?? isEditable,
				isExportable:
					columnSanitized.isExportable ??
					(columnSanitized?.isProtected !== undefined ? !columnSanitized.isProtected : undefined) ??
					(columnSanitized?.isHidden !== undefined ? !columnSanitized.isHidden : undefined) ??
					isExportable,
				isFilterable:
					columnSanitized.isFilterable ??
					(columnSanitized?.isProtected !== undefined ? !columnSanitized.isProtected : undefined) ??
					(type === 'function' ? false : isFilterable),
				isHidden:
					columnSanitized.isHidden ??
					(columnSanitized?.isProtected !== undefined ? columnSanitized.isProtected : undefined) ??
					false,
				isProtected: columnSanitized.isProtected ?? false,
				isSortable: columnSanitized.isSortable ?? isSortable,
				key: columnSanitized.key,
				label: columnSanitized.label ?? columnSanitized.key,
				options: columnSanitized.options ?? [],
				snippet,
				type,
				valueFn: columnSanitized.valueFn ?? undefined
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
		const isCreatableValue = isCreatable;
		const isDeletableValue = isDeletable;
		const isExportableValue = isExportable;
		const isFilterableValue = isFilterable;
		const isPaginateableValue = isPaginateable;

		untrack(() => {
			isToolbarVisible =
				isCreatableValue ||
				isDeletableValue ||
				isExportableValue ||
				isFilterableValue ||
				isPaginateableValue;
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
						return typeof cell === 'string' ? parseFloat(cell) > parseFloat(value) : cell > value;
					case 'greater than or equals':
						return typeof cell === 'string' ? parseFloat(cell) >= parseFloat(value) : cell >= value;
					case 'less than':
						return typeof cell === 'string' ? parseFloat(cell) < parseFloat(value) : cell < value;
					case 'less than or equals':
						return typeof cell === 'string' ? parseFloat(cell) <= parseFloat(value) : cell <= value;
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
	$effect(() => {
		// only observe while virtualization is enabled
		if (isPaginateable) {
			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
			}
			return;
		}

		if (scrollContainer && typeof ResizeObserver !== 'undefined') {
			// cleanup previous observer if any
			if (resizeObserver) resizeObserver.disconnect();

			resizeObserver = new ResizeObserver(() => {
				containerHeight = scrollContainer?.clientHeight ?? 0;
			});
			resizeObserver.observe(scrollContainer);

			// init measurement immediately
			containerHeight = scrollContainer?.clientHeight ?? 0;
		}
	});
	$effect(() => {
		if (!scrollContainer) return;

		const resizeObserver = new ResizeObserver(() => {
			untrack(() => {
				if (scrollContainer) containerHeight = scrollContainer.clientHeight;
			});
		});

		resizeObserver.observe(scrollContainer);

		return () => resizeObserver.disconnect();
	});
</script>

<Card class="flex max-h-full max-w-full flex-col overflow-auto p-0">
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
								const headers: string[] = columnsSanitized
									.filter(({ isExportable }) => isExportable)
									.map(({ label }) => label);
								const data: any[][] = getExportData({ columnsSanitized, rows: rowsPaginated });

								const exportFunction = exportFunctions.get(exportOption);
								if (exportFunction) await exportFunction({ data, headers });
								isExportModalOpen = false;
							}}
						>
							Export
						</Button>
						<Button onclick={() => (isExportModalOpen = false)} variants={['glass']}>Cancel</Button>
					</Div>
				</Modal>
			{/if}
			<Button
				onclick={() => {
					settingsTemp.isPaginateable = isPaginateable ?? true;
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
						isPaginateable = settingsTemp.isPaginateable;
						settings.rowsPerPage = settingsTemp.rowsPerPage;
						isSettingsModalOpen = false;
					}}
				>
					{#snippet inputs()}
						<Div class="flex space-x-4">
							<Checkbox bind:checked={settingsTemp.isPaginateable} label="Paginate" />
							<Div
								class={twMerge(
									'transition duration-200',
									settingsTemp.isPaginateable ? 'opacity-100' : 'opacity-0'
								)}
							>
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
									readonly={settingsTemp.isPaginateable ? undefined : true}
									type="number"
								/>
							</Div>
						</Div>
					{/snippet}
					{#snippet buttons()}
						<Button type="submit">Update</Button>
						<Button onclick={() => (isSettingsModalOpen = false)} variants={['glass']}>
							Cancel
						</Button>
					{/snippet}
				</Form>
			</Modal>
			{#if isFilterable}
				<Button
					onclick={() => {
						filtersTemp = $state.snapshot(settings.filter ?? []);
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
	<Div
		bind:element={scrollContainer}
		class="relative flex flex-col overflow-auto"
		onscroll={scrollHandler}
	>
		<Table class="bg-transparent dark:bg-transparent">
			{#if thead}
				{@render thead()}
			{:else}
				<Thead class="sticky top-0">
					<Tr>
						{#if isSelectable}
							<Th class={twMerge($theme.Button.glass, 'relative z-10 w-6')}>
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
						{#each columnsSanitized as { class: className, compareFn, isHidden, isSortable, key, label, ...columnSanitized }, columnIndex}
							{#if !isHidden}
								{#if th}
									{@render th({
										class: className,
										columnIndex,
										compareFn,
										isHidden,
										isSortable,
										key,
										label,
										...columnSanitized
									})}
								{:else}
									<Th class={twMerge('bg-gray-100 px-0 py-0 dark:bg-gray-800', className)}>
										<Div class="group relative">
											{#if isSortable}
												<Button
													class="flex w-full items-center justify-between space-x-2 text-gray-500 backdrop-blur-none"
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
															rowsCheckboxValues = indexes.map(
																(index) => rowsCheckboxValues[index]
															);
														}
													}}
													variants={['glass', 'square']}
												>
													<Div class={twMerge($theme.Th.default, 'px-0 py-0 whitespace-nowrap')}>
														{label}
													</Div>
													<ChevronDown
														class={twMerge(
															'transition duration-200',
															key === settings.sortKey ? 'scale-100' : 'scale-0',
															settings.sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'
														)}
														size={16}
													/>
												</Button>
											{:else}
												<Div
													class={twMerge(
														$theme.Th.default,
														'flex w-full justify-start px-6 py-3 whitespace-nowrap'
													)}
												>
													{label}
												</Div>
											{/if}
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
							{/if}
						{/each}
					</Tr>
				</Thead>
			{/if}
			{#if tbody}
				{@render tbody()}
			{:else}
				<Tbody>
					<Tr style="height: {virtualization.topSpacerHeight}px;" />
					{#each rowsPaginated?.slice(virtualization.startIndex, virtualization.endIndex) as row, _ (`${settings.currentPage}:${row._key}`)}
						<Tr style="height: {virtualization.rowPx}px;">
							{#if isSelectable}
								<Td>
									{#if rowsCheckboxValues[row.index] !== undefined}
										<Checkbox bind:checked={rowsCheckboxValues[row.index]} />
									{/if}
								</Td>
							{/if}
							{#each columnsSanitized as { isEditable, isHidden, key, options, snippet, valueFn } (key)}
								{#if !isHidden}
									{@render snippet({
										isEditable,
										key,
										object: rows[row.index],
										options,
										valueFn
									})}
								{/if}
							{/each}
						</Tr>
					{/each}
					<Tr style="height: {virtualization.bottomSpacerHeight}px;" />
				</Tbody>
			{/if}
		</Table>
	</Div>
	{#if pagination}
		{@render pagination()}
	{:else if isPaginateable !== false}
		<Div
			class="flex items-center justify-center space-x-2 border-t border-white/[.5] px-6 py-3 lg:space-x-4 dark:border-white/[.025]"
		>
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
			<Button onclick={() => (isCreateModalOpen = false)} variants={['glass']}>Cancel</Button>
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
			<Button onclick={() => (filtersTemp = [])} variants={['glass']}>Clear Filters</Button>
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
							{@const column = columnsSanitized.find(
								(columnSanitized) => columnSanitized.key === filtersTemp[filterTempIndex]?.key
							)}
							{@const operatorOptions:{label:string, value:any}[] = getFilterOptions({column})}
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
										class="rounded-none bg-transparent shadow-none outline-transparent dark:bg-transparent dark:outline-transparent"
										options={filterKeyOptions}
									/>
								</Td>
								<Td class="p-0">
									<Select
										bind:value={filtersTemp[filterTempIndex].operator}
										class="rounded-none bg-transparent shadow-none outline-transparent dark:bg-transparent dark:outline-transparent"
										options={operatorOptions}
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
			<Button onclick={() => (isFilterModalOpen = false)} variants={['glass']}>Cancel</Button>
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
						return currency(getAt(object, key) ?? 0);
					},
					(string) => {
						setAt(object, key, parseFloat(string.replace(/[^0-9.-]+/g, '')));
					}
				}
				class={twMerge(
					$theme.Input.default,
					'rounded-none bg-transparent text-right shadow-none outline-transparent backdrop-blur-none dark:bg-transparent dark:shadow-none dark:outline-transparent'
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
{#snippet functionTd({ key, object, valueFn }: TdSnippet)}
	<Td>
		{#if valueFn}
			{valueFn({ key, object })}
		{/if}
	</Td>
{/snippet}
{#snippet multiSelectTd({ isEditable, key, object, options }: TdSnippet)}
	{#if isEditable}
		<Td class="hover:outline-primary-500/0 p-0">
			<MultiSelect
				bind:value={
					() => {
						return getAt(object, key) ?? [];
					},
					(value) => {
						setAt(object, key, value);
					}
				}
				class="rounded-none bg-transparent shadow-none outline-transparent backdrop-blur-none dark:bg-transparent dark:shadow-none dark:outline-transparent"
				{options}
			/>
		</Td>
	{:else}
		<Td class="whitespace-nowrap">
			{(getAt(object, key) ?? []).length} item{(getAt(object, key) ?? []).length === 1 ? '' : 's'}
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
						return value ?? '0';
					},
					(value) => {
						if (typeof value === 'number') setAt(object, key, value);
						if (typeof value === 'string')
							setAt(object, key, parseFloat(value.replace(/[^0-9.-]+/g, '')));
					}
				}
				class={twMerge(
					$theme.Input.default,
					'rounded-none bg-transparent text-right shadow-none outline-transparent backdrop-blur-none dark:bg-transparent dark:shadow-none dark:outline-transparent'
				)}
				contenteditable={true}
			>
				{getAt(object, key) ?? '0'}
			</Div>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap">
			{getAt(object, key) ?? '0'}
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
				class="w-full rounded-none bg-transparent shadow-none outline-transparent backdrop-blur-none dark:bg-transparent dark:shadow-none dark:outline-transparent"
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
							const value = getAt(object, key);
							return value ?? '';
						},
						(value) => {
							setAt(object, key, value);
						}
					}
					class={twMerge(
						$theme.Input.default,
						'rounded-none bg-transparent whitespace-nowrap shadow-none outline-transparent backdrop-blur-none dark:bg-transparent dark:shadow-none dark:outline-transparent'
					)}
					contenteditable={true}
				>
					{getAt(object, key) ?? ''}
				</Div>
			</Td>
		{:else}
			<Td class="whitespace-nowrap">{getAt(object, key) ?? ''}</Td>
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
						const value = getAt(object, key);
						const formattedValue = inputDateTimeLocal(value);
						return formattedValue;
					},
					(value: string) => {
						const date = new Date(value);
						setAt(object, key, date);
					}
				}
				class="w-full rounded-none bg-transparent shadow-none outline-transparent backdrop-blur-none dark:bg-transparent dark:shadow-none dark:outline-transparent"
				type="datetime-local"
			/>
		</Td>
	{:else}
		<Td class="text-right whitespace-nowrap">{dateTime(getAt(object, key)) ?? ''}</Td>
	{/if}
{/snippet}
{#snippet undefinedTd(_: TdSnippet)}
	<Td class="whitespace-nowrap">undefined</Td>
{/snippet}
