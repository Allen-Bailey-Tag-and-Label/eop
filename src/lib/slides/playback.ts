import type { DisplayMode, Playback } from './types';

export function rotatePlayback(playback: Playback, offset: number): Playback {
	const start = playback.slides.length
		? Math.max(0, Math.min(playback.slides.length - 1, Math.floor(offset)))
		: 0;
	return {
		...playback,
		slides: [...playback.slides.slice(start), ...playback.slides.slice(0, start)]
	};
}
export function upcomingSlides(
	playback: Playback,
	index: number,
	count = playback.upcomingCount ?? 3,
	includeCurrent = false
) {
	const slides = [];
	const requested = Math.max(1, Math.min(5, Math.floor(count) || 3));
	// Looping queues can preview the next cycle, including repeated entries.
	const available = playback.loop
		? requested
		: playback.slides.length - index - (includeCurrent ? 0 : 1);
	for (let step = includeCurrent ? 0 : 1; slides.length < Math.min(requested, available); step++) {
		const next = index + step;
		if (!playback.loop && next >= playback.slides.length) break;
		if (!playback.slides.length) break;
		slides.push(playback.slides[next % playback.slides.length]);
	}
	return slides;
}

export function nextSlide(playback: Playback, index: number) {
	return index + 1 < playback.slides.length ? index + 1 : playback.loop ? 0 : index;
}
export function watchPlayback(
	onContent: (content: Playback | null) => void,
	onConnection: (connected: boolean) => void,
	onColorMode?: (mode: DisplayMode) => void
) {
	let stopped = false;
	let active: AbortController | undefined;
	let timer: ReturnType<typeof setTimeout>;
	const refresh = async () => {
		if (stopped) return;
		clearTimeout(timer);
		active?.abort();
		const request = new AbortController();
		active = request;
		const timeout = setTimeout(() => request.abort(), 10000);
		try {
			const response = await fetch('/monitors/playback', {
				cache: 'no-store',
				signal: request.signal
			});
			if (!response.ok || !response.headers.get('content-type')?.includes('application/json'))
				throw new Error('Playback unavailable');
			const content: Playback | null = await response.json();
			if (stopped || active !== request) return;
			const mode = response.headers.get('x-monitor-color-mode');
			if (mode === 'light' || mode === 'dark' || mode === 'system') onColorMode?.(mode);
			onContent(content);
			onConnection(true);
		} catch {
			if (!stopped && active === request) onConnection(false);
		} finally {
			clearTimeout(timeout);
			if (!stopped && active === request) {
				active = undefined;
				timer = setTimeout(refresh, 30000);
			}
		}
	};
	void refresh();
	return {
		refresh,
		stop: () => {
			stopped = true;
			active?.abort();
			clearTimeout(timer);
		}
	};
}
