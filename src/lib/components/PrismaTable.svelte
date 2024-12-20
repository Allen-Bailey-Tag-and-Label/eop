<script lang="ts">
	import { DateTime as Luxon } from 'luxon';
	import { theme } from 'sveltewind';
	import {
		ArrowPath,
		Check,
		ChevronDoubleLeft,
		ChevronDoubleRight,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		Cog6Tooth,
		ExclamationTriangle,
		Plus,
		Trash
	} from 'sveltewind/icons';
	import { twMerge } from 'tailwind-merge';
	import { enhance } from '$app/forms';
	import {
		Button,
		Card,
		Checkbox,
		Div,
		Fieldset,
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
	import type { Column, Paginate, Row, SanitizedColumn, SnippetProps } from '$lib/prismaTable/types';

	type Props = {
		columnOrder: string[];
		columnOverrides?: Map<string, Partial<Column>>;
		columns: Column[];
		paginate: boolean | Omit<Paginate, 'currentPage' | 'numberOfRowsPerPage'>;
		rows: Row[];
		sortDirection: -1 | 1;
		sortKey: string;
	};

	let {
		columnOrder = $bindable([]),
		columnOverrides,
		columns = [],
		paginate = $bindable(true),
		rows = [],
		sortDirection = $bindable(1),
		sortKey = $bindable('')
	}: Props = $props();
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
					if (!isList) {
						obj[key || ''] = row[key];
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
	let sanitizedPaginate: Paginate = $state({
		currentPage: 0,
		index: {
			start: 0,
			end: 0
		},
		modal: {},
		numberOfRowsPerPage: 10,
		options: [],
		totalPages: 0
	});
	let sanitizedRows: Row[] = $state([]);
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
				if (typeof aValue === 'number') comparison = aValue - bValue;
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
			modal: {
				numberOfRowsPerPage: 10
			}
		}
	});
	const updateColumns = async (columns: Column[]) => {
		sanitizedColumns = (await columns)
			.map((column: Column) => {
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
				if (sanitizedColumn.type === 'DateTime') {
					sanitizedColumn.snippet = DateTime;
				}
				if (sanitizedColumn.type === 'Int') {
					sanitizedColumn.snippet = Int;
				}
				sanitizedColumn = Object.assign(sanitizedColumn, columnOverrides !== undefined && columnOverrides.has(sanitizedColumn.key) ? columnOverrides.get(sanitizedColumn.key) : {})
				return sanitizedColumn;
			})
			.sort((a, b) => {
				if (columnOrder.includes(a.key) && columnOrder.includes(b.key))
					return columnOrder.indexOf(a.key) - columnOrder.indexOf(b.key);
				if (columnOrder.includes(a.key) && !columnOrder.includes(b.key)) return -1;
				if (!columnOrder.includes(a.key) && columnOrder.includes(b.key)) return 1;
				return a.key.localeCompare(b.key);
			});
		if (sortKey === '') sortKey = sanitizedColumns[0].key;
	};
	const updatePaginate = () => {
		if (typeof paginate === 'boolean')
			sanitizedPaginate = {
				currentPage: 0,
				index: {
					start: 0,
					end: 0
				},
				modal: {},
				numberOfRowsPerPage: 10,
				options: [],
				totalPages: 0
			};
		if (typeof paginate === 'object')
			sanitizedPaginate = Object.assign(sanitizedPaginate, paginate);
	};
	const updateRows = async (rows: Row[]) => {
		sanitizedRows = JSON.parse(JSON.stringify(await rows)).map((row: Row) => {
			row._isSelected = false;
			return row;
		});
		originalRows = JSON.parse(JSON.stringify(sanitizedRows));
		sortRows();
	};
	const updateSanitizePaginate = () => {
		sanitizedPaginate.totalPages = Math.ceil(
			sanitizedRows.length / sanitizedPaginate.numberOfRowsPerPage
		);
		if (
			sanitizedPaginate.currentPage > sanitizedPaginate.totalPages - 1 &&
			sanitizedPaginate.totalPages > 0
		) {
			sanitizedPaginate.currentPage = sanitizedPaginate.totalPages - 1;
		}
		if (sanitizedPaginate.currentPage < 0) {
			sanitizedPaginate.currentPage = 0;
		}
		sanitizedPaginate.index.start =
			sanitizedPaginate.currentPage * sanitizedPaginate.numberOfRowsPerPage;
		sanitizedPaginate.index.end = Math.min(
			(sanitizedPaginate.currentPage + 1) * sanitizedPaginate.numberOfRowsPerPage,
			sanitizedRows.length
		);
		sanitizedPaginate.options = [...Array(sanitizedPaginate.totalPages)].map((_, i) => {
			const label = `${i * sanitizedPaginate.numberOfRowsPerPage + 1}-${Math.min((i + 1) * sanitizedPaginate.numberOfRowsPerPage, sanitizedRows.length)}`;
			const value = i;
			return { label, value };
		});
	};

	// $derives
	const paginatedRows = $derived(
		sanitizedRows.filter((_, rowIndex) =>
			paginate === false
				? true
				: rowIndex >= sanitizedPaginate.index.start && rowIndex < sanitizedPaginate.index.end
		)
	);
	const originalPaginatedRows = $derived(
		originalRows.filter((_, rowIndex) =>
			paginate === false
				? true
				: rowIndex >= sanitizedPaginate.index.start && rowIndex < sanitizedPaginate.index.end
		)
	);
	const rowsNeedingUpdates = $derived(
		paginatedRows
			.filter(
				(row, i) =>
					JSON.stringify(removeNonSchemaKeys(row)) !==
					JSON.stringify(removeNonSchemaKeys(originalPaginatedRows?.[i] || {}))
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
		if (paginate !== undefined) updatePaginate();
	});
	$effect(() => {
		updateRows(rows);
	});
	$effect(() => {
		if (
			sanitizedPaginate.currentPage !== undefined ||
			sanitizedPaginate.numberOfRowsPerPage ||
			sanitizedRows.length > 0
		)
			updateSanitizePaginate();
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
		<Div>
			<Button
				onclick={() => {
					sanitizedPaginate.modal.numberOfRowsPerPage = sanitizedPaginate.numberOfRowsPerPage;
					sanitizedPaginate.modal.toggle();
				}}
				variants={['default', 'icon']}
			>
				<Icon src={Cog6Tooth} />
			</Button>
			<Modal bind:toggle={sanitizedPaginate.modal.toggle}>
				<form
					action="/"
					class="flex flex-col space-y-4"
					method="POST"
					onsubmit={(e) => {
						e.preventDefault();
						sanitizedPaginate.numberOfRowsPerPage = sanitizedPaginate.modal.numberOfRowsPerPage;
						sanitizedPaginate.modal.toggle();
					}}
				>
					<Fieldset legend="Number Of Rows / Page">
						<Input
							bind:value={sanitizedPaginate.modal.numberOfRowsPerPage}
							class="text-right"
							min={1}
							type="number"
						/>
					</Fieldset>
					<Div class="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
						<Button onclick={sanitizedPaginate.modal.toggle} variants={['default', 'contrast']}>
							Cancel
						</Button>
						<Button type="submit">Update</Button>
					</Div>
				</form>
			</Modal>
		</Div>
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
	<Card class="relative overflow-auto rounded-none p-0 shadow-none dark:shadow-none">
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
				{#each paginatedRows as row, rowIndex}
					<Tr>
						<Td>
							<Checkbox
								bind:checked={paginatedRows[rowIndex]._isSelected}
								class="mr-0"
								onchange={() => {
									if (selectedRows.length === 0) allRowsAreSelected = false;
									if (selectedRows.length === paginatedRows.length) allRowsAreSelected = true;
								}}
							/>
						</Td>
						{#each sanitizedColumns as { key, relationOptions, snippet }}
							{@render snippet({ key, relationOptions, row, rowIndex })}
						{/each}
					</Tr>
				{/each}
			</Tbody>
		</Table>
	</Card>
	<Div class="flex items-center justify-between space-x-2 px-6 py-3 lg:justify-center">
		<Div class="flex justify-start space-x-2">
			<Button
				disabled={sanitizedPaginate.currentPage === 0}
				onclick={() => {
					sanitizedPaginate.currentPage = 0;
				}}
				variants={['default', 'icon']}
			>
				<Icon src={ChevronDoubleLeft} />
			</Button>
			<Button
				disabled={sanitizedPaginate.currentPage === 0}
				onclick={() => {
					sanitizedPaginate.currentPage--;
				}}
				variants={['default', 'icon']}
			>
				<Icon src={ChevronLeft} />
			</Button>
		</Div>
		<Select bind:value={sanitizedPaginate.currentPage} options={sanitizedPaginate.options} />
		<Div class="flex justify-end space-x-2">
			<Button
				disabled={sanitizedPaginate.currentPage >= sanitizedPaginate.totalPages - 1}
				onclick={() => {
					sanitizedPaginate.currentPage++;
				}}
				variants={['default', 'icon']}
			>
				<Icon src={ChevronRight} />
			</Button>
			<Button
				disabled={sanitizedPaginate.currentPage >= sanitizedPaginate.totalPages - 1}
				onclick={() => {
					sanitizedPaginate.currentPage = sanitizedPaginate.totalPages - 1;
				}}
				variants={['default', 'icon']}
			>
				<Icon src={ChevronDoubleRight} />
			</Button>
		</Div>
	</Div>
</Card>

{#snippet Boolean({ key, rowIndex }: SnippetProps)}
	<Td>
		<Checkbox bind:checked={paginatedRows[rowIndex][key]} />
	</Td>
{/snippet}
{#snippet DateTime({ key, rowIndex }: SnippetProps)}
<Td class="p-0">
	<Input
		bind:value={() => {
			const string = Luxon.fromJSDate(new Date(paginatedRows[rowIndex][key])).toFormat("yyyy-MM-dd'T'HH:mm")
			return string
		},
		(string) => {
			const date = new Date(string)
			paginatedRows[rowIndex][key] = date
			return date
		}}
		class="w-full rounded-none bg-transparent dark:bg-transparent"
		type="datetime-local"
	/>
</Td>
{/snippet}
{#snippet Int({ key, rowIndex }: SnippetProps)}
	<Td class="p-0">
		<Input
			bind:value={paginatedRows[rowIndex][key]}
			class="w-full rounded-none bg-transparent text-right dark:bg-transparent"
			type="number"
		/>
	</Td>
{/snippet}
{#snippet RelationIsList({ key, relationOptions, rowIndex }: SnippetProps)}
	<Td class="p-0">
		<MultiSelect bind:value={paginatedRows[rowIndex][key]} options={relationOptions} />
	</Td>
{/snippet}
{#snippet RelationIsNotList({ key, relationOptions, rowIndex }: SnippetProps)}
	<Td class="p-0">
		<Select
			bind:value={paginatedRows[rowIndex][key]}
			class="w-full rounded-none bg-transparent dark:bg-transparent"
			options={relationOptions}
		/>
	</Td>
{/snippet}
{#snippet String({ key, rowIndex }: SnippetProps)}
	<Td class="p-0">
		<Input
			bind:value={paginatedRows[rowIndex][key]}
			class="w-full rounded-none bg-transparent dark:bg-transparent"
		/>
	</Td>
{/snippet}
