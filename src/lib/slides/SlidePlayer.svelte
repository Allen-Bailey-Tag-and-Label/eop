<script lang="ts">
	import { onMount } from 'svelte';
	import { Div, H1, P } from '$lib/components';
	import SlideCanvas from './SlideCanvas.svelte';
	import { nextSlide, watchPlayback } from './playback';
	import { mediaIds, SlideMediaCache } from './media';
	import type { ColorScheme, DisplayMode, Playback, PlaybackSlide, SlideDefinition } from './types';
	import { displayBackground } from './colors';
	let { location }: { location: string } = $props();
	let playback = $state<Playback | null>(null);
	let queued = $state<Playback | null | undefined>();
	let index = $state(0);
	let timeMs = $state(0);
	let assetUrls = $state<Record<string, string>>({});
	let connected = $state(true);
	let colorMode = $state<DisplayMode>('dark');
	let prefersDark = $state(false);
	const scheme = $derived<ColorScheme>(
		colorMode === 'system' ? (prefersDark ? 'dark' : 'light') : colorMode
	);
	let mediaMissing = $state(false);
	let shown = $state<{
		definition: SlideDefinition;
		title: string;
		durationMs: number;
		version: string;
		next: PlaybackSlide | null;
	} | null>(null);
	let preparing = $state<PlaybackSlide | null>(null);
	let nextPreview = $state<{ definition: SlideDefinition; urls: Record<string, string> } | null>(
		null
	);
	let previewLoading = $state(false);
	let displayWidth = $state(0);
	let displayHeight = $state(0);
	const upcoming = $derived.by(() => {
		if (!shown) return null;
		if (preparing) return preparing;
		if (queued !== undefined && queued?.version !== shown.version) return queued?.slides[0] ?? null;
		return shown.next;
	});
	const remainingSeconds = $derived(
		Math.max(0, Math.ceil(((shown?.durationMs ?? 0) - timeMs) / 1000))
	);
	const countdown = $derived(
		`${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`
	);
	let loading = $state(true);
	let finished = false;
	let refresh: (() => Promise<void>) | undefined;
	const cache = new SlideMediaCache();
	onMount(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const updateScheme = () => (prefersDark = media.matches);
		updateScheme();
		media.addEventListener('change', updateScheme);
		const source = watchPlayback(
			(content) => {
				loading = false;
				if (!playback || finished) {
					if (content?.version !== playback?.version) {
						index = 0;
						playback = content;
					}
				} else queued = content;
			},
			(value) => (connected = value),
			(value) => (colorMode = value)
		);
		refresh = source.refresh;
		return () => {
			media.removeEventListener('change', updateScheme);
			source.stop();
			cache.destroy();
		};
	});
	$effect(() => {
		const current = playback;
		const slide = current?.slides[index];
		if (!current || !slide) {
			shown = null;
			preparing = null;
			mediaMissing = false;
			return;
		}
		const ids = mediaIds(slide.definition);
		preparing = slide;
		cache.protectedIds = new Set(ids);
		const controller = new AbortController();
		let frame: number;
		let timer: ReturnType<typeof setTimeout>;
		const timeout = setTimeout(() => controller.abort(), 5000);
		let disposed = false;
		finished = false;
		void Promise.allSettled(ids.map((id) => cache.load(id, controller.signal))).then(() => {
			clearTimeout(timeout);
			if (disposed) return;
			assetUrls = cache.urls(ids);
			const next = nextSlide(current, index);
			shown = {
				definition: slide.definition,
				title: current.title,
				durationMs: slide.durationMs,
				version: current.version,
				next: current.loop || next !== index ? current.slides[next] : null
			};
			preparing = null;
			timeMs = 0;
			mediaMissing = Object.keys(assetUrls).length !== ids.length;
			const start = performance.now();
			const tick = (now: number) => {
				timeMs = Math.min(slide.durationMs, now - start);
				frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
			timer = setTimeout(async () => {
				cancelAnimationFrame(frame);
				timeMs = slide.durationMs;
				// Revalidate published content before every new slide, including single-slide loops.
				await refresh?.();
				if (disposed) return;
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
		});
		return () => {
			disposed = true;
			controller.abort();
			clearTimeout(timeout);
			clearTimeout(timer);
			cancelAnimationFrame(frame);
		};
	});
	$effect(() => {
		const slide = upcoming;
		nextPreview = null;
		previewLoading = !!slide;
		if (!slide || preparing) return;
		const ids = mediaIds(slide.definition);
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);
		let disposed = false;
		void Promise.allSettled(ids.map((id) => cache.load(id, controller.signal))).then(() => {
			clearTimeout(timeout);
			if (disposed) return;
			previewLoading = false;
			const urls = cache.urls(ids);
			if (Object.keys(urls).length === ids.length)
				nextPreview = { definition: slide.definition, urls };
		});
		return () => {
			disposed = true;
			controller.abort();
			clearTimeout(timeout);
		};
	});
</script>

<Div
	class="fixed inset-0 flex flex-col"
	data-color-mode={scheme}
	style={`background:${displayBackground(scheme)};color:${scheme === 'dark' ? '#f9fafb' : '#111827'};color-scheme:${scheme};`}
>
	<div
		class="relative min-h-0 flex-1"
		role="region"
		aria-label="Current slide"
		bind:clientWidth={displayWidth}
		bind:clientHeight={displayHeight}
	>
		{#if shown}
			<SlideCanvas
				definition={shown.definition}
				{timeMs}
				{scheme}
				animateTransitions
				durationMs={shown.durationMs}
				includeExit={shown.next !== null}
				{assetUrls}
				assetBase="/monitors/media"
				label={`${shown.title} — ${location}`}
			/>
		{:else}
			<Div class="flex h-full flex-col items-center justify-center gap-6 p-8 text-center"
				><P class="text-2xl">Allen-Bailey Tag &amp; Label</P><H1
					class="text-5xl text-current dark:text-current">{location}</H1
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
	</div>
	{#if shown}
		<Div
			class="flex shrink-0 items-center justify-between gap-4 border-t px-4 py-3 md:px-6"
			style={`background:${scheme === 'dark' ? '#030712' : '#f3f4f6'};border-color:${scheme === 'dark' ? '#ffffff26' : '#00000026'};`}
			role="region"
			aria-label="Playback information"
		>
			<Div class="flex min-w-0 items-center gap-3" role="region" aria-label="Up next">
				{#if upcoming}
					<Div
						class="aspect-video w-24 shrink-0 overflow-hidden rounded border border-current md:w-32"
						style={`background:${displayBackground(scheme)};`}
						aria-hidden="true"
					>
						{#if nextPreview}
							<SlideCanvas
								definition={nextPreview.definition}
								{scheme}
								assetUrls={nextPreview.urls}
								timeMs={Math.min(2000, upcoming.durationMs / 2)}
								viewportWidth={displayWidth || upcoming.definition.width}
								viewportHeight={displayHeight || upcoming.definition.height}
								assetBase="/monitors/media"
								label="Next slide preview"
							/>
						{:else}<Div class="flex h-full items-center justify-center text-xs opacity-60"
								>{previewLoading ? 'Preview loading…' : 'Preview unavailable'}</Div
							>{/if}
					</Div>
				{/if}
				<Div class="min-w-0"
					><P class="text-xs tracking-wide uppercase opacity-60">Up next</P><P
						class="truncate text-base font-semibold md:text-xl"
						title={upcoming?.title}
						>{upcoming ? upcoming.title || 'Next slide' : 'End of playlist'}</P
					></Div
				>
			</Div>
			<Div class="shrink-0 text-right"
				><P class="text-xs tracking-wide uppercase opacity-60">Time remaining</P><P
					role="timer"
					aria-label="Current slide time remaining"
					aria-live="off"
					class="font-mono text-3xl leading-none font-semibold tabular-nums md:text-4xl"
					>{countdown}</P
				></Div
			>
		</Div>
	{/if}
</Div>
