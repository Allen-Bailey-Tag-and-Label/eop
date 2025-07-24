<script lang="ts">
	import { Plus, Trash, TriangleAlert } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { currency, inputDateTimeLocal } from '$lib/formats';

	import Button from '../Button/Button.svelte';
	import Card from '../Card/Card.svelte';
	import Checkbox from '../Checkbox/Checkbox.svelte';
	import { compareFn, type ColumnType, type TdSnippet } from '../Datatable';
	import Datatable from '../Datatable/Datatable.svelte';
	import { filterOperatorOptions } from '../Datatable/filterOperators';
	import Dialog from '../Dialog/Dialog.svelte';
	import Div from '../Div/Div.svelte';
	import Input from '../Input/Input.svelte';
	import Form from '../Form/Form.svelte';
	import P from '../P/P.svelte';
	import Select from '../Select/Select.svelte';
	import Table from '../Table/Table.svelte';
	import Tbody from '../Tbody/Tbody.svelte';
	import Tr from '../Tr/Tr.svelte';
	import Td from '../Td/Td.svelte';
	import Thead from '../Thead/Thead.svelte';
	import Th from '../Th/Th.svelte';
	import { type Props } from './types';
	import type { Snippet } from 'svelte';

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
	const createSnippetMap: Map<ColumnType, Snippet<[TdSnippet]>> = new Map([
		['bigint', bigintCreate],
		['boolean', booleanCreate],
		['currency', currencyCreate],
		['function', functionCreate],
		['number', numberCreate],
		['object', objectCreate],
		['select', selectCreate],
		['string', stringCreate],
		['symbol', symbolCreate],
		['timestamp', timestampCreate],
		['undefined', undefinedCreate]
	]);

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
	bind:sort
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
			<Form
				action="/api/mongooseTable?/create"
				submitFunction={() => {
					return async ({ result, update }) => {
						await update();
						console.log(result);
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

{#snippet createdByTd({ object }: TdSnippet)}
	<Td>{object._createdById.username}</Td>
{/snippet}
