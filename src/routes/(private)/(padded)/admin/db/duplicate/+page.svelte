<script lang="ts">
	import { Form, Input, SubmitButton } from '$lib/components';
	import type { SubmitFunction } from '@sveltejs/kit';

	let isLoading = $state(false);
	let sourceDB = $state('v4');
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};
	let targetDB = $state('v4Dev');
</script>

<Form {submitFunction}>
	{#snippet inputs()}
		<Input bind:value={sourceDB} label="Source DB" name="sourceDB" required={true} />
		<Input bind:value={targetDB} label="Target DB" name="targetDB" required={true} />
	{/snippet}

	{#snippet buttons()}
		<SubmitButton bind:isLoading>Duplicate</SubmitButton>
	{/snippet}
</Form>
