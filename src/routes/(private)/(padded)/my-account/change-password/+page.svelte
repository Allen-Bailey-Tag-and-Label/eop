<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Form, Input, SubmitButton } from '$lib/components';

	let { form } = $props();
	let isLoading = $state(false);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};
</script>

<Form {submitFunction}>
	{#snippet inputs()}
		<Input label="Password (Current)" name="passwordCurrent" required={true} type="password" />
		<Input label="Password (New)" name="password" required={true} type="password" />
		<Input label="Password (New Confirm)" name="passwordConfirm" required={true} type="password" />
	{/snippet}
	{#snippet error()}
		{form?.error}
	{/snippet}
	{#snippet buttons()}
		<SubmitButton bind:isLoading>Change Password</SubmitButton>
	{/snippet}
</Form>
