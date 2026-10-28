import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, within } from '@testing-library/svelte';
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
			title: `${text} slide`,
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
		const view = render(SlidePlayer, { location: 'Break room' });
		const { getByText } = within(view.getByRole('region', { name: 'Current slide' }));
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
		const view = render(SlidePlayer, { location: 'Break room' });
		const { getByText, queryByText } = within(view.getByRole('region', { name: 'Current slide' }));
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
		const view = render(SlidePlayer, { location: 'Break room' });
		const { getByText } = within(view.getByRole('region', { name: 'Current slide' }));
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
		const view = render(SlidePlayer, { location: 'Break room' });
		const { getByText } = within(view.getByRole('region', { name: 'Current slide' }));
		const [receive, connection] = vi.mocked(watchPlayback).mock.calls[0];
		receive(content());
		await flush();
		connection(false);
		await tick();
		expect(getByText('one First')).toBeInTheDocument();
		expect(getByText(/Connection lost/)).toBeInTheDocument();
		view.unmount();
		expect(stop).toHaveBeenCalledOnce();
	});
	it('shows the upcoming slide and counts down the actual playlist duration before resetting', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		const playlist = content();
		playlist.slides[0].durationMs = 6500;
		vi.mocked(watchPlayback).mock.calls[0][0](playlist);
		await flush();
		const next = within(view.getByRole('region', { name: 'Up next' }));
		expect(next.getByText('Second slide')).toBeInTheDocument();
		expect(next.getByText('one Second')).toBeInTheDocument();
		expect(view.getByRole('timer')).toHaveTextContent('0:07');
		await vi.advanceTimersByTimeAsync(1500);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await tick();
		expect(view.getByRole('timer')).toHaveTextContent('0:05');
		await vi.advanceTimersByTimeAsync(5000);
		await flush();
		expect(next.getByText('First slide')).toBeInTheDocument();
		expect(view.getByRole('timer')).toHaveTextContent('0:01');
	});
	it('previews queued publication updates without restarting the current countdown', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive(content());
		await flush();
		const update = content('two');
		update.slides[0].title = 'Updated first slide';
		receive(update);
		await flush();
		expect(
			within(view.getByRole('region', { name: 'Up next' })).getByText('Updated first slide')
		).toBeInTheDocument();
		expect(
			within(view.getByRole('region', { name: 'Current slide' })).getByText('one First')
		).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(
			within(view.getByRole('region', { name: 'Current slide' })).getByText('two First')
		).toBeInTheDocument();
	});
	it('shows the end of a non-looping playlist instead of a false next slide', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		vi.mocked(watchPlayback).mock.calls[0][0](content('one', false));
		await flush();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(
			within(view.getByRole('region', { name: 'Up next' })).getByText('End of playlist')
		).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(view.getByRole('timer')).toHaveTextContent('0:00');
	});
});
