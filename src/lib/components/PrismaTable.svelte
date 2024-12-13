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
		P,
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

	type Column =
		| string
		| {
				key: string;
				label?: string;
				width?: number;
		  };
	type Props = {
		columns: Column[];
		rows: Row[];
	};
	type Row = Record<string, any>;
	type SanitizedColumn = {
		key: keyof Row;
		label: string;
		width: number;
	};

	let { columns = [], rows = [] }: Props = $props();
	let allRowsAreSelected = $state(false);
	const defaultColumnWidth = 229;
	const modal: Record<string, { toggle?: any }> = $state({
		delete: {}
	});
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
	let sortKey: keyof Row = $state('href');
	const sortRows = () => {
		({ originalRows, sanitizedRows } = sanitizedRows
			.map((sanitizedRow, i) => {
				return { originalRow: originalRows[i], sanitizedRow };
			})
			.sort(
				(a, b) => a.sanitizedRow[sortKey].localeCompare(b.sanitizedRow[sortKey]) * sortDirection
			)
			.reduce(
				(obj: { originalRows: Row[]; sanitizedRows: Row[] }, { originalRow, sanitizedRow }) => {
					obj.originalRows.push(originalRow);
					obj.sanitizedRows.push(sanitizedRow);
					return obj;
				},
				{ originalRows: [], sanitizedRows: [] }
			));
	};

	const updateColumns = (columns: Column[]) => {
		sanitizedColumns = columns.map((column: Column) => {
			let sanitizedColumn: SanitizedColumn = { key: 'id', label: '', width: defaultColumnWidth };
			if (typeof column === 'string')
				return { key: column, label: column, width: defaultColumnWidth };
			if (typeof column === 'object') {
				sanitizedColumn = Object.assign(sanitizedColumn, column);
				if (!sanitizedColumn?.label) sanitizedColumn.label = sanitizedColumn.key;
				if (!sanitizedColumn?.width) sanitizedColumn.width = defaultColumnWidth;
			}
			return sanitizedColumn;
		});
	};
	const updateRows = async (rows: Row[]) => {
		sanitizedRows = JSON.parse(JSON.stringify(await rows))
			.map((row: Row) => {
				row._isSelected = false;
				return row;
			})
			.sort((a: Row, b: Row) => a[sortKey].localeCompare(b[sortKey]) * sortDirection);
		originalRows = JSON.parse(JSON.stringify(sanitizedRows));
	};
	const rowsNeedingUpdates = $derived(
		sanitizedRows
			.filter(
				(row, i) =>
					JSON.stringify(removeNonSchemaKeys(row)) !==
					JSON.stringify(removeNonSchemaKeys(originalRows?.[i] || {}))
			)
			.map(removeNonSchemaKeys)
	);
	const saveIsNeeded = $derived(rowsNeedingUpdates.length > 0);
	const selectedRows = $derived(sanitizedRows.filter((row) => row._isSelected));
	const rowsAreSelected = $derived(selectedRows.length > 0);

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
				onclick={modal.delete.toggle}
				variants={['default', 'icon', 'error']}
			>
				<Icon src={Trash} />
			</Button>
			<Modal bind:toggle={modal.delete.toggle}>
				<Form
					action="?/delete"
					use={[
						[
							enhance,
							() => {
								return ({ update }: { update: any }) => {
									modal.delete.toggle();
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
						<Button onclick={modal.delete.toggle} variants={['default', 'contrast']}>Cancel</Button>
						<Button type="submit" variants={['default', 'error']}>Delete</Button>
					</Div>
				</Form>
			</Modal>
		</Div>
		<Form action="?/save" use={[[enhance]]}>
			<Button disabled={!saveIsNeeded} type="submit" variants={['default', 'icon', 'success']}>
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
										_isSelected: e?.target?.checked,
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
										'flex h-[3rem] w-full items-center justify-between space-x-2'
									)}
									onclick={() => {
										if (key === sortKey) {
											sortDirection = sortDirection === -1 ? 1 : -1;
										}
										if (key !== sortKey) sortDirection = 1;
										sortKey = key;
										sortRows();
									}}
									variants={['ghost']}
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
								onchange={(e) => {
									if (selectedRows.length === 0) allRowsAreSelected = false;
									if (selectedRows.length === sanitizedRows.length) allRowsAreSelected = true;
								}}
							/>
						</Td>
						{#each sanitizedColumns as { key }}
							<Td class="p-0">
								<Input
									bind:value={sanitizedRows[rowIndex][key]}
									class="w-full rounded-none bg-transparent dark:bg-transparent"
								/>
							</Td>
						{/each}
					</Tr>
				{/each}
			</Tbody>
		</Table>
	</Card>
</Card>
