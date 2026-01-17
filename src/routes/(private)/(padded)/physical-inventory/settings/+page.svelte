<script lang="ts">
	import { Form, Select, SubmitButton } from '$lib/components';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageData } from './$types';

	// types
	type Props = {
		data: PageData;
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
	let { data, form }: Props = $props();

	// $state
	let isLoading = $state(false);

	// $derives
	const branchOptions = $derived.by(() =>
		data.branches.map(({ _id, number }: { _id: string; number: number }) => ({
			label: number,
			value: _id
		}))
	);
</script>

<Form {submitFunction}>
	{#snippet inputs()}
		<Select
			label="Branch"
			name="physicalInventoryBranchId"
			options={branchOptions}
			value={data.physicalInventoryBranchId.value}
		/>
	{/snippet}
	{#snippet error()}
		{form?.error}
	{/snippet}
	{#snippet buttons()}
		<SubmitButton bind:isLoading>Update</SubmitButton>
	{/snippet}
</Form>
