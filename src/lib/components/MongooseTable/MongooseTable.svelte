<script lang="ts">
	import {
		ChevronDown,
		ChevronFirst,
		ChevronLast,
		ChevronLeft,
		ChevronRight,
		Funnel,
		Plus,
		Save,
		Settings,
		Trash,
		TriangleAlert
	} from '@lucide/svelte';
	import { untrack, type Component, type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { currency, inputDateTimeLocal } from '$lib/formats';
	import { theme } from '$lib/theme';

	import {
		Button,
		Checkbox,
		Datatable,
		Div,
		Input,
		Form,
		Modal,
		MultiSelect,
		P,
		Select,
		Spinner,
		Table,
		Tbody,
		Td,
		Thead,
		Th,
		Tr
	} from '../';

	import type {
		Column,
		ColumnSanitized,
		ColumnType,
		Data,
		Option,
		Props,
		Row,
		TdSnippet
	} from './types';
	import { compareFn, filterOperatorOptions, getAt, isSame } from './';

	let {
		columns = $bindable([]),
		columnInferredTypes = $bindable([]),
		columnsSanitized = $bindable([]),
		create = $bindable({}),
		createModal: customCreateModal,
		data,
		deleteModal: customDeleteModal,
		filterModal: customFilterModal,
		filterKeyOptions = $bindable([]),
		filtersTemp = $bindable([]),
		filtersTempSanitized = $bindable([]),
		isCreatable = $bindable(true),
		isCreateModalOpen = $bindable(false),
		isDeletable = $bindable(true),
		isDeleteModalOpen = $bindable(false),
		isEditable = $bindable(true),
		isFilterable = $bindable(true),
		isFilterModalOpen = $bindable(false),
		isLoading = $bindable(true),
		isPaginateable = $bindable(true),
		isSelectable = $bindable(true),
		isSettingsModalOpen = $bindable(false),
		isSettingsVisible = $bindable(),
		isSortable = $bindable(true),
		isToolbarVisible = $bindable(true),
		modelName = $bindable(),
		pagination: customPagination,
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
			_routeId: '',
			currentPage: 0,
			filter: [],
			rowsPerPage: 10,
			sortDirection: 'asc',
			sortKey: ''
		}),
		settingsTemp = $bindable({ rowsPerPage: 10 }),
		tbody: customTbody,
		th: customTh,
		thead,
		toolbar: customToolbar,
		totalRows = $bindable(0),
		virtualColumns = $bindable([])
	}: Props = $props();
	const createSnippetMap: Map<ColumnType, Snippet<[TdSnippet]>> = new Map([
		['bigint', bigintCreate],
		['boolean', booleanCreate],
		['currency', currencyCreate],
		['function', functionCreate],
		['multiSelect', multiSelectCreate],
		['number', numberCreate],
		['object', objectCreate],
		['ref', selectCreate],
		['select', selectCreate],
		['string', stringCreate],
		['symbol', symbolCreate],
		['timestamp', timestampCreate],
		['undefined', undefinedCreate]
	]);
	let initialized = $state(false);
	let originalRows = $state(new Map<string, Row>());
	let modifiedRows = $state(new Map<string, Map<string, any>>());
	const updateData = async (data: Data) => {
		isLoading = true;
		const [resolvedRows, resolvedTotalRows] = await Promise.all([data.rows, data.totalRows]);
		columns = data.columns;
		modifiedRows = new Map();
		originalRows = new Map(
			(resolvedRows as Row[]).map((row: Row) => [row._id, structuredClone(row)])
		);
		rows = resolvedRows as Row[];
		settings = data.settings;
		totalRows = resolvedTotalRows as number;
		isLoading = false;
		initialized = true;
	};

	const updatedData = $derived.by(() =>
		Array.from(modifiedRows).map(([_id, fields]) => ({ _id, $set: Object.fromEntries(fields) }))
	);

	$effect(() => {
		if (data)
			untrack(() => {
				updateData(data);
			});
	});
	$effect(() => {
		let _createdByIdExists = false;
		let createdAtExists = false;
		let updatedAtExists = false;

		columns.forEach((column) => {
			if (
				(typeof column === 'object' && column.key === '_createdById') ||
				(typeof column === 'string' && column === '_createdById')
			)
				_createdByIdExists = true;
			if (
				(typeof column === 'object' && column.key === 'createdAt') ||
				(typeof column === 'string' && column === 'createdAt')
			)
				createdAtExists = true;
			if (
				(typeof column === 'object' && column.key === 'updatedAt') ||
				(typeof column === 'string' && column === 'updatedAt')
			)
				updatedAtExists = true;
		});

		if (!_createdByIdExists)
			columns.push({
				compareFn: (a: { username: string }, b: { username: string }, direction: -1 | 1) => {
					return a.username.localeCompare(b.username) * direction;
				},
				isCreatable: false,
				isEditable: false,
				isFilterable: true,
				key: '_createdById',
				label: 'Created By',
				type: 'ref'
			});
		if (!createdAtExists)
			columns.push({
				compareFn: compareFn.timestamp,
				isCreatable: false,
				isEditable: false,
				isFilterable: true,
				key: 'createdAt',
				label: 'Created At',
				type: 'timestamp'
			});
		if (!updatedAtExists)
			columns.push({
				compareFn: compareFn.timestamp,
				isCreatable: false,
				isEditable: false,
				isFilterable: true,
				key: 'updatedAt',
				label: 'Updated At',
				type: 'timestamp'
			});
	});
	$effect(() => {
		if (virtualColumns?.length) {
			const existingColumns = new Set(
				columns.map((column: Column) => (typeof column === 'string' ? column : column.key))
			);
			const mergedColumns = [
				...columns,
				...virtualColumns.filter(
					(column: Column) => !existingColumns.has(typeof column === 'string' ? column : column.key)
				)
			];
			columns = mergedColumns;
		}
	});
	$effect(() => {
		const _rowValues = rows.map((row) => columnsSanitized.map(({ key }) => getAt(row, key)));
		untrack(() => {
			modifiedRows = new Map();
		});
		rows.forEach((row) => {
			const originalRow = originalRows.get(row._id);
			if (!originalRow) return;
			const changes = new Map<string, any>();
			columnsSanitized.forEach(({ key }) => {
				if (!isSame(row, originalRow, key)) {
					changes.set(key, getAt(row, key));
				}
			});
			if (changes.size > 0) {
				untrack(() => {
					modifiedRows.set(row._id, changes);
					modifiedRows = new Map(modifiedRows);
				});
			}
		});
	});
