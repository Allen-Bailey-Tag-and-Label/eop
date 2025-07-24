<script lang="ts">
	import { Plus, Trash, TriangleAlert } from '@lucide/svelte';
	import { type Props } from './types';
	import { filterOperatorOptions } from '../Datatable/filterOperators';

	import Datatable from '../Datatable/Datatable.svelte';
	import Dialog from '../Dialog/Dialog.svelte';
	import Card from '../Card/Card.svelte';
	import Div from '../Div/Div.svelte';
	import P from '../P/P.svelte';
	import Button from '../Button/Button.svelte';
	import Table from '../Table/Table.svelte';
	import Tbody from '../Tbody/Tbody.svelte';
	import Tr from '../Tr/Tr.svelte';
	import Td from '../Td/Td.svelte';
	import Thead from '../Thead/Thead.svelte';
	import Th from '../Th/Th.svelte';
	import Select from '../Select/Select.svelte';
	import { compareFn, type TdSnippet } from '../Datatable';

	let {
		columns = $bindable([]),
		columnsSanitized = $bindable([]),
		create = $bindable({}),
		createDialog: customCreateDialog,
		deleteDialog: customDeleteDialog,
		filters = $bindable([]),
		filterDialog: customFilterDialog,
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
		modelName = $bindable(),
		pagination = $bindable(true),
		rows = $bindable([]),
		rowsCheckboxValues = $bindable([]),
		rowsSelected = $bindable([]),
		sort = $bindable({ direction: 'asc', index: -1, key: '' }),
		tbody,
		thead,
		toolbar
	}: Props = $props();

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
				compareFn: (a: { username: string }, b: { username: string }) => {
					return a.username.localeCompare(b.username);
				},
				isCreatable: false,
				isEditable: false,
				isFilterable: true,
				key: '_createdById',
				label: 'Created By',
				snippet: createdByTd
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
</script>

<Datatable
	bind:columns
	bind:columnsSanitized
	bind:create
	bind:filters
	bind:filterKeyOptions
	bind:filtersTemp
	bind:filtersTempSanitized
	bind:isCreateDialogOpen
	bind:isDeleteDialogOpen
	bind:isFilterDialogOpen
	bind:pagination
	bind:rows
	bind:rowsCheckboxValues
	bind:rowsSelected
	createDialog={customCreateDialog !== undefined ? customCreateDialog : createDialog}
	deleteDialog={customDeleteDialog !== undefined ? customDeleteDialog : deleteDialog}
	filterDialog={customFilterDialog !== undefined ? customFilterDialog : filterDialog}
	{isCreatable}
	{isDeletable}
	{isEditable}
	{isFilterable}
	{isSortable}
	{tbody}
	{thead}
	{toolbar}
/>

{#snippet createDialog()}
	{#if columnsSanitized}
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
{/snippet}
{#snippet createdByTd({ object }: TdSnippet)}
	<Td>{object._createdById.username}</Td>
{/snippet}
{#snippet deleteDialog()}
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
