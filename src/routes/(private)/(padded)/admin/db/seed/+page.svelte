<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { Form, Select, SubmitButton } from '$lib/components';

	let { data, form } = $props();
	let isLoading = $state(false);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};
	let tableOptions: { label: string; value: string }[] = $state([]);

	$effect(() => {
		if (data.tableOptions) untrack(() => (tableOptions = data.tableOptions));
	});
</script>

<Form {submitFunction}>
	{#snippet inputs()}
		<Select label="Table" name="table" options={tableOptions} required={true} />
	{/snippet}
	{#snippet error()}
		{#if form}
			<textarea>{JSON.stringify(form, null, 2)}</textarea>
		{/if}
	{/snippet}
	{#snippet buttons()}
		<SubmitButton bind:isLoading>Update Table</SubmitButton>
	{/snippet}
</Form>
