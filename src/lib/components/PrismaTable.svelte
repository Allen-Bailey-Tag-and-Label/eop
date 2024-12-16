<script lang="ts">
	import {
		Button,
		Card,
		Checkbox,
		Div,
		Form,
		Icon,
		Input,
		Modal,
		MultiSelect,
		P,
		Select,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '$lib/components';
	import {
		ArrowPath,
		Check,
		ChevronDown,
		ExclamationTriangle,
		Plus,
		Trash
	} from 'sveltewind/icons';
	import { enhance } from '$app/forms';
	import { theme } from 'sveltewind';
	import { twMerge } from 'tailwind-merge';
	import type { Column, Row, SanitizedColumn } from '$lib/prismaTable/types';

	type Props = {
		columns: Column[];
		rows: Row[];
	};

	let { columns = [], rows = [] }: Props = $props();
	let allRowsAreSelected = $state(false);
	const defaultColumnWidth = 229;
	const getUpdateData = (row: Row, rowIndex: number) =>
		Object.keys(row)
			.filter((key) => !key.startsWith('_'))
			.reduce((obj: Row, key) => {
				const { isList, isRelational, relationKey } = sanitizedColumns.find(
					(sanitizedColumn) => sanitizedColumn.key === key
				) || { isList: false, isRelational: false, relationKey: '' };
				if (!isRelational) obj[key] = row[key];
				if (isRelational) {
					if (isList) {
						obj[relationKey || ''] = {
							connect: row[key].map((id: string) => ({ id })),
							disconnect: (originalRows?.[rowIndex]?.[key] || [])
								.filter((id: string) => !row[key].includes(id))
								.map((id: string) => ({ id }))
						};
					}
				}
				return obj;
			}, {});
	let originalRows: Row[] = $state([]);
	const removeNonSchemaKeys = (row: Row) =>
		Object.keys(row)
			.filter((key) => !key.startsWith('_'))
			.reduce((obj: Row, key) => {
				obj[key] = row[key];
				return obj;
			}, {});
	let resizeColumn = $state({
		index: -1,
		startX: -1
	});
	let sanitizedColumns: SanitizedColumn[] = $state([]);
	let sanitizedRows: Row[] = $state([]);
	let sortDirection: 1 | -1 = $state(1);
	let sortKey: keyof Row = $state('');
	const sortRows = () => {
		({ originalRows, sanitizedRows } = sanitizedRows
			.map((sanitizedRow, i) => {
				return { originalRow: originalRows[i], sanitizedRow };
			})
			.sort((a, b) => {
				const aValue: any = a.sanitizedRow[sortKey];
				const bValue: any = b.sanitizedRow[sortKey];
				let comparison: number = 0;
				if (typeof aValue === 'boolean')
					comparison = aValue === bValue ? 0 : aValue === true ? -1 : 1;
				if (typeof aValue === 'string') comparison = aValue.localeCompare(bValue);
				return comparison * sortDirection;
			})
			.reduce(
				(obj: { originalRows: Row[]; sanitizedRows: Row[] }, { originalRow, sanitizedRow }) => {
					obj.originalRows.push(originalRow);
					obj.sanitizedRows.push(sanitizedRow);
					return obj;
				},
				{ originalRows: [], sanitizedRows: [] }
			));
	};
	const toolbar: Record<string, any> = $state({
		delete: {
			modal: {}
		}
	});
	const updateColumns = async (columns: Column[]) => {
		sanitizedColumns = (await columns).map((column: Column) => {
			let sanitizedColumn: SanitizedColumn = {
				isList: false,
				isRelational: false,
				key: '',
				label: '',
				relationOptions: [],
				snippet: String,
				type: 'String',
				width: defaultColumnWidth
			};
			sanitizedColumn = Object.assign(sanitizedColumn, column);
			if (sanitizedColumn.isRelational) {
				if (!sanitizedColumn.isList) sanitizedColumn.snippet = RelationIsNotList;
				if (sanitizedColumn.isList) sanitizedColumn.snippet = RelationIsList;
			}
			if (sanitizedColumn.type === 'Boolean') {
				sanitizedColumn.snippet = Boolean;
				sanitizedColumn.width = 48;
			}
			return sanitizedColumn;
		});
		if (sortKey === '') sortKey = sanitizedColumns[0].key;
	};
	const updateRows = async (rows: Row[]) => {
		sanitizedRows = JSON.parse(JSON.stringify(await rows)).map((row: Row) => {
			row._isSelected = false;
			return row;
		});
		sortRows();
		originalRows = JSON.parse(JSON.stringify(sanitizedRows));
	};

	// $derives
	const rowsNeedingUpdates = $derived(
		sanitizedRows
			.filter(
				(row, i) =>
					JSON.stringify(removeNonSchemaKeys(row)) !==
					JSON.stringify(removeNonSchemaKeys(originalRows?.[i] || {}))
			)
			.map(getUpdateData)
	);
	const saveIsNeeded = $derived(rowsNeedingUpdates.length > 0);
	const selectedRows = $derived(sanitizedRows.filter((row) => row._isSelected));
	const rowsAreSelected = $derived(selectedRows.length > 0);

	// $effects
	$effect(() => {
		updateColumns(columns);
	});
	$effect(() => {
		updateRows(rows);
	});
</script>

<svelte:window
	onmousemove={(e) => {
		if (resizeColumn.index !== -1) {
			const deltaX = e.clientX - resizeColumn.startX;
			sanitizedColumns[resizeColumn.index].width += deltaX;
			resizeColumn.startX = e.clientX;
		}
	}}
	onmouseup={() => (resizeColumn.index = -1)}
/>

<Card class="max-w-full self-start overflow-hidden p-0">
	<Div class="flex justify-end space-x-2 px-6 py-3">
		<Div>
			<Button
				disabled={!rowsAreSelected}
				onclick={toolbar.delete.modal.toggle}
				variants={['default', 'icon', 'error']}
			>
				<Icon src={Trash} />
			</Button>
			<Modal bind:toggle={toolbar.delete.modal.toggle}>
				<Form
					action="?/delete"
					use={[
						[
							enhance,
							() => {
								return ({ update }: { update: any }) => {
									toolbar.delete.modal.toggle();
									update();
								};
							}
						]
					]}
				>
					<Icon class="mx-auto h-[5rem] w-[5rem] text-red-500" src={ExclamationTriangle} />
					<P class="mx-auto">
						Are you sure you want to delete the selected item{selectedRows.length !== 1 ? 's' : ''}?
					</P>
					<Input
						class="absolute left-0 top-0 h-0 w-0 opacity-0"
						name="ids"
						type="hidden"
						value={JSON.stringify(
							[...sanitizedRows].filter((row, i) => row._isSelected).map((row) => row.id)
						)}
					/>
					<Div class="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
						<Button onclick={toolbar.delete.modal.toggle} variants={['default', 'contrast']}
							>Cancel</Button
						>
						<Button type="submit" variants={['default', 'error']}>Delete</Button>
					</Div>
				</Form>
			</Modal>
		</Div>
		<Form action="?/save" use={[[enhance]]}>
			<Button
				class="grid grid-cols-1 grid-rows-1"
				disabled={!saveIsNeeded}
				type="submit"
				variants={['default', 'icon', 'success']}
			>
				<Icon src={Check} />
			</Button>
			<Input
				class="absolute left-0 top-0 h-0 w-0 opacity-0"
				name="updates"
				value={JSON.stringify(rowsNeedingUpdates)}
			/>
		</Form>
		<Form
			action="?/update"
			use={[
				[
					enhance,
					() => {
						return ({ update }: { update: any }) => {
							update();
						};
					}
				]
			]}
		>
			<Button type="submit" variants={['default', 'icon']}>
				<Icon src={ArrowPath} />
			</Button>
		</Form>
		<Form action="?/create" use={[[enhance]]}>
			<Button type="submit" variants={['default', 'icon']}>
				<Icon src={Plus} />
			</Button>
		</Form>
	</Div>
	<Card class="relative overflow-auto rounded-none p-0">
		<Table>
			<Thead>
				<Tr>
					<Th class="w-[3rem]">
						<Checkbox
							bind:checked={allRowsAreSelected}
							class="mr-0"
							onclick={(e) => {
								sanitizedRows = sanitizedRows.map(({ _isSelected, ...row }) => {
									return {
										_isSelected: e.currentTarget.checked,
										...row
									};
								});
							}}
						/>
					</Th>
					{#each sanitizedColumns as { key, label, width }, i}
						<Th class="p-0" style="width:{width}px;">
							<Div class="relative">
								<Button
									class={twMerge(
										theme.getComponentVariant('th', 'default'),
										'flex h-[3rem] w-full items-center justify-between space-x-2 rounded-none'
									)}
									onclick={() => {
										if (key === sortKey) {
											sortDirection = sortDirection === -1 ? 1 : -1;
										}
										if (key !== sortKey) sortDirection = 1;
										sortKey = key;
										sortRows();
									}}
									variants={['default', 'ghost']}
								>
									<Div>{label}</Div>
									<Icon
										class={twMerge(
											'h-4 w-4 transition duration-200',
											key === sortKey ? 'scale-100' : 'scale-0',
											sortDirection === 1 ? 'rotate-0' : 'rotate-180'
										)}
										src={ChevronDown}
									/>
								</Button>
								<Div
									class="group absolute right-0 top-0 z-[100] flex h-full w-4 cursor-col-resize justify-end"
									ondblclick={() => {
										sanitizedColumns[i].width = defaultColumnWidth;
									}}
									onmousedown={(e) => {
										resizeColumn.index = i;
										resizeColumn.startX = e.clientX;
									}}
								>
									<Div
										class="h-full w-1 bg-primary-500/0 transition duration-200 group-hover:bg-primary-500"
									/>
								</Div>
							</Div>
						</Th>
					{/each}
				</Tr>
			</Thead>
			<Tbody>
				{#each sanitizedRows as _, rowIndex}
					<Tr>
						<Td>
							<Checkbox
								bind:checked={sanitizedRows[rowIndex]._isSelected}
								class="mr-0"
								onchange={() => {
									if (selectedRows.length === 0) allRowsAreSelected = false;
									if (selectedRows.length === sanitizedRows.length) allRowsAreSelected = true;
								}}
							/>
						</Td>
						{#each sanitizedColumns as { key, relationOptions, snippet }}
							{@render snippet({ key, relationOptions, rowIndex })}
						{/each}
					</Tr>
				{/each}
			</Tbody>
		</Table>
	</Card>
</Card>

{#snippet Boolean({ key, rowIndex }: { key: string; rowIndex: number })}
	<Td>
		<Checkbox bind:checked={sanitizedRows[rowIndex][key]} />
	</Td>
{/snippet}
{#snippet RelationIsList({
	key,
	relationOptions,
	rowIndex
}: {
	key: string;
	relationOptions: { label: any; value: string }[];
	rowIndex: number;
})}
	<Td class="p-0">
		<MultiSelect bind:value={sanitizedRows[rowIndex][key]} options={relationOptions} />
	</Td>
{/snippet}
{#snippet RelationIsNotList()}
	<Td>RelationIsNotList</Td>
{/snippet}
{#snippet String({
	key,
	rowIndex
}: {
	key: string;
	relationOptions: { label: any; value: string }[];
	rowIndex: number;
})}
	<Td class="p-0">
		<Input
			bind:value={sanitizedRows[rowIndex][key]}
			class="w-full rounded-none bg-transparent dark:bg-transparent"
		/>
	</Td>
{/snippet}
