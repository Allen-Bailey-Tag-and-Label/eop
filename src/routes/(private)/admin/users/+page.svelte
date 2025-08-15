<script lang="ts">
	import { Button, Div, Form, H1, Input, Modal, MongooseTable, P, Td } from '$lib/components';
	import type { TdSnippet } from '$lib/components/MongooseTable/types.js';

	let { data } = $props();
	let resetModal = $state({
		code: '',
		isOpen: false
	});
	let virtualColumns = $state([{ key: 'buttons', label: '', snippet: resetPassword }]);
</script>

<Div class="flex flex-col p-4">
	<MongooseTable {data} modelName={'User'} {virtualColumns} />
</Div>

<Modal bind:isOpen={resetModal.isOpen} class="space-y-6">
	<Div class="flex flex-col items-center space-y-4">
		{#if resetModal.code === ''}
			<H1>******</H1>
			<P>Please wait while we get a one time reset code...</P>
		{:else}
			<H1>{resetModal.code}</H1>
			<P>Please provide the code to the user.</P>
		{/if}
	</Div>
	<Div class="flex justify-end space-x-2">
		<Button onclick={() => (resetModal.isOpen = false)} variants={['ghost']}>Cancel</Button>
	</Div>
</Modal>

{#snippet resetPassword({ object }: TdSnippet)}
	<Td class="py-0">
		<Form
			action="?/reset-password"
			submitFunction={() => {
				resetModal.isOpen = true;
				return async ({ result }) => {
					if (result.type === 'success' && result.data) {
						resetModal.code = result.data.code;
					}
				};
			}}
		>
			<Input
				class="sr-only absolute h-0 w-0 opacity-0"
				name="username"
				type="hidden"
				value={object.username}
			/>
			<Button type="submit" variants={['small']}>Reset Password</Button>
		</Form>
	</Td>
{/snippet}
