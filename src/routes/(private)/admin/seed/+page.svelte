<script lang="ts">
	import { Button, Div, Form, Select } from '$lib/components';

	let { form } = $props();
	let tableOptions = [
		{ label: '', value: '' },
		{ label: 'ups-quotes', value: 'ups-quotes' }
	];
</script>

<Div class="flex flex-col p-4">
	<Form>
		<Select label="Table" name="table" options={tableOptions} required={true} />
		<Button type="submit">Get JSON</Button>
	</Form>
	{#if form}
		<textarea>{JSON.stringify(form, null, 2)}</textarea>
	{/if}
</Div>
