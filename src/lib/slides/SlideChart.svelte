<script lang="ts">
	import { ChartPlot, Div, P } from '$lib/components';
	import type { SlideElement, SlideData, ColorScheme } from './types';
	let {
		element,
		data,
		scheme,
		width,
		height,
		unit = 1
	}: {
		element: SlideElement;
		data: SlideData;
		scheme: ColorScheme;
		width: number;
		height: number;
		unit?: number;
	} = $props();
	const result = $derived(data[element.id]);
</script>

{#if element.chart}
	{#if element.dataReference && (!result || result.state !== 'ready')}
		<Div class="flex h-full items-center justify-center"
			><P role="status">{result?.message || 'Loading chart data...'}</P></Div
		>
	{:else}
		<ChartPlot
			settings={element.chart}
			data={element.dataReference
				? (result?.items.map((row) => row.fields ?? {}) ?? [])
				: element.chart.rows}
			{scheme}
			fontScale={unit}
			{width}
			{height}
		/>
	{/if}
{/if}
