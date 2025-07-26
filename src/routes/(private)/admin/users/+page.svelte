<script lang="ts">
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
		MultiSelect
	} from '$lib/components';
	import { type Column, type TdSnippet } from '$lib/components/MongooseTable/types';
	import { localState } from '$lib/localState';

	let { data } = $props();
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
	let columns: Column[] = $state([
		{ key: '_options', label: ' ', snippet: optionsSnippet },
		{ key: 'isActive', type: 'boolean' },
		'username'
	]);
	let settings = localState('user/management', {
		sort: { direction: 'asc', key: 'href' }
	});
	const updateRoles = async (rowsPromise: Promise<unknown>) => {
		const resolved = await rowsPromise;
		roles = resolved as any;
	};
	const updateRows = async (rowsPromise: Promise<unknown>) => {
		const resolved = await rowsPromise;
		rows = resolved as any;
	};

	const rolesOptions = $derived.by(() =>
		roles.map((role) => ({
			label: role.label,
			value: role._id
		}))
	);
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
			<MultiSelect bind:value={rolesDialog.value} name="roles" options={rolesOptions} />
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
					rolesDialog.value = object.roles.map((role: { _id: string }) => role._id);
				}}
				variants={['small']}>Roles</Button
			>
		</Div>
	</Td>
{/snippet}
