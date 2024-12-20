<script lang="ts">
	import { Check, ExclamationTriangle } from 'sveltewind/icons';
	import { enhance } from '$app/forms';
	import { Button, Div, Form, Icon, Input, Modal, P, PrismaTable, Td } from '$lib/components';
	import type { SnippetProps } from '$lib/prismaTable/types';
	import type { PageData } from '.$types';

	type $Props = {
		data: PageData;
	};

	let { data }: $Props = $props();
	const columnOverrides = new Map([['passwordHash', { snippet: Password }]]);
	const modal: Record<string, Record<string, any>> = $state({
		confirmation: { isVisible: false },
		newPassword: { isVisible: false }
	});
</script>

<PrismaTable {...data} {columnOverrides} />

{#snippet Password({ row }: SnippetProps)}
	<Td class="p-0">
		<Button
			class="px-2 py-1"
			onclick={() => {
				modal.confirmation.row = row;
				modal.confirmation.open();
			}}
		>
			Reset Password
		</Button>
	</Td>
{/snippet}

<Modal
	bind:close={modal.confirmation.close}
	bind:isVisible={modal.confirmation.isVisible}
	bind:open={modal.confirmation.open}
	bind:toggle={modal.confirmation.toggle}
>
	<Form
		action="?/reset-password"
		use={[
			[
				enhance,
				() => {
					return ({
						result: {
							data: { password }
						}
					}: {
						result: any;
					}) => {
						modal.newPassword.password = password;
						modal.confirmation.close();
						modal.newPassword.open();
					};
				}
			]
		]}
	>
		<Icon class="mx-auto h-[5rem] w-[5rem] text-red-500" src={ExclamationTriangle} />
		<P class="mx-auto">
			Are you sure you want to reset the password for user "{modal.confirmation.row.username}"?
		</P>
		<Input
			class="absolute left-0 top-0 h-0 w-0 opacity-0"
			name="id"
			type="hidden"
			value={modal.confirmation.row.id}
		/>
		<Div class="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
			<Button onclick={modal.confirmation.toggle} variants={['default', 'contrast']}>Cancel</Button>
			<Button type="submit" variants={['default', 'error']}>Reset</Button>
		</Div>
	</Form>
</Modal>

<Modal
	bind:close={modal.newPassword.close}
	bind:isVisible={modal.newPassword.isVisible}
	bind:open={modal.newPassword.open}
	bind:toggle={modal.newPassword.toggle}
	class="space-y-4"
>
	<Icon class="mx-auto h-[5rem] w-[5rem] text-green-500" src={Check} />
	<P class="mx-auto">
		The password for username "{modal.confirmation.row.username}" has been updated to "{modal
			.newPassword.password}".
	</P>
	<Div class="grid grid-cols-2 gap-2 lg:flex lg:justify-end">
		<Div />
		<Button onclick={modal.newPassword.close}>Close</Button>
	</Div>
</Modal>
