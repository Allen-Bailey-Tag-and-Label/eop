<script lang="ts">
	import { Div } from '$lib/components';
	import SlideCanvas from './SlideCanvas.svelte';
	import { gridLayout, templateSlide, repeaterItemTime } from './repeater';
	import type { ColorScheme, DataRow, RepeaterDefinition } from './types';
	let {
		settings,
		rows = [],
		message = '',
		loading = false,
		data = {},
		width,
		height,
		timeMs,
		durationMs,
		scheme,
		assetBase,
		assetUrls,
		timeZone,
		unit = 1
	}: {
		settings: RepeaterDefinition;
		rows?: DataRow[];
		message?: string;
		loading?: boolean;
		data?: import('./types').SlideData;
		width: number;
		height: number;
		timeMs: number;
		durationMs: number;
		scheme: ColorScheme;
		assetBase: string;
		assetUrls: Record<string, string>;
		timeZone: string;
		unit?: number;
	} = $props();
	const items = $derived(rows);
	const grid = $derived(gridLayout(settings, width, height, items.length, timeMs, unit));
	const definition = $derived(templateSlide(settings, durationMs));
</script>

<Div
	class={`relative h-full w-full ${settings.clip === false ? 'overflow-visible' : 'overflow-hidden'}`}
	aria-label="Repeater grid"
>
	{#if items.length}
		{#each items.slice(grid.start, grid.start + grid.visibleCount) as row, index (row.id)}
			{@const itemTime = repeaterItemTime(settings, timeMs, index, grid.start, grid.page)}
			<Div
				style={`position:absolute;left:${(index % grid.columns) * (grid.itemWidth + grid.gapX)}px;top:${Math.floor(index / grid.columns) * (grid.itemHeight + grid.gapY) + grid.offsetY}px;width:${grid.itemWidth}px;height:${grid.itemHeight}px;visibility:${itemTime < 0 ? 'hidden' : 'visible'};`}
			>
				<SlideCanvas
					clip={settings.clip ?? true}
					{definition}
					timeMs={Math.max(0, itemTime)}
					{scheme}
					{assetBase}
					{assetUrls}
					{row}
					{data}
					rowIndex={grid.start + index}
					{timeZone}
					viewportWidth={grid.itemWidth}
					viewportHeight={grid.itemHeight}
					label={`Repeater item ${grid.start + index + 1}`}
				/>
			</Div>
		{/each}
	{:else}
		<Div class="flex h-full items-center justify-center"
			>{message || (loading ? 'Loading data?' : '')}</Div
		>
	{/if}
</Div>
