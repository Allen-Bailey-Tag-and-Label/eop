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
		H1
	} from '$lib/components';
	import { type Column, type TdSnippet } from '$lib/components/MongooseTable/types';
	import { localState } from '$lib/localState';
	import { Asterisk } from '@lucide/svelte';

	let { data } = $props();
	let resetPasswordDialog: {
		code: string;
		isOpen: boolean;
	} = $state({
		code: '',
		isOpen: false
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
	const updateRows = async (rowsPromise: Promise<unknown>) => {
		const resolved = await rowsPromise;
		rows = resolved as any;
	};

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
			<Button variants={['small']}>Roles</Button>
		</Div>
	</Td>
{/snippet}
