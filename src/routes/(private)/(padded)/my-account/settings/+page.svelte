<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { Form, RangeInput, SubmitButton } from '$lib/components';
	import { percent } from '$lib/formats';

	let { data, form } = $props();
	let isLoading = $state(false);
	const submitFunction: SubmitFunction = () => {
		isLoading = true;
		return async ({ update }) => {
			isLoading = false;
			await update();
		};
	};
	let value = $state(16);

	$effect(() => {
		if (data.locals.user.settings.magnification)
			untrack(() => {
				value = data.locals.user.settings.magnification;
			});
	});
</script>

<Form {submitFunction}>
	{#snippet inputs()}
		<RangeInput
			bind:value={
				() => {
					return value.toString();
				},
				(string) => {
					value = +string;
				}
			}
			formatValue={(v: string | number) =>
				percent((typeof v === 'number' ? v : +v) / 16, {
					maximumFractionDigits: 0,
					minimumFractionDigits: 0
				})}
			label="Magnification"
			max={22}
			min={10}
			name="magnification"
		/>
	{/snippet}
	{#snippet error()}
		{form?.error}
	{/snippet}
	{#snippet buttons()}
		<SubmitButton bind:isLoading>Update Settings</SubmitButton>
	{/snippet}
</Form>
