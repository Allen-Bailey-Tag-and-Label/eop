<script lang="ts">
import {
	Button,
	Checkbox,
	Fieldset,
	Form,
	Icon,
	Input,
	InputManyToMany,
	Modal,
	ProgressIndicator,
	Select,
	Textarea,
	Tooltip
} from '$components';
import { ArrowUpTray, ExclamationTriangle, Plus, Trash } from '$icons';
import type { DataTableColumn, DataTableRow } from '$lib/types';

type Modal = {
	close?: () => boolean;
	isOpen?: boolean;
	open?: () => boolean;
	submitHandler: (e: any) => void;
	toggle?: () => boolean;
};

// props (external)
export let columns: DataTableColumn[];
export let createHandler: ((values: { [key: string]: any }) => void) | undefined = async (
	values
) => {
	rows = [...rows, { ...values, _dataTable: { selected: false } }];
};
export let deleteHandler: (() => void) | undefined = async () => {
	rows = rows.filter((row) => !row._dataTable.selected);
};
export let isCreatable: boolean;
export let isDeleteable: boolean;
export let isUploadable: boolean;
export let rows: DataTableRow[];
export let selectedRows: DataTableRow[];
export let uploadHandler: (value: string) => void;

// props (internal)
const modal: {
	create: Modal & { values: { [key: string]: any } };
	delete: Modal;
	loading: Modal;
	upload: Modal & { value: string };
} = {
	create: {
		submitHandler: async (e) => {
			e.preventDefault();
			if (modal?.loading?.open) modal.loading.open();
			if (createHandler) await createHandler(modal.create.values);
			if (modal?.loading?.close) modal.loading.close();
		},
		values: {}
	},
	delete: {
		submitHandler: async (e) => {
			e.preventDefault();
			if (modal?.loading?.open) modal.loading.open();
			if (modal?.delete?.close !== undefined) modal.delete.close();
			if (deleteHandler) await deleteHandler();
			if (modal?.loading?.close) modal.loading.close();
		}
	},
	loading: {
		submitHandler: () => {}
	},
	upload: {
		submitHandler: async (e) => {
			e.preventDefault();
			if (modal?.loading?.open) modal.loading.open();
			if (uploadHandler !== undefined) await uploadHandler(modal.upload.value);
			if (modal?.upload?.close) modal.upload.close();
			if (modal?.loading?.close) modal.loading.close();
		},
		value: ''
	}
};
</script>

<div class="flex items-center justify-end space-x-2 bg-slate-50 px-6 py-2 dark:bg-slate-900">
	{#if isDeleteable}
		<Tooltip class="z-[2]" position="bottom" tooltip="Delete">
			<Button
				disabled={selectedRows.length === 0 ? 'disabled' : undefined}
				on:click={modal.delete.toggle}
				variants={['icon', 'delete', 'xs']}
			>
				<Icon src={Trash} />
			</Button>
		</Tooltip>
	{/if}
	{#if isUploadable}
		<Tooltip class="z-[2]" position="bottom" tooltip="Import">
			<Button on:click={modal.upload.toggle} variants={['icon', 'xs']}>
				<Icon src={ArrowUpTray} />
			</Button>
		</Tooltip>
	{/if}
	{#if isCreatable}
		<Tooltip class="z-[2]" position="bottom" tooltip="Create">
			<Button on:click={modal.create.toggle} variants={['icon', 'xs']}>
				<Icon src={Plus} />
			</Button>
		</Tooltip>
	{/if}
</div>

<Modal
	bind:close={modal.create.close}
	bind:isOpen={modal.create.isOpen}
	bind:open={modal.create.open}
	bind:toggle={modal.create.toggle}
	class="pt-16"
>
	<Form class="flex flex-col space-y-6" on:submit={modal.create.submitHandler}>
		<div class="grid grid-cols-[fit-content(0px)_1fr] items-center gap-x-6 gap-y-3">
			{#each columns as { key, label, options, type }}
				<div>{label}</div>
				{#if type ==='boolean'}
					<Checkbox bind:checked={modal.create.values[key]} />
				{/if}
				{#if type ==='dateTime'}
					<Input bind:value={modal.create.values[key]} type="datetime-local" />
				{/if}
				{#if type ==='int'}
					<Input bind:value={modal.create.values[key]} type="number" />
				{/if}
				{#if type === 'many-to-many' && options !== undefined}
					<InputManyToMany bind:value={modal.create.values[key]} class="py-0" options={options} />
				{/if}
				{#if type === 'one-to-one'}
					<Select bind:value={modal.create.values[key]} options={options} />
				{/if}
				{#if type === 'string'}
					<Input bind:value={modal.create.values[key]} />
				{/if}
			{/each}
		</div>
		<div class="grid grid-cols-2 gap-4 lg:flex lg:justify-end lg:gap-2">
			<Button on:click={modal.create.close} variants={['outline']}>Cancel</Button>
			<Button type="submit">Create</Button>
		</div>
	</Form>
</Modal>
<Modal
	bind:close={modal.delete.close}
	bind:isOpen={modal.delete.isOpen}
	bind:open={modal.delete.open}
	bind:toggle={modal.delete.toggle}
>
	<Form class="flex flex-col space-y-6" on:submit={modal.delete.submitHandler}>
		<Icon class="mx-auto h-[5rem] w-[5rem] text-red-500" src={ExclamationTriangle} />
		<div>
			Are you sure you want to delete {selectedRows.length} row{selectedRows.length === 1 ? '':'s'}?<br
			/>
			( this cannot be undone )
		</div>
		<div class="grid grid-cols-2 gap-4 lg:flex lg:justify-end lg:gap-2">
			<Button on:click={modal.delete.close} variants={['outline']}>Cancel</Button>
			<Button type="submit" variants={['delete']}>Delete</Button>
		</div>
	</Form>
</Modal>

<Modal
	bind:close={modal.upload.close}
	bind:isOpen={modal.upload.isOpen}
	bind:open={modal.upload.open}
	bind:toggle={modal.upload.toggle}
	class="pt-12"
>
	<Form class="flex flex-col space-y-6" on:submit={modal.upload.submitHandler}>
		<Fieldset legend="CSV">
			<Textarea bind:value={modal.upload.value} />
		</Fieldset>
		<div class="grid grid-cols-2 gap-4 lg:flex lg:justify-end lg:gap-2">
			<Button on:click={modal.upload.close} variants={['outline']}>Cancel</Button>
			<Button type="submit">Upload</Button>
		</div>
	</Form>
</Modal>

<Modal
	bind:close={modal.loading.close}
	bind:isOpen={modal.loading.isOpen}
	bind:open={modal.loading.open}
	bind:toggle={modal.loading.toggle}
	isCloseable={false}
>
	<ProgressIndicator />
</Modal>
