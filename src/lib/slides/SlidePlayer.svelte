<script lang="ts">
	import { onMount } from 'svelte';
	import { Div, H1, P } from '$lib/components';
	import SlideCanvas from './SlideCanvas.svelte';
	import { nextSlide, watchPlayback } from './playback';
	import { mediaIds, SlideMediaCache } from './media';
	import type { Playback, SlideDefinition } from './types';
	let { location }: { location: string } = $props();
	let playback = $state<Playback | null>(null);
	let queued: Playback | null | undefined;
	let index = $state(0);
	let timeMs = $state(0);
	let assetUrls = $state<Record<string, string>>({});
	let connected = $state(true);
	let mediaMissing = $state(false);
	let shown = $state<{ definition: SlideDefinition; title: string } | null>(null);
	let loading = $state(true);
	let finished = false;
	const cache = new SlideMediaCache();
	onMount(() => {
		const stop = watchPlayback(
			(content) => {
				loading = false;
				if (!playback || finished) {
					if (content?.version !== playback?.version) {
						index = 0;
						playback = content;
					}
				} else queued = content;
			},
			(value) => (connected = value)
		);
		return () => {
			stop();
			cache.destroy();
		};
	});
	$effect(() => {
		const current = playback;
		const slide = current?.slides[index];
		if (!current || !slide) {
			shown = null;
			mediaMissing = false;
			return;
		}
		const ids = mediaIds(slide.definition);
		cache.protectedIds = new Set(ids);
		const controller = new AbortController();
		let frame: number;
		let timer: ReturnType<typeof setTimeout>;
		const prefetch = new AbortController();
		let prefetchTimeout: ReturnType<typeof setTimeout>;
		const timeout = setTimeout(() => controller.abort(), 5000);
		let disposed = false;
		finished = false;
		void Promise.allSettled(ids.map((id) => cache.load(id, controller.signal))).then(() => {
			clearTimeout(timeout);
			if (disposed) return;
			assetUrls = cache.urls(ids);
			shown = { definition: slide.definition, title: current.title };
			timeMs = 0;
			mediaMissing = Object.keys(assetUrls).length !== ids.length;
			const start = performance.now();
			const tick = (now: number) => {
				timeMs = Math.min(slide.durationMs, now - start);
				frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
			timer = setTimeout(() => {
				cancelAnimationFrame(frame);
				timeMs = slide.durationMs;
				if (queued !== undefined) {
					const content = queued;
					queued = undefined;
					if (content?.version !== current.version) {
						index = 0;
						playback = content;
						return;
					}
				}
				const next = nextSlide(current, index);
				if (next === index && !current.loop) finished = true;
				else {
					index = next;
					if (current.slides.length === 1) playback = { ...current };
				}
			}, slide.durationMs);
			const upcoming = current.slides[nextSlide(current, index)];
			if (upcoming) {
				prefetchTimeout = setTimeout(() => prefetch.abort(), 10000);
				void Promise.allSettled(
					mediaIds(upcoming.definition).map((id) => cache.load(id, prefetch.signal))
				).finally(() => clearTimeout(prefetchTimeout));
			}
		});
		return () => {
			disposed = true;
			controller.abort();
			prefetch.abort();
			clearTimeout(prefetchTimeout);
			clearTimeout(timeout);
			clearTimeout(timer);
			cancelAnimationFrame(frame);
		};
	});
</script>

<Div class="fixed inset-0 bg-black text-white">
	{#if shown}
		<SlideCanvas
			definition={shown.definition}
			{timeMs}
			{assetUrls}
			assetBase="/monitors/media"
			label={`${shown.title} — ${location}`}
		/>
	{:else}
		<Div class="flex h-full flex-col items-center justify-center gap-6 p-8 text-center"
			><P class="text-2xl">Allen-Bailey Tag &amp; Label</P><H1 class="text-5xl text-white"
				>{location}</H1
			><P class="text-2xl"
				>{loading ? 'Loading playlist…' : 'No published playlist is assigned to this monitor.'}</P
			></Div
		>
	{/if}
	{#if !connected || mediaMissing}<P
			role="status"
			class="absolute bottom-4 left-4 rounded bg-black/80 px-4 py-2 text-sm text-white"
			>{!connected
				? 'Connection lost. Continuing loaded content and retrying…'
				: 'Some images could not load. Retrying on the next slide.'}</P
		>{/if}
</Div>
