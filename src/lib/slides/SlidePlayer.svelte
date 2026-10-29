<script lang="ts">
	import { onMount } from 'svelte';
	import { allElements } from './repeater';
	import { Div, H1, P } from '$lib/components';
	import SlideCanvas from './SlideCanvas.svelte';
	import { nextSlide, watchPlayback, rotatePlayback, upcomingSlides } from './playback';
	import { mediaIds, SlideMediaCache } from './media';
	import type {
		ColorScheme,
		DisplayMode,
		Playback,
		PlaybackSlide,
		SlideData,
		SlideDefinition
	} from './types';
	import { displayBackground } from './colors';
	import { slideTiming } from './timeline';
	let { location }: { location: string } = $props();
	let playback = $state<Playback | null>(null);
	let queued = $state<Playback | null | undefined>();
	let index = $state(0);
	let timeMs = $state(0);
	let dataTimeMs = $state(0);
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
		totalMs: number;
		version: string;
		next: PlaybackSlide | null;
		data: SlideData;
	} | null>(null);
	let preparing = $state<PlaybackSlide | null>(null);
	let nextPreviews = $state<Record<string, { urls: Record<string, string> }>>({});
	let previewLoading = $state(false);
	let displayWidth = $state(0);
	let displayHeight = $state(0);
	const upcoming = $derived.by(() => {
		if (!shown) return [];
		if (preparing && playback)
			return upcomingSlides(playback, index, playback.upcomingCount ?? 3, true);
		if (queued !== undefined) {
			if (!queued) return [];
			if (queued.version !== shown.version)
				return upcomingSlides(queued, 0, queued.upcomingCount ?? 3, true);
			return upcomingSlides(queued, index);
		}
		return playback ? upcomingSlides(playback, index) : [];
	});
	const remainingSeconds = $derived(
		Math.max(0, Math.ceil(((shown?.totalMs ?? 0) - timeMs) / 1000))
	);
	const countdown = $derived(
		`${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`
	);
	let loading = $state(true);
	let finished = false;
	let refresh: (() => Promise<void>) | undefined;
	const cache = new SlideMediaCache();
	let orderedVersion: string | undefined;
	let startOffset = 0;
	onMount(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const updateScheme = () => (prefersDark = media.matches);
		updateScheme();
		media.addEventListener('change', updateScheme);
		const source = watchPlayback(
			(received) => {
				if (received?.version !== orderedVersion) {
					orderedVersion = received?.version;
					startOffset = received?.randomStart
						? Math.floor(Math.random() * received.slides.length)
						: 0;
				}
				const content = received ? rotatePlayback(received, startOffset) : null;
				loading = false;
				if (!playback?.slides.length || finished) {
					if (content?.version !== playback?.version) {
						index = 0;
						playback = content;
					} else if (finished && shown && content) shown.data = content.slides[index]?.data ?? {};
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
			const timing = slideTiming(
				slide.definition,
				slide.durationMs,
				current.loop || next !== index
			);
			shown = {
				definition: slide.definition,
				title: current.title,
				durationMs: slide.durationMs,
				totalMs: timing.totalMs,
				data: slide.data ?? {},
				version: current.version,
				next: current.loop || next !== index ? current.slides[next] : null
			};
			preparing = null;
			timeMs = 0;
			dataTimeMs = 0;
			mediaMissing = Object.keys(assetUrls).length !== ids.length;
			const start = performance.now();
			const tick = (now: number) => {
				timeMs = Math.min(timing.totalMs, now - start);
				dataTimeMs = now - start;
				frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
			timer = setTimeout(async () => {
				if (!allElements(slide.definition).some((element) => element.repeater))
					cancelAnimationFrame(frame);
				timeMs = timing.totalMs;
				// Revalidate published content before every new slide, including single-slide loops.
				await refresh?.();
				if (disposed) return;
				let updated = current;
				if (queued !== undefined) {
					const content = queued;
					queued = undefined;
					if (content?.version !== current.version) {
						index = 0;
						playback = content;
						return;
					}
					if (content) updated = content;
				}
				const next = nextSlide(updated, index);
				if (next === index && !updated.loop) {
					finished = true;
					if (shown) shown.data = updated.slides[index]?.data ?? {};
				} else {
					index = next;
					playback = { ...updated };
				}
			}, timing.totalMs);
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
		const slides = upcoming;
		nextPreviews = {};
		previewLoading = !!slides.length;
		if (!slides.length || preparing) return;
		const ids = [...new Set(slides.flatMap((slide) => mediaIds(slide.definition)))];
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10000);
		let disposed = false;
		void Promise.allSettled(ids.map((id) => cache.load(id, controller.signal))).then(() => {
			clearTimeout(timeout);
			if (disposed) return;
			previewLoading = false;
			const previews: typeof nextPreviews = {};
			for (const slide of slides) {
				const media = mediaIds(slide.definition),
					urls = cache.urls(media);
				if (Object.keys(urls).length === media.length) previews[slide.id] = { urls };
			}
			nextPreviews = previews;
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
				data={shown.data}
				{dataTimeMs}
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
					>{loading || preparing
						? 'Loading playlist…'
						: playback
							? 'No slides currently meet their visibility rules.'
							: 'No published playlist is assigned to this monitor.'}</P
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
			class={`flex shrink-0 items-center justify-between gap-4 border-t px-4 py-3 md:px-6 ${scheme === 'dark' ? 'border-white/15 bg-gray-950' : 'border-black/15 bg-gray-100'}`}
			role="region"
			aria-label="Playback information"
		>
			<Div
				class="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto"
				role="region"
				aria-label="Up next"
			>
				{#each upcoming as slide, position (position)}
					{@const preview = nextPreviews[slide.id]}
					<Div class="flex max-w-72 shrink-0 items-center gap-3">
						<Div
							class="aspect-video w-24 shrink-0 overflow-hidden rounded border border-current md:w-32"
							style={`background:${displayBackground(scheme)};`}
							aria-hidden="true"
						>
							{#if preview}
								<SlideCanvas
									definition={slide.definition}
									data={slide.data ?? {}}
									{scheme}
									assetUrls={preview.urls}
									timeMs={Math.min(2000, slide.durationMs / 2)}
									viewportWidth={displayWidth || slide.definition.width}
									viewportHeight={displayHeight || slide.definition.height}
									assetBase="/monitors/media"
									label={`Upcoming slide preview ${position + 1}`}
								/>
							{:else}<Div class="flex h-full items-center justify-center text-xs opacity-60"
									>{previewLoading ? 'Preview loading…' : 'Preview unavailable'}</Div
								>{/if}
						</Div>
						<Div class="min-w-0"
							><P class="text-xs tracking-wide uppercase opacity-60"
								>{position === 0 ? 'Up next' : `Then ${position + 1}`}</P
							><P class="truncate text-base font-semibold md:text-xl" title={slide.title}
								>{slide.title || 'Next slide'}</P
							></Div
						>
					</Div>
				{:else}<P>End of playlist</P>{/each}
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
