import type { Playback } from './types';

export function nextSlide(playback: Playback, index: number) {
	return index + 1 < playback.slides.length ? index + 1 : playback.loop ? 0 : index;
}
export function watchPlayback(
	onContent: (content: Playback | null) => void,
	onConnection: (connected: boolean) => void
) {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout>;
	const poll = async () => {
		const request = new AbortController();
		const abort = () => request.abort();
		controller.signal.addEventListener('abort', abort, { once: true });
		const timeout = setTimeout(abort, 10000);
		try {
			const response = await fetch('/monitors/playback', {
				cache: 'no-store',
				signal: request.signal
			});
			if (!response.ok || !response.headers.get('content-type')?.includes('application/json'))
				throw new Error('Playback unavailable');
			const content: Playback | null = await response.json();
			if (controller.signal.aborted) return;
			onContent(content);
			onConnection(true);
		} catch {
			if (!controller.signal.aborted) onConnection(false);
		} finally {
			clearTimeout(timeout);
			controller.signal.removeEventListener('abort', abort);
			if (!controller.signal.aborted) timer = setTimeout(poll, 30000);
		}
	};
	void poll();
	return () => {
		controller.abort();
		clearTimeout(timer);
	};
}