</script>

{#if initialized}
	<Div class="relative">
		<Datatable
			bind:columns
			bind:columnInferredTypes
			bind:columnsSanitized
			bind:create
			bind:filterKeyOptions
			bind:filtersTemp
			bind:filtersTempSanitized
			bind:isCreatable
			bind:isCreateModalOpen
			bind:isDeletable
			bind:isDeleteModalOpen
			bind:isEditable
			bind:isFilterable
			bind:isFilterModalOpen
			bind:isPaginateable
			bind:isSelectable
			bind:isSettingsModalOpen
			bind:isSettingsVisible
			bind:isSortable
			bind:isToolbarVisible
			bind:paginationSettings
			bind:rows
			bind:rowsCheckboxValues
			bind:rowsFiltered
			bind:rowsPaginated
			bind:rowsSanitized
			bind:rowsSelected
			bind:settings
			createModal={customCreateModal !== undefined ? customCreateModal : createModal}
			deleteModal={customDeleteModal !== undefined ? customDeleteModal : deleteModal}
			filterModal={customFilterModal !== undefined ? customFilterModal : filterModal}
			pagination={customPagination !== undefined ? customPagination : pagination}
			tbody={customTbody !== undefined ? customTbody : tbody}
			th={customTh !== undefined ? customTh : th}
			{thead}
			toolbar={customToolbar !== undefined ? customToolbar : toolbar}
			{totalRows}
		/>
		{#if isLoading}
			<Div
				class="text-primary-500 absolute top-0 left-0 flex h-full w-full items-center justify-center rounded-xl backdrop-blur-md"
			>
				<Spinner class="h-16 w-16" strokeWidth="2" />
			</Div>
		{/if}
	</Div>
{:else}
	Loading...
{/if}

{#snippet pagination()}
	{#if isPaginateable !== false}
		<Div class="flex items-center justify-center space-x-2 px-6 py-3 lg:space-x-4">
			{@render paginationButton({
				currentPage: 0,
				disabled: settings.currentPage === 0,
				Icon: ChevronFirst
			})}
			{@render paginationButton({
				currentPage: settings.currentPage - 1,
				disabled: settings.currentPage === 0,
				Icon: ChevronLeft
			})}
			<Form
				action="/api/mongooseTable?/find"
				class="w-auto"
				onchange={(e: Event) => {
					if (!e?.currentTarget) return;
					const form = e.currentTarget as HTMLFormElement;
					form.requestSubmit();
				}}
				submitFunction={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<Input
					defaultValue={settings._routeId}
					name="_routeId"
					type="hidden"
					value={settings._routeId}
				/>
				<Input
					defaultValue={settings.currentPage.toString()}
					name="currentPage"
					type="hidden"
					value={settings.currentPage.toString()}
				/>
				<Input
					defaultValue={JSON.stringify(settings.filter)}
					name="filter"
					type="hidden"
					value={JSON.stringify(settings.filter)}
				/>
				<Input defaultValue={modelName} name="modelName" type="hidden" value={modelName} />
				<Input
					defaultValue={settings.rowsPerPage.toString()}
					name="rowsPerPage"
					type="hidden"
					value={settings.rowsPerPage.toString()}
				/>
				<Input
					defaultValue={settings.sortDirection}
					name="sortDirection"
					type="hidden"
					value={settings.sortDirection}
				/>
				<Input
					defaultValue={settings.sortKey}
					name="sortKey"
					type="hidden"
					value={settings.sortKey}
				/>
				<Select bind:value={settings.currentPage} options={paginationSettings.options} />
			</Form>
			{@render paginationButton({
				currentPage: settings.currentPage + 1,
				disabled: settings.currentPage === paginationSettings.totalPages - 1,
				Icon: ChevronRight
			})}
			{@render paginationButton({
				currentPage: paginationSettings.totalPages - 1,
				disabled: settings.currentPage === paginationSettings.totalPages - 1,
				Icon: ChevronLast
			})}
		</Div>
	{/if}
{/snippet}
{#snippet paginationButton({
	currentPage,
	disabled,
	Icon
}: {
	currentPage: number;
	disabled: boolean | undefined;
	Icon: Component;
})}
	<Form
		action="/api/mongooseTable?/find"
		class="w-auto"
		submitFunction={() => {
			isLoading = true;
			return async ({ update }) => {
				await update();
			};
		}}
	>
		<Input
			defaultValue={settings._routeId}
			name="_routeId"
			type="hidden"
			value={settings._routeId}
		/>
		<Input
			defaultValue={currentPage.toString()}
			name="currentPage"
			type="hidden"
			value={currentPage.toString()}
		/>
		<Input
			defaultValue={JSON.stringify(settings.filter)}
			name="filter"
			type="hidden"
			value={JSON.stringify(settings.filter)}
		/>
		<Input defaultValue={modelName} name="modelName" type="hidden" value={modelName} />
		<Input
			defaultValue={settings.rowsPerPage.toString()}
			name="rowsPerPage"
			type="hidden"
			value={settings.rowsPerPage.toString()}
		/>
		<Input
			defaultValue={settings.sortDirection}
			name="sortDirection"
			type="hidden"
			value={settings.sortDirection}
		/>
		<Input defaultValue={settings.sortKey} name="sortKey" type="hidden" value={settings.sortKey} />
		<Button {disabled} type="submit" variants={['icon']}>
			<Icon />
		</Button>
	</Form>
{/snippet}
{#snippet tbody()}
	<Tbody>
		{#each rowsSanitized as { index: rowIndex }, rowSanitizedIndex}
			{#if rowSanitizedIndex < settings.rowsPerPage}
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
			{/if}
		{/each}
	</Tbody>
{/snippet}
{#snippet th({ class: className, key, label }: ColumnSanitized)}
	{#if !isSortable}
		<Th class={className}>{label}</Th>
	{:else}
		<Th class={twMerge('p-0', className)}>
			<Form
				action="/api/mongooseTable?/find"
				submitFunction={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<Input
					defaultValue={settings._routeId}
					name="_routeId"
					type="hidden"
					value={settings._routeId}
				/>
				<Input
					defaultValue={settings.currentPage.toString()}
					name="currentPage"
					type="hidden"
					value={settings.currentPage.toString()}
				/>
				<Input
					defaultValue={JSON.stringify(settings.filter)}
					name="filter"
					type="hidden"
					value={JSON.stringify(settings.filter)}
				/>
				<Input
					defaultValue={settings.rowsPerPage.toString()}
					name="rowsPerPage"
					type="hidden"
					value={settings.rowsPerPage.toString()}
				/>
				<Input
					name="sortDirection"
					type="hidden"
					value={key !== settings.sortKey
						? 'asc'
						: settings.sortDirection === 'asc'
							? 'desc'
							: 'asc'}
				/>
				<Input defaultValue={key} name="sortKey" type="hidden" value={key} />
				<Button
					class="flex w-full items-center justify-between space-x-2 text-gray-500"
					type="submit"
					variants={['ghost', 'square']}
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
			</Form>
		</Th>
	{/if}
{/snippet}
{#snippet toolbar()}
	{#if isToolbarVisible}
		<Div class="flex items-center justify-end space-x-2 px-6 py-3">
			{#if isEditable}
				<Form
					action="/api/mongooseTable?/updateMany"
					class="w-auto min-w-auto"
					submitFunction={() => {
						isLoading = true;

						return async ({ update }) => {
							await update();
							isLoading = false;
						};
					}}
				>
					<Input
						class="sr-only absolute h-0 w-0"
						defaultValue={modelName}
						name="modelName"
						value={modelName}
					/>
					<Input class="sr-only absolute h-0 w-0" name="data" value={JSON.stringify(updatedData)} />
					<Button
						disabled={modifiedRows.size > 0 ? undefined : true}
						type="submit"
						variants={['success', 'icon']}
					>
						<Save />
					</Button>
				</Form>
			{/if}
			{#if isDeletable}
				<Button
					disabled={rowsSelected.length > 0 ? undefined : true}
					onclick={() => (isDeleteModalOpen = true)}
					variants={['error', 'icon']}
				>
					<Trash />
				</Button>
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
						action="/api/mongooseTable?/find"
						submitFunction={() => {
							isLoading = true;
							isSettingsModalOpen = false;
							return async ({ update }) => {
								await update();
								isLoading = false;
							};
						}}
					>
						{#snippet inputs()}
							<Input
								defaultValue={settings._routeId}
								name="_routeId"
								type="hidden"
								value={settings._routeId}
							/>
							<Input
								defaultValue={settings.currentPage.toString()}
								name="currentPage"
								type="hidden"
								value={settings.currentPage.toString()}
							/>
							<Input
								defaultValue={JSON.stringify(settings.filter)}
								name="filter"
								type="hidden"
								value={JSON.stringify(settings.filter)}
							/>
							<Input defaultValue={modelName} name="modelName" type="hidden" value={modelName} />
							<Input
								defaultValue={settings.sortDirection}
								name="sortDirection"
								type="hidden"
								value={settings.sortDirection}
							/>
							<Input
								defaultValue={settings.sortKey}
								name="sortKey"
								type="hidden"
								value={settings.sortKey}
							/>
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
								name="rowsPerPage"
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
						create = columnsSanitized.reduce((obj: Record<string, any>, { key, type }) => {
							if (type === 'bigint') obj[key] = BigInt(0);
							if (type === 'boolean') obj[key] = false;
							if (type === 'currency') obj[key] = 0;
							if (type === 'function') obj[key] = () => {};
							if (type === 'multiSelect') obj[key] = [];
							if (type === 'number') obj[key] = 0;
							if (type === 'object') obj[key] = {};
							if (type === 'select') obj[key] = '';
							if (type === 'string') obj[key] = '';
							if (type === 'symbol') obj[key] = Symbol('');
							if (type === 'timestamp') obj[key] = new Date();
							return obj;
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
{/snippet}

{#snippet createModal()}
	{#if columnsSanitized}
		<Modal bind:isOpen={isCreateModalOpen}>
			<Form
				action="/api/mongooseTable?/create"
				class="max-w-full space-y-6"
				submitFunction={() => {
					isLoading = true;
					isCreateModalOpen = false;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
			>
				<Input
					class="absolute top-0 left-0 h-0 w-0 opacity-0"
					name="modelName"
					type="hidden"
					value={modelName}
				/>
				<Table>
					<Tbody>
						{#each columnsSanitized as { isCreatable, key, label, options, type }}
							{@const snippet = createSnippetMap.get(type) ?? stringCreate}
							{#if isCreatable && create?.[key] !== undefined}
								<Tr>
									<Td class="whitespace-nowrap">{label}</Td>
									{@render snippet({ isEditable: true, key, object: create, options })}
								</Tr>
							{/if}
						{/each}
					</Tbody>
				</Table>
				<Div class="flex justify-end space-x-2">
					<Button type="submit">Add</Button>
					<Button onclick={() => (isCreateModalOpen = false)} variants={['ghost']}>Cancel</Button>
				</Div>
			</Form>
		</Modal>
	{/if}
{/snippet}
{#snippet deleteModal()}
	<Modal bind:isOpen={isDeleteModalOpen}>
		<Form
			action="/api/mongooseTable?/delete"
			class="flex flex-col items-center space-y-6"
			submitFunction={() => {
				isLoading = true;
				isDeleteModalOpen = false;
				return async ({ update }) => {
					await update();
					isLoading = false;
					rowsCheckboxValues = rowsCheckboxValues.map((_) => false);
				};
			}}
		>
			<Input name="modelName" type="hidden" value={modelName} />
			{#each rowsCheckboxValues as isChecked, rowIndex}
				{#if isChecked}
					<Input name="_id" type="hidden" value={rows[rowIndex]._id} />
				{/if}
			{/each}
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
				<Button type="submit" variants={['error']}>Delete</Button>
			</Div>
		</Form>
	</Modal>
{/snippet}
{#snippet filterModal()}
	<Modal bind:isOpen={isFilterModalOpen}>
		<Form
			action="/api/mongooseTable?/find"
			class="max-w-auto space-y-6"
			submitFunction={() => {
				isLoading = true;
				isFilterModalOpen = false;
				return async ({ update }) => {
					await update();
					isLoading = false;
				};
			}}
		>
			<Input
				defaultValue={settings._routeId}
				name="_routeId"
				type="hidden"
				value={settings._routeId}
			/>
			<Input
				defaultValue={settings.currentPage.toString()}
				name="currentPage"
				type="hidden"
				value={settings.currentPage.toString()}
			/>
			<Input
				defaultValue={JSON.stringify(filtersTemp)}
				name="filter"
				type="hidden"
				value={JSON.stringify(filtersTemp)}
			/>
			<Input defaultValue={modelName} name="modelName" type="hidden" value={modelName} />
			<Input
				defaultValue={settings.rowsPerPage.toString()}
				name="rowsPerPage"
				type="hidden"
				value={settings.rowsPerPage.toString()}
			/>
			<Input
				defaultValue={settings.sortDirection}
				name="sortDirection"
				type="hidden"
				value={settings.sortDirection}
			/>
			<Input
				defaultValue={settings.sortKey}
				name="sortKey"
				type="hidden"
				value={settings.sortKey}
			/>
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
			<Div class="flex justify-end space-x-2">
				<Button type="submit">Apply</Button>
				<Button onclick={() => (isFilterModalOpen = false)} variants={['ghost']}>Cancel</Button>
			</Div>
		</Form>
	</Modal>
{/snippet}

{#snippet bigintCreate({}: TdSnippet)}
	<Td />
{/snippet}
{#snippet booleanCreate({ key, object }: TdSnippet)}
	<Td>
		<Checkbox bind:checked={object[key]} name={key} />
	</Td>
{/snippet}
{#snippet currencyCreate({ key, object }: TdSnippet)}
	<Td class="hover:outline-primary-500/0 p-0">
		<Input
			bind:value={
				() => {
					return currency(object[key]);
				},
				(string) => {
					const value = parseFloat(string.replace(/[^0-9.-]+/g, ''));
					object[key] = value;
				}
			}
			class={twMerge(
				'rounded-none bg-transparent text-right outline-transparent dark:bg-transparent dark:outline-transparent'
			)}
			name={key}
		/>
	</Td>
{/snippet}
{#snippet functionCreate({}: TdSnippet)}
	<Td />
{/snippet}
{#snippet multiSelectCreate({ key, object, options }: TdSnippet)}
	<Td class="hover:outline-primary-500/0 p-0">
		<MultiSelect
			bind:value={object[key]}
			class="rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
			name={key}
			{options}
		/>
	</Td>
{/snippet}
{#snippet numberCreate({ key, object }: TdSnippet)}
	<Td class="hover:outline-primary-500/0 p-0">
		<Input
			bind:value={
				() => {
					return typeof object[key] === 'number' ? object[key].toString() : object[key];
				},
				(value) => {
					value = typeof value === 'number' ? value : parseFloat(value.replace(/[^0-9.-]+/g, ''));
					object[key] = value;
				}
			}
			class={twMerge(
				'rounded-none bg-transparent text-right outline-transparent dark:bg-transparent dark:outline-transparent'
			)}
			name={key}
			type="number"
		/>
	</Td>
{/snippet}
{#snippet objectCreate({}: TdSnippet)}
	<Td />
{/snippet}
{#snippet selectCreate({ key, object, options }: TdSnippet)}
	<Td class="hover:outline-primary-500/0 p-0">
		<Select
			bind:value={object[key]}
			class="rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
			name={key}
			{options}
		/>
	</Td>
{/snippet}
{#snippet stringCreate({ key, object }: TdSnippet)}
	<Td class="hover:outline-primary-500/0 p-0">
		<Input
			bind:value={object[key]}
			class={twMerge(
				'rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent'
			)}
			name={key}
		/>
	</Td>
{/snippet}
{#snippet symbolCreate({}: TdSnippet)}
	<Td />
{/snippet}
{#snippet timestampCreate({ key, object }: TdSnippet)}
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
			name={key}
			type="datetime-local"
		/>
	</Td>
{/snippet}
{#snippet undefinedCreate({}: TdSnippet)}
	<Td />
{/snippet}

{#snippet refTd({ isEditable, key, object, options }: TdSnippet)}
	{#if isEditable}
		<Td class="p-0">
			<Select
				class="w-full rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
				options={[{ label: '', value: '' }, ...options]}
				value={object?.[key] ?? ''}
			/>
		</Td>
	{:else}
		<Td>
			{options.find((option: Option) => option.value === object?.[key])?.label ?? ''}
		</Td>
	{/if}
{/snippet}
