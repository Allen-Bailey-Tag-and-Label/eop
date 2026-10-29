<script lang="ts">
	import SlideCanvas from './SlideCanvas.svelte';
	import { displayBackground } from './colors';
	import type { ColorScheme, SlideLayer } from './types';
	let {
		incoming,
		outgoing = null,
		progress = 1,
		scheme,
		assetBase,
		label = 'Slide preview'
	}: {
		incoming: SlideLayer;
		outgoing?: SlideLayer | null;
		progress?: number;
		scheme: ColorScheme;
		assetBase: string;
		label?: string;
	} = $props();
</script>

<div
	class="relative isolate h-full w-full overflow-hidden"
	style={`background:${displayBackground(scheme)};`}
>
	{#if outgoing}
		<div
			class="absolute inset-0"
			data-playback-layer="outgoing"
			aria-hidden="true"
			style={`background:${displayBackground(scheme)};`}
		>
			<SlideCanvas {...outgoing} {scheme} {assetBase} label="Outgoing slide" />
		</div>
	{/if}
	<div
		class="absolute inset-0"
		data-playback-layer="incoming"
		style={`background:${displayBackground(scheme)};opacity:${Math.max(0, Math.min(1, progress))};`}
	>
		<SlideCanvas {...incoming} {scheme} {assetBase} {label} />
	</div>
</div>
