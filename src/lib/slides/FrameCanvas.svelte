<script lang="ts">
	import SlideCanvas from './SlideCanvas.svelte';
	import { frameSlide } from './frames';
	import type { ColorScheme, DataRow, SlideData, SlideElement } from './types';
	let {
		element,
		width,
		height,
		durationMs,
		timeMs,
		dataTimeMs,
		scheme,
		data,
		assetBase,
		assetUrls,
		row,
		rowIndex,
		timeZone
	}: {
		element: SlideElement;
		width: number;
		height: number;
		durationMs: number;
		timeMs: number;
		dataTimeMs: number;
		scheme: ColorScheme;
		data: SlideData;
		assetBase: string;
		assetUrls: Record<string, string>;
		row?: DataRow;
		rowIndex: number;
		timeZone: string;
	} = $props();
	let measuredWidth = $state(0),
		measuredHeight = $state(0);
</script>

<div class="h-full w-full" bind:clientWidth={measuredWidth} bind:clientHeight={measuredHeight}>
	<SlideCanvas
		definition={frameSlide(element, durationMs)}
		viewportWidth={measuredWidth || width}
		viewportHeight={measuredHeight || height}
		flow={element.frame}
		clip={element.frame?.clip ?? true}
		{timeMs}
		{dataTimeMs}
		{scheme}
		{data}
		{assetBase}
		{assetUrls}
		{row}
		{rowIndex}
		{timeZone}
		label={`Frame: ${element.text}`}
	/>
</div>
