<script lang="ts">
	import { Button, Div, Form, RangeInput } from '$lib/components';
	import { percent } from '$lib/formats';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	let value = $state(16);

	$effect(() => {
		if (data.locals.user.settings.magnification)
			untrack(() => {
				value = data.locals.user.settings.magnification;
			});
	});
</script>

<Div class="flex flex-col p-4">
	<Form>
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
			<Button type="submit">Update Settings</Button>
		{/snippet}
	</Form>
</Div>
