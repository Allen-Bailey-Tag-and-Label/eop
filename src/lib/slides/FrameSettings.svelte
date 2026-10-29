<script lang="ts">
	import { Checkbox, Div, Select } from '$lib/components';
	import InspectorInput from './InspectorInput.svelte';
	import type { FrameDefinition } from './types';
	let { settings = $bindable() }: { settings: FrameDefinition } = $props();
</script>

<Select
	label="Layout"
	aria-label="Frame layout"
	bind:value={settings.layout}
	options={[
		{ value: 'free', label: 'Free positioning' },
		{ value: 'row', label: 'Flex row' },
		{ value: 'column', label: 'Flex column' },
		{ value: 'grid', label: 'Grid' }
	]}
/>
{#if settings.layout !== 'free'}
	{#if settings.layout === 'grid'}<InspectorInput
			label="Frame columns"
			prefix="Cols"
			type="number"
			min={1}
			max={12}
			value={String(settings.columns)}
			oninput={(event) => (settings.columns = event.currentTarget.valueAsNumber)}
		/>{/if}
	<Div class="grid grid-cols-2 gap-2">
		<InspectorInput
			label="Frame horizontal gap"
			prefix="GX"
			type="number"
			min={0}
			max={512}
			value={String(settings.columnGap)}
			oninput={(event) => (settings.columnGap = event.currentTarget.valueAsNumber)}
		/>
		<InspectorInput
			label="Frame vertical gap"
			prefix="GY"
			type="number"
			min={0}
			max={512}
			value={String(settings.rowGap)}
			oninput={(event) => (settings.rowGap = event.currentTarget.valueAsNumber)}
		/>
	</Div>
	<Select
		label="Distribution"
		aria-label="Frame distribution"
		bind:value={settings.justify}
		options={['start', 'center', 'end', 'space-between'].map((value) => ({ value, label: value }))}
	/>
	<Select
		label="Alignment"
		aria-label="Frame alignment"
		bind:value={settings.align}
		options={['start', 'center', 'end', 'stretch'].map((value) => ({ value, label: value }))}
	/>
	{#if settings.layout !== 'grid'}<Checkbox label="Wrap items" bind:checked={settings.wrap} />{/if}
{/if}
<Checkbox label="Clip frame contents" bind:checked={settings.clip} />
