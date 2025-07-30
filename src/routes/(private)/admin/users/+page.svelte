<script lang="ts">
	import { deserialize } from '$app/forms';
	import {
		MongooseTable,
		Div,
		Td,
		Button,
		Dialog,
		Form,
		Input,
		Card,
		P,
		H1,
		MultiSelect,
		Select
	} from '$lib/components';
	import { type Column, type TdSnippet } from '$lib/components/MongooseTable/types';
	import { localState } from '$lib/localState';

	let { data } = $props();
	let branchesDialog: {
		_id: string;
		isOpen: boolean;
		value: string[];
	} = $state({
		_id: '',
		isOpen: false,
		value: []
	});
	let branches: { _id: string; number: number; label: number }[] = $state([]);
	let columns: Column[] = $state([
		{ class: 'w-[0px]', key: '_options', label: ' ', snippet: optionsSnippet },
		'username',
		{ class: 'w-[0px]', key: 'isActive', type: 'boolean' },
		{ key: '_defaultBranchId', label: 'Default Branch', snippet: select }
	]);
	let resetPasswordDialog: {
		code: string;
		isOpen: boolean;
	} = $state({
		code: '',
		isOpen: false
	});
	let roles: { _id: string; label: string }[] = $state([]);
	let rolesDialog: {
		_id: string;
		isOpen: boolean;
		value: string[];
	} = $state({
		_id: '',
		isOpen: false,
		value: []
	});
	let rows: any[] = $state([]);
	let settings = localState('user/management', {
		sort: { direction: 'asc', key: 'href' }
	});
	const updateBranchOptions = async (promise: Promise<unknown>) => {
		const resolved = await promise;
		branches = resolved as any;
	};
	const updateRoles = async (rowsPromise: Promise<unknown>) => {
		const resolved = await rowsPromise;
		roles = resolved as any;
	};
	const updateRows = async (rowsPromise: Promise<unknown>) => {
		const resolved = await rowsPromise;
		rows = resolved as any;
	};

	const branchOptions = $derived.by(() =>
		branches.map((branch) => ({
			label: `${branch.number} - ${branch.label}`,
			value: branch._id
		}))
	);
	const rolesOptions = $derived.by(() =>
		roles.map((role) => ({
			label: role.label,
			value: role._id
		}))
	);
	$effect(() => {
		updateBranchOptions(data.branches);
	});
	$effect(() => {
		updateRoles(data.roles);
	});
	$effect(() => {
		updateRows(data.rows);
	});
</script>

<Div class="flex flex-col p-4">
	{#if rows.length === 0}
		<Div>Loading...</Div>
	{:else}
		<MongooseTable bind:columns bind:rows bind:sort={settings.sort} modelName="User" />
	{/if}
</Div>

<Dialog bind:open={branchesDialog.isOpen}>
	<Form
		action="/api/mongooseTable?/update"
		submitFunction={() => {
			return async ({ update }) => {
				await update();
				branchesDialog.isOpen = false;
			};
		}}
	>
		<Input name="modelName" type="hidden" value="User" />
		<Input name="_id" type="hidden" value={branchesDialog._id} />
		<Card class="items-center space-y-6">
			<MultiSelect bind:value={branchesDialog.value} name="_branchIds" options={branchOptions} />
			<Div class="flex justify-end space-x-2">
				<Button type="submit">Update</Button>
				<Button
					type="button"
					onclick={() => {
						branchesDialog.isOpen = false;
					}}
					variants={['ghost']}>Cancel</Button
				>
			</Div>
		</Card>
	</Form>
</Dialog>
<Dialog bind:open={resetPasswordDialog.isOpen}>
	<Card class="items-center space-y-6">
		<Div class="flex flex-col items-center space-y-4">
			{#if resetPasswordDialog.code === ''}
				<H1>******</H1>
				<P>Please wait while we get a one time reset code...</P>
			{:else}
				<H1>{resetPasswordDialog.code}</H1>
				<P>Please provide the code to the user.</P>
			{/if}
		</Div>
	</Card>
</Dialog>
<Dialog bind:open={rolesDialog.isOpen}>
	<Form
		action="/api/mongooseTable?/update"
		submitFunction={() => {
			return async ({ update }) => {
				await update();
				rolesDialog.isOpen = false;
			};
		}}
	>
		<Input name="modelName" type="hidden" value="User" />
		<Input name="_id" type="hidden" value={rolesDialog._id} />
		<Card class="items-center space-y-6">
			<MultiSelect bind:value={rolesDialog.value} name="_roleIds" options={rolesOptions} />
			<Div class="flex justify-end space-x-2">
				<Button type="submit">Update</Button>
				<Button
					type="button"
					onclick={() => {
						rolesDialog.isOpen = false;
					}}
					variants={['ghost']}>Cancel</Button
				>
			</Div>
		</Card>
	</Form>
</Dialog>

{#snippet optionsSnippet({ object }: TdSnippet)}
	<Td class="py-0">
		<Div class="flex space-x-2">
			<Button
				onclick={() => {
					branchesDialog._id = object._id;
					branchesDialog.isOpen = true;
					branchesDialog.value = object._branchIds.map((branch: { _id: string }) => branch._id);
				}}
				variants={['small']}
			>
				Branches
			</Button>
			<Form
				action="?/reset-password"
				submitFunction={() => {
					resetPasswordDialog.code = '';
					resetPasswordDialog.isOpen = true;

					return async ({ result, update }) => {
						if (result.type === 'success' && result?.data?.code)
							resetPasswordDialog.code = result.data.code;
						await update();
					};
				}}
			>
				<Input name="username" type="hidden" value={object.username} />
				<Button type="submit" variants={['small']}>Reset Password</Button>
			</Form>
			<Button
				onclick={() => {
					rolesDialog._id = object._id;
					rolesDialog.isOpen = true;
					rolesDialog.value = object._roleIds.map((role: { _id: string }) => role._id);
				}}
				variants={['small']}>Roles</Button
			>
		</Div>
	</Td>
{/snippet}
{#snippet select({ key, object }: TdSnippet)}
	<Td class="py-0">
		<Select
			class="w-full rounded-none bg-transparent outline-transparent dark:bg-transparent dark:outline-transparent"
			onchange={async (e: { target: { value: any } }) => {
				console.log(e.target.value);
				if (e.target.value === '') return;

				const formData = new FormData();
				formData.append('_id', object._id);
				formData.append('modelName', 'User');
				formData.append(key, e.target.value);

				const response = await fetch('/api/mongooseTable?/update', {
					method: 'POST',
					body: formData
				});

				const result = deserialize(await response.text());

				object[key] = e.target.value;
			}}
			options={[{ label: '', value: '' }, ...branchOptions]}
			value={object[key]}
		/>
	</Td>
{/snippet}
