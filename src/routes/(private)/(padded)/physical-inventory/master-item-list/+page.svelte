<script lang="ts">
	import { Form, SubmitButton, Textarea } from '$lib/components';
	import type { SubmitFunction } from '@sveltejs/kit';

	// types
	type Props = {
		form: any;
	};

	// helpers
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};
	// $props
	let { form }: Props = $props();

	// $state
	let isLoading = $state(false);
</script>

<Form {submitFunction}>
	{#snippet inputs()}
		<Textarea label="CSV" name="csv"></Textarea>
	{/snippet}
	{#snippet error()}
		{form?.error}
	{/snippet}
	{#snippet buttons()}
		<SubmitButton bind:isLoading>Update</SubmitButton>
	{/snippet}
</Form>
