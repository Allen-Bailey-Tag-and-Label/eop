<script lang="ts">
	import { Button, Div, Form, RangeInput } from '$lib/components';
	import { percent } from '$lib/formats';
	import { untrack } from 'svelte';

	let { data } = $props();
	const formatValue = (v: string | number) =>
		percent((typeof v === 'number' ? v : +v) / 16, {
			maximumFractionDigits: 0,
			minimumFractionDigits: 0
		});
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
		<RangeInput
			bind:value
			{formatValue}
			label="Magnification"
			max="22"
			min="10"
			name="magnification"
		/>
		<Div class="flex justify-end">
			<Button type="submit">Update</Button>
		</Div>
	</Form>
</Div>
