import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import SlidePlayer from './SlidePlayer.svelte';
import { watchPlayback } from './playback';
import { blankSlide, newElement, type Playback } from './types';

vi.mock('./playback', async (original) => ({
	...(await original<typeof import('./playback')>()),
	watchPlayback: vi.fn()
}));
function content(version = 'one', loop = true): Playback {
	return {
		title: 'Break room',
		version,
		loop,
		slides: ['First', 'Second'].map((text, index) => ({
			id: String(index),
			durationMs: 1000,
			definition: {
				...blankSlide(),
				elements: [{ ...newElement('text', `text-${index}`), text: `${version} ${text}` }]
			}
		}))
	};
}
async function flush() {
	await tick();
	await Promise.resolve();
	await tick();
}
beforeEach(() => {
	vi.useFakeTimers();
	vi.clearAllMocks();
	vi.mocked(watchPlayback).mockReturnValue(vi.fn());
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
	vi.stubGlobal(
		'requestAnimationFrame',
		vi.fn(() => 1)
	);
	vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('monitor player', () => {
	it('advances locally and loops without a server request for each slide', async () => {
		const { getByText } = render(SlidePlayer, { location: 'Break room' });
		vi.mocked(watchPlayback).mock.calls[0][0](content());
		await flush();
		expect(getByText('one First')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(getByText('one Second')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(getByText('one First')).toBeInTheDocument();
		expect(watchPlayback).toHaveBeenCalledTimes(1);
	});
	it('applies new published content and assignment removal only between slides', async () => {
		const { getByText, queryByText } = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive(content());
		await flush();
		receive(content('two'));
		await flush();
		expect(queryByText('two First')).not.toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(getByText('two First')).toBeInTheDocument();
		receive(null);
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(getByText('No published playlist is assigned to this monitor.')).toBeInTheDocument();
	});
	it('holds the last slide with looping off and accepts later publishing updates', async () => {
		const { getByText } = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive(content('one', false));
		await flush();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		await vi.advanceTimersByTimeAsync(5000);
		await flush();
		expect(getByText('one Second')).toBeInTheDocument();
		receive(content('two'));
		await flush();
		expect(getByText('two First')).toBeInTheDocument();
	});
	it('keeps loaded content visible while disconnected and stops polling on unmount', async () => {
		const stop = vi.fn();
		vi.mocked(watchPlayback).mockReturnValue(stop);
		const { getByText, unmount } = render(SlidePlayer, { location: 'Break room' });
		const [receive, connection] = vi.mocked(watchPlayback).mock.calls[0];
		receive(content());
		await flush();
		connection(false);
		await tick();
		expect(getByText('one First')).toBeInTheDocument();
		expect(getByText(/Connection lost/)).toBeInTheDocument();
		unmount();
		expect(stop).toHaveBeenCalledOnce();
	});
});
