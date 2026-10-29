<script lang="ts">
	import InspectorInput from './InspectorInput.svelte';
	import { Div, P, Select } from '$lib/components';
	import { gridLayout } from './repeater';
	import type { RepeaterDefinition } from './types';
	let {
		settings = $bindable(),
		width = 1000,
		height = 540,
		count = 0
	}: { settings: RepeaterDefinition; width?: number; height?: number; count?: number } = $props();
	const grid = $derived(gridLayout(settings, width, height, count, 0));
	const numbers = [
		{ key: 'columns', label: 'Columns (0 = automatic)', min: 0, max: 12 },
		{ key: 'minItemWidth', label: 'Minimum item width', min: 24, max: 4096 },
		{ key: 'itemHeight', label: 'Item height (0 = template aspect)', min: 0, max: 4096 },
		{ key: 'columnGap', label: 'Column gap', min: 0, max: 512 },
		{ key: 'rowGap', label: 'Row gap', min: 0, max: 512 },
		{ key: 'pageDurationMs', label: 'Page / scroll duration (ms)', min: 500, max: 600000 }
	] as const;
</script>

<Div class="flex flex-col gap-2">
	<P class="text-xs opacity-60"
		>Reference layout: {grid.columns} columns, {grid.capacity} items per page, {grid.pages} pages for
		the current results. One full page cycle takes {(
			(grid.pages * settings.pageDurationMs) /
			1000
		).toFixed(1)} seconds.</P
	>
	<Div class="grid grid-cols-2 gap-2">
		{#each numbers as field (field.key)}
			<InspectorInput
				label={field.label}
				prefix={{
					columns: 'Cols',
					minItemWidth: 'Min',
					itemHeight: 'H',
					columnGap: 'GX',
					rowGap: 'GY',
					pageDurationMs: 'ms'
				}[field.key]}
				aria-label={field.label}
				type="number"
				min={field.min}
				max={field.max}
				step={1}
				value={String(settings[field.key])}
				oninput={(event) => (settings[field.key] = Number(event.currentTarget.value))}
			/>
		{/each}</Div
	>
	<Select
		label="Grid vertical alignment"
		bind:value={settings.align}
		options={['start', 'center', 'end'].map((value) => ({ value, label: value }))}
	/>
	<Select
		label="Grid overflow"
		aria-label="Grid overflow"
		bind:value={settings.overflow}
		options={['paginate', 'scroll', 'clip'].map((value) => ({ value, label: value }))}
	/>
	<P class="text-xs opacity-60"
		>Pagination changes pages at the selected interval. Scrolling moves automatically down and back.
		Set the slide display duration long enough to show all pages; held final slides continue
		cycling.</P
	>
	<Div class="grid grid-cols-2 gap-2">
		{#each ['width', 'height'] as field (field)}
			<InspectorInput
				label={`Template ${field}`}
				prefix={field === 'width' ? 'W' : 'H'}
				type="number"
				min={1}
				max={4096}
				value={String(settings.template[field as 'width' | 'height'])}
				oninput={(event) =>
					(settings.template[field as 'width' | 'height'] = Number(event.currentTarget.value))}
			/>
		{/each}</Div
	>
</Div>
