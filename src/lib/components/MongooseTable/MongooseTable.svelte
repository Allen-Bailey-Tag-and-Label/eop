<script lang="ts">
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
	} from '@lucide/svelte';
	import { untrack, type Component, type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { currency, inputDateTimeLocal } from '$lib/formats';
	import { theme } from '$lib/theme';

	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import Datatable from '../Datatable/Datatable.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import Div from '../Div/Div.svelte';
	import Input from '../Input/Input.svelte';
	import Form from '../Form/Form.svelte';
	import P from '../P/P.svelte';
	import Select from '../Select/Select.svelte';
	import Table from '../Table/Table.svelte';
	import Tbody from '../Tbody/Tbody.svelte';
	import Td from '../Td/Td.svelte';
	import Thead from '../Thead/Thead.svelte';
	import Th from '../Th/Th.svelte';
	import Tr from '../Tr/Tr.svelte';

	import { compareFn } from '../Datatable';
	import { filterOperatorOptions } from '../Datatable/filterOperators';

	import type {
		ColumnSanitized,
		ColumnType,
		Data,
		Option,
		Props,
		Row,
		Settings,
		TdSnippet
	} from './types';
	import Spinner from '../Spinner/Spinner.svelte';

	let {
		columns = $bindable([]),
		columnInferredTypes = $bindable([]),
		columnsSanitized = $bindable([]),
		create = $bindable({}),
		createDialog: customCreateDialog,
		data,
		deleteDialog: customDeleteDialog,
		filters = $bindable([]),
		filterDialog: customFilterDialog,
		filterKeyOptions = $bindable([]),
		filtersTemp = $bindable([]),
		filtersTempSanitized = $bindable([]),
		isCreatable = $bindable(true),
		isCreateDialogOpen = $bindable(false),
		isDeletable = $bindable(true),
		isDeleteDialogOpen = $bindable(false),
		isEditable = $bindable(true),
		isFilterable = $bindable(true),
		isFilterDialogOpen = $bindable(false),
		isLoading = $bindable(true),
		isPaginateable = $bindable(true),
		isSelectable = $bindable(true),
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
			filter: {},
			rowsPerPage: 10,
			sortDirection: 'asc',
			sortKey: ''
		}),
		tbody: customTbody,
		th: customTh,
		thead,
		toolbar: customToolbar,
		totalRows = $bindable(0)
	}: Props = $props();
	const createSnippetMap: Map<ColumnType, Snippet<[TdSnippet]>> = new Map([
		['bigint', bigintCreate],
		['boolean', booleanCreate],
		['currency', currencyCreate],
		['function', functionCreate],
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
	const updateData = async (data: Data) => {
		isLoading = true;
		const [resolvedRows, resolvedTotalRows] = await Promise.all([data.rows, data.totalRows]);
		columns = data.columns;
		rows = resolvedRows as Row[];
		settings = data.settings;
		totalRows = resolvedTotalRows as number;
		isLoading = false;
		initialized = true;
	};
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
		if (
			columns.filter(
				(column) =>
					typeof column === 'object' && column.type === 'ref' && column.snippet === undefined
			).length > 0
		) {
			columns = columns.map((column) => {
				if (typeof column === 'string') return column;
				if (typeof column === 'object' && column.type === 'ref' && column.snippet === undefined) {
					column.snippet = refTd;
				}
				return column;
			});
		}
	});
</script>

