<script lang="ts">
	import { Button, Form, Select } from '$lib/components';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	let tableOptions: { label: string; value: string }[] = $state([]);

	$effect(() => {
		if (data.tableOptions) untrack(() => (tableOptions = data.tableOptions));
	});
</script>

<Form>
	{#snippet inputs()}
		<Select label="Table" name="table" options={tableOptions} required={true} />
	{/snippet}
	{#snippet error()}
		{#if form}
			<textarea>{JSON.stringify(form, null, 2)}</textarea>
		{/if}
	{/snippet}
	{#snippet buttons()}
		<Button type="submit">Update Table</Button>
	{/snippet}
</Form>
