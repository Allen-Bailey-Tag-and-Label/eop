<script lang="ts">
	import { Checkbox, Div, MultiSelect, Radio } from '$lib/components';

	let isChild = $state(true);
	let group = $state(0);
	const values = Array(3)
		.fill(0)
		.map((_, index) => ({ label: `Option ${index + 1}`, value: index }));
	const variantOptions = $state(['box'].map((label) => ({ label, value: label })));
	let variants = $state([]);
</script>

<Div class="flex flex-col items-start space-y-6 p-4">
	<Div class="flex space-x-2">
		<MultiSelect bind:value={variants} label="Variants" options={variantOptions} />
		<Checkbox bind:checked={isChild} label="Show Child" />
	</Div>
	<Div class="flex space-x-2">
		{#each values as { label, value }}
			{#if isChild}
				<Radio bind:group {value} {variants}>{label}</Radio>
			{:else}
				<Radio bind:group {value} {variants} />
			{/if}
		{/each}
	</Div>
</Div>