{#if initialized}
	<Div class="relative">
		<Datatable
			bind:columns
			bind:columnInferredTypes
			bind:columnsSanitized
			bind:create
			bind:filters
			bind:filterKeyOptions
			bind:filtersTemp
			bind:filtersTempSanitized
			bind:isCreatable
			bind:isCreateDialogOpen
			bind:isDeletable
			bind:isDeleteDialogOpen
			bind:isEditable
			bind:isFilterable
			bind:isFilterDialogOpen
			bind:isPaginateable
			bind:isSortable
			bind:paginationSettings
			bind:rows
			bind:rowsCheckboxValues
			bind:rowsFiltered
			bind:rowsPaginated
			bind:rowsSanitized
			bind:rowsSelected
			bind:settings
			createDialog={customCreateDialog !== undefined ? customCreateDialog : createDialog}
			deleteDialog={customDeleteDialog !== undefined ? customDeleteDialog : deleteDialog}
			filterDialog={customFilterDialog !== undefined ? customFilterDialog : filterDialog}
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
				<Input name="_routeId" type="hidden" value={settings._routeId} />
				<Input name="currentPage" type="hidden" value={settings.currentPage} />
				<Input name="filter" type="hidden" value={JSON.stringify(settings.filter)} />
				<Input name="rowsPerPage" type="hidden" value={settings.rowsPerPage} />
				<Input name="sortDirection" type="hidden" value={settings.sortDirection} />
				<Input name="sortKey" type="hidden" value={settings.sortKey} />
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
		<Input name="_routeId" type="hidden" value={settings._routeId} />
		<Input name="currentPage" type="hidden" value={currentPage} />
		<Input name="filter" type="hidden" value={JSON.stringify(settings.filter)} />
		<Input name="rowsPerPage" type="hidden" value={settings.rowsPerPage} />
		<Input name="sortDirection" type="hidden" value={settings.sortDirection} />
		<Input name="sortKey" type="hidden" value={settings.sortKey} />
		<Button {disabled} type="submit" variants={['icon']}>
			<Icon />
		</Button>
	</Form>
{/snippet}
{#snippet tbody()}
	<Tbody>
		{#each rowsSanitized as { index: rowIndex }}
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
				<Input name="_routeId" type="hidden" value={settings._routeId} />
				<Input name="currentPage" type="hidden" value={settings.currentPage} />
				<Input name="filter" type="hidden" value={JSON.stringify(settings.filter)} />
				<Input name="rowsPerPage" type="hidden" value={settings.rowsPerPage} />
				<Input
					name="sortDirection"
					type="hidden"
					value={key !== settings.sortKey
						? 'asc'
						: settings.sortDirection === 'asc'
							? 'desc'
							: 'asc'}
				/>
				<Input name="sortKey" type="hidden" value={key} />
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
						create = columnsSanitized.reduce((obj: Record<string, any>, { key, type }) => {
							if (type === 'bigint') obj[key] = BigInt(0);
							if (type === 'boolean') obj[key] = false;
							if (type === 'currency') obj[key] = 0;
							if (type === 'function') obj[key] = () => {};
							if (type === 'number') obj[key] = 0;
							if (type === 'object') obj[key] = {};
							if (type === 'ref') obj[key] = '';
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
{/snippet}

{#snippet createDialog()}
	{#if columnsSanitized}
		<Dialog bind:open={isCreateDialogOpen}>
			<Form
				action="/api/mongooseTable?/create"
				class="max-w-full"
				submitFunction={() => {
					return async ({ update }) => {
						await update();
						isCreateDialogOpen = false;
					};
				}}
			>
				<Input
					class="absolute top-0 left-0 h-0 w-0 opacity-0"
					name="modelName"
					type="hidden"
					value={modelName}
				/>
				<Card class="space-y-6">
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
						<Button onclick={() => (isCreateDialogOpen = false)} variants={['ghost']}>Cancel</Button
						>
					</Div>
				</Card>
			</Form>
		</Dialog>
	{/if}
{/snippet}
{#snippet deleteDialog()}
	<Dialog bind:open={isDeleteDialogOpen}>
		<Form
			action="/api/mongooseTable?/delete"
			submitFunction={() => {
				return async ({ update }) => {
					await update();
					rowsCheckboxValues = rowsCheckboxValues.map((_) => false);
					isDeleteDialogOpen = false;
				};
			}}
		>
			<Input name="modelName" type="hidden" value={modelName} />
			{#each rowsCheckboxValues as isChecked, rowIndex}
				{#if isChecked}
					<Input name="_id" type="hidden" value={rows[rowIndex]._id} />
				{/if}
			{/each}
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
				<Div>{JSON.stringify(rowsSelected, null, 2)}</Div>
				<Div class="grid w-full grid-cols-2 gap-4">
					<Button onclick={() => (isDeleteDialogOpen = false)} variants={['contrast']}
						>Cancel</Button
					>
					<Button autoFocus={true} type="submit" variants={['error']}>Delete</Button>
				</Div>
			</Card>
		</Form>
	</Dialog>
{/snippet}
{#snippet filterDialog()}
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
