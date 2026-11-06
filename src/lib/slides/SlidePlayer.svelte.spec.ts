import { defaultRepeater } from './repeater';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import SlidePlayer from './SlidePlayer.svelte';
import { watchPlayback } from './playback';
import { SlideMediaCache } from './media';
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
		upcomingCount: 1,
		transition: { type: 'none', durationMs: 0 },
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
	vi.stubGlobal(
		'matchMedia',
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		}))
	);
	vi.mocked(watchPlayback).mockReturnValue({ refresh: vi.fn(async () => {}), stop: vi.fn() });
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
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('monitor player', () => {
	it('steps immediately in both directions, wraps loops, and restarts the countdown', async () => {
		const playlistId = 'a'.repeat(24);
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive({ ...content(), playlistId });
		vi.mocked(watchPlayback).mock.results[0].value.refresh.mockImplementation(async () =>
			receive({ ...content(), playlistId })
		);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		const command = { id: '1'.repeat(32), playlistId, direction: 'prev' as const };
		await vi.advanceTimersByTimeAsync(400);
		expect(await view.component.navigate(command)).toBe(true);
		await flush();
		expect(current.getByText('one Second')).toBeInTheDocument();
		expect(view.getByRole('timer')).toHaveTextContent('0:01');
		await view.component.navigate({ ...command, direction: 'next' });
		await flush();
		expect(current.getByText('one First')).toBeInTheDocument();
		await view.component.navigate({ ...command, direction: 'next' });
		await flush();
		expect(current.getByText('one Second')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(999);
		expect(current.getByText('one Second')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1);
		await flush();
		expect(current.getByText('one First')).toBeInTheDocument();
	});
	it('clamps non-looping boundaries without restarting the slide and resumes from a held final slide', async () => {
		const playlistId = 'a'.repeat(24);
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive({ ...content('one', false), playlistId });
		vi.mocked(watchPlayback).mock.results[0].value.refresh.mockImplementation(async () =>
			receive({ ...content('one', false), playlistId })
		);
		await flush();
		const command = { id: '1'.repeat(32), playlistId, direction: 'prev' as const };
		await vi.advanceTimersByTimeAsync(900);
		await view.component.navigate(command);
		await vi.advanceTimersByTimeAsync(100);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(current.getByText('one Second')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await view.component.navigate({ ...command, direction: 'next' });
		expect(view.getByRole('timer')).toHaveTextContent('0:00');
		await view.component.navigate(command);
		await flush();
		expect(current.getByText('one First')).toBeInTheDocument();
		expect(view.getByRole('timer')).toHaveTextContent('0:01');
	});
	it('uses freshly published content and does not apply old commands to a newly assigned playlist', async () => {
		const playlistId = 'a'.repeat(24);
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive({ ...content(), playlistId });
		await flush();
		const refresh = vi.mocked(watchPlayback).mock.results[0].value.refresh;
		refresh.mockImplementation(async () => receive({ ...content('two'), playlistId }));
		const command = { id: '1'.repeat(32), playlistId, direction: 'next' as const };
		await view.component.navigate(command);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(current.getByText('two Second')).toBeInTheDocument();
		refresh.mockImplementation(async () =>
			receive({ ...content('three'), playlistId: 'b'.repeat(24) })
		);
		await view.component.navigate(command);
		await flush();
		expect(current.getByText('three First')).toBeInTheDocument();
		expect(current.queryByText('three Second')).not.toBeInTheDocument();
	});
	it('gives ordered manual steps priority over an automatic boundary during a slow refresh', async () => {
		const playlistId = 'a'.repeat(24);
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive({ ...content(), playlistId });
		await flush();
		let release!: () => void;
		const refresh = vi.mocked(watchPlayback).mock.results[0].value.refresh;
		refresh.mockImplementation(async () => receive({ ...content(), playlistId }));
		refresh.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					release = () => {
						receive({ ...content(), playlistId });
						resolve();
					};
				})
		);
		await vi.advanceTimersByTimeAsync(900);
		const command = { id: '1'.repeat(32), playlistId, direction: 'next' as const };
		const step = view.component.navigate(command);
		await flush();
		await vi.advanceTimersByTimeAsync(100);
		release();
		await step;
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(current.getByText('one Second')).toBeInTheDocument();
		await Promise.all([
			view.component.navigate({ ...command, direction: 'prev' }),
			view.component.navigate(command)
		]);
		await flush();
		expect(current.getByText('one Second')).toBeInTheDocument();
	});
	it('keeps commands pending when published content cannot be loaded, then applies them after recovery', async () => {
		const playlistId = 'a'.repeat(24);
		const view = render(SlidePlayer, { location: 'Break room' });
		const command = { id: '1'.repeat(32), playlistId, direction: 'next' as const };
		expect(await view.component.navigate(command)).toBe(false);
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive({ ...content(), playlistId });
		await flush();
		expect(await view.component.navigate(command)).toBe(false);
		vi.mocked(watchPlayback).mock.results[0].value.refresh.mockImplementation(async () =>
			receive({ ...content(), playlistId })
		);
		expect(await view.component.navigate(command)).toBe(true);
		await flush();
		expect(
			within(view.getByRole('region', { name: 'Current slide' })).getByText('one Second')
		).toBeInTheDocument();
	});
	it('holds the outgoing slide while media is unavailable and crossfades only after the next slide is ready', async () => {
		let ready = false;
		const image = 'a'.repeat(24);
		vi.spyOn(SlideMediaCache.prototype, 'load').mockImplementation(async () => {
			if (!ready) throw new Error('offline');
		});
		vi.spyOn(SlideMediaCache.prototype, 'urls').mockImplementation((ids) =>
			ready ? Object.fromEntries(ids.map((id) => [id, 'blob:ready'])) : {}
		);
		const playlist = content();
		playlist.slides[0].definition.background = '#ffffff';
		playlist.slides[1].definition.background = '#000000';
		playlist.slides[1].transition = { type: 'crossfade', durationMs: 2000 };
		playlist.slides[1].definition.elements.push({
			...newElement('image', 'image'),
			assetId: image
		});
		const view = render(SlidePlayer, { location: 'Break room' });
		vi.mocked(watchPlayback).mock.calls[0][0](playlist);
		await flush();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(current.getByText('one First')).toBeInTheDocument();
		expect(current.queryByText('one Second')).not.toBeInTheDocument();
		ready = true;
		await vi.advanceTimersByTimeAsync(2000);
		await flush();
		expect(view.container.querySelector('[data-playback-layer="outgoing"]')).toBeInTheDocument();
		expect(current.getByText('one Second')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await flush();
		expect(view.container.querySelector('[data-playback-layer="incoming"]')).toHaveStyle({
			opacity: '0.5'
		});
		expect(
			view.container.querySelector('[data-playback-layer="outgoing"] [role="img"]')
		).toHaveStyle({ background: '#ffffff' });
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(
			view.container.querySelector('[data-playback-layer="outgoing"]')
		).not.toBeInTheDocument();
		expect(view.container.querySelector('[data-playback-layer="incoming"]')).toHaveStyle({
			opacity: '1'
		});
	});
	it('recovers from an empty eligible playlist and previews multiple slides in playback order', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		receive({ ...content('empty'), slides: [] });
		await flush();
		expect(view.getByText('No slides currently meet their visibility rules.')).toBeInTheDocument();
		const playlist = content('eligible');
		playlist.upcomingCount = 3;
		playlist.slides = Array.from({ length: 5 }, (_, index) => ({
			...structuredClone(playlist.slides[0]),
			id: String(index),
			title: `Slide ${index + 1}`
		}));
		receive(playlist);
		await flush();
		const upcoming = within(view.getByRole('region', { name: 'Up next' }));
		expect(upcoming.getByText('Slide 2')).toBeInTheDocument();
		expect(upcoming.getByText('Slide 3')).toBeInTheDocument();
		expect(upcoming.getByText('Slide 4')).toBeInTheDocument();
		expect(upcoming.queryByText('Slide 5')).toBeNull();
		expect(upcoming.getAllByLabelText(/Upcoming slide preview/)).toHaveLength(3);
		// A short looping playlist still fills the requested future slots.
		receive({ ...content('short'), upcomingCount: 3 });
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		const shortQueue = within(view.getByRole('region', { name: 'Up next' }));
		expect(shortQueue.getAllByLabelText(/Upcoming slide preview/)).toHaveLength(3);
		expect(shortQueue.getAllByText('Second slide')).toHaveLength(2);
	});
	it('chooses a random start once per publication and plays every non-looping entry in rotated order', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.75);
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		const playlist = content('one', false);
		playlist.randomStart = true;
		receive(playlist);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(current.getByText('one Second')).toBeInTheDocument();
		vi.mocked(Math.random).mockReturnValue(0);
		receive(structuredClone(playlist));
		await flush();
		expect(current.getByText('one Second')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(current.getByText('one First')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(current.getByText('one First')).toBeInTheDocument();
		expect(view.getByText('End of playlist')).toBeInTheDocument();
	});
	it('shows loading rather than an unassigned playlist while assigned slide media is pending', async () => {
		let complete!: () => void;
		let ready = false;
		vi.spyOn(SlideMediaCache.prototype, 'urls').mockImplementation((ids) =>
			ready ? Object.fromEntries(ids.map((id) => [id, 'blob:ready'])) : {}
		);
		vi.spyOn(SlideMediaCache.prototype, 'load').mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					complete = resolve;
				})
		);
		const view = render(SlidePlayer, { location: 'Break room' });
		const playlist = content();
		playlist.slides[0].definition.elements.push({
			...newElement('image', 'image'),
			assetId: 'a'.repeat(24)
		});
		vi.mocked(watchPlayback).mock.calls[0][0](playlist);
		await flush();
		expect(view.getByText(/Loading playlist/)).toBeInTheDocument();
		expect(
			view.queryByText('No published playlist is assigned to this monitor.')
		).not.toBeInTheDocument();
		ready = true;
		complete();
		await flush();
		expect(
			within(view.getByRole('region', { name: 'Current slide' })).getByText('one First')
		).toBeInTheDocument();
	});
	it('continues repeater pages after a non-looping final slide is held', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		const playlist = content('grid', false);
		playlist.slides = playlist.slides.slice(0, 1);
		playlist.slides[0].definition = {
			...playlist.slides[0].definition,
			width: 1000,
			height: 400,
			elements: [
				{
					...newElement('list', 'grid'),
					x: 0,
					y: 0,
					width: 1000,
					height: 400,
					repeater: defaultRepeater()
				}
			]
		};
		playlist.slides[0].data = {
			grid: {
				state: 'ready',
				items: Array.from({ length: 5 }, (_, index) => ({
					id: String(index),
					label: `Row ${index + 1}`,
					detail: ''
				})),
				message: ''
			}
		};
		vi.mocked(watchPlayback).mock.calls[0][0](playlist);
		await flush();
		expect(view.getByText('Row 1')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now() + 4500);
		await flush();
		expect(view.getByText('Row 5')).toBeInTheDocument();
		expect(view.queryByText('Row 1')).not.toBeInTheDocument();
		expect(view.getByLabelText('Current slide time remaining')).toHaveTextContent('0:00');
	});
	it('refreshes live data without restarting playlist order and updates a held final slide', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		const playlist = content('one', false);
		for (const slide of playlist.slides) {
			slide.definition.elements = [newElement('list', 'calendar')];
			slide.data = {
				calendar: {
					state: 'ready',
					items: [{ id: 'holiday', label: `Old ${slide.id}`, detail: 'Nov 26, 2026' }],
					message: ''
				}
			};
		}
		receive(playlist);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(current.getByText('Old 0')).toBeInTheDocument();
		const fresh = structuredClone(playlist);
		fresh.slides[1].data!.calendar.items[0].label = 'Updated holiday';
		receive(fresh);
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(current.getByText('Updated holiday')).toBeInTheDocument();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		const latest = structuredClone(fresh);
		latest.slides[1].data!.calendar.items[0].label = 'Latest holiday';
		receive(latest);
		await flush();
		expect(current.getByText('Latest holiday')).toBeInTheDocument();
		expect(view.getByRole('timer')).toHaveTextContent('0:00');
	});
	it('uses the monitor mode and follows system changes only when System is selected', async () => {
		let systemDark = false;
		let change!: () => void;
		const removeEventListener = vi.fn();
		vi.spyOn(window, 'matchMedia').mockReturnValue({
			get matches() {
				return systemDark;
			},
			addEventListener: (_type: string, listener: () => void) => (change = listener),
			removeEventListener
		} as unknown as MediaQueryList);
		const view = render(SlidePlayer, { location: 'Break room' });
		const [receive, , mode] = vi.mocked(watchPlayback).mock.calls[0];
		receive(content());
		mode?.('system');
		await flush();
		const screen = view.container.querySelector('[data-color-mode]')!;
		expect(screen).toHaveAttribute('data-color-mode', 'light');
		expect(screen).toHaveStyle({ background: '#ffffff' });
		systemDark = true;
		change();
		await tick();
		expect(screen).toHaveAttribute('data-color-mode', 'dark');
		mode?.('light');
		await tick();
		expect(screen).toHaveAttribute('data-color-mode', 'light');
		change();
		await tick();
		expect(screen).toHaveAttribute('data-color-mode', 'light');
		view.unmount();
		expect(removeEventListener).toHaveBeenCalledWith('change', change);
	});
	it('overlaps complete slides during playlist crossfades and counts down to the next start', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		const playlist = content();
		playlist.slides[0].durationMs = 10000;
		playlist.transition = { type: 'crossfade', durationMs: 2000 };
		const incomingText = playlist.slides[1].definition.elements[0];
		incomingText.keyframes = [
			{ ...incomingText, opacity: 0, atMs: 0, easing: 'linear' },
			{ ...incomingText, opacity: 1, atMs: 1000, easing: 'linear' }
		];
		vi.mocked(watchPlayback).mock.calls[0][0](playlist);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(view.container.querySelector('[data-playback-layer="incoming"]')!).toHaveStyle({
			opacity: '0'
		});
		expect(view.getByRole('timer')).toHaveTextContent('0:12');
		await vi.advanceTimersByTimeAsync(1000);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await tick();
		expect(view.container.querySelector('[data-playback-layer="incoming"]')!).toHaveStyle({
			opacity: '0.5'
		});
		await vi.advanceTimersByTimeAsync(9000);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await tick();
		expect(view.container.querySelector('[data-playback-layer="incoming"]')!).toHaveStyle({
			opacity: '1'
		});
		expect(view.getByRole('timer')).toHaveTextContent('0:02');
		await vi.advanceTimersByTimeAsync(2000);
		await flush();
		expect(current.getByText('one Second')).toBeInTheDocument();
		expect(view.container.querySelector('[data-playback-layer="incoming"]')!).toHaveStyle({
			opacity: '0'
		});
		expect(view.getByRole('timer')).toHaveTextContent('0:03');
		await vi.advanceTimersByTimeAsync(1000);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await flush();
		expect(current.getByText('one Second').parentElement).toHaveStyle({ opacity: '0' });
		expect(view.container.querySelector('[data-playback-layer="incoming"]')).toHaveStyle({
			opacity: '0.5'
		});
		await vi.advanceTimersByTimeAsync(1500);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await flush();
		expect(current.getByText('one Second').parentElement).toHaveStyle({ opacity: '0.5' });
	});
	it('animates published keyframes on display frames and restarts them for a single-slide loop', async () => {
		vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1920);
		vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(1080);
		const playlist = content();
		playlist.slides = playlist.slides.slice(0, 1);
		const element = playlist.slides[0].definition.elements[0];
		element.keyframes = [
			{ ...element, x: 0, opacity: 0, scale: 0.5, atMs: 0, easing: 'linear' },
			{ ...element, x: 320, opacity: 1, scale: 1, atMs: 800, easing: 'linear' }
		];
		const view = render(SlidePlayer, { location: 'Break room' });
		vi.mocked(watchPlayback).mock.calls[0][0](playlist);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		const box = () => current.getByText('one First').parentElement!;
		expect(box()).toHaveStyle({ opacity: '0' });
		await vi.advanceTimersByTimeAsync(400);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await tick();
		expect(box()).toHaveStyle({ opacity: '0.5' });
		expect(box().style.transform).toContain('translate(160px,160px)');
		expect(box().style.transform).toContain('scale(0.75)');
		await vi.advanceTimersByTimeAsync(400);
		vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0](performance.now());
		await tick();
		expect(box()).toHaveStyle({ opacity: '1' });
		await vi.advanceTimersByTimeAsync(200);
		await flush();
		expect(box()).toHaveStyle({ opacity: '0' });
	});
	it('refreshes published content before each slide, including playlist loops', async () => {
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
		expect(vi.mocked(watchPlayback).mock.results[0].value.refresh).toHaveBeenCalledTimes(2);
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
	it('waits for a fresh server response before rendering the next published slide', async () => {
		let complete!: () => void;
		const refresh = vi.fn(() => new Promise<void>((resolve) => (complete = resolve)));
		vi.mocked(watchPlayback).mockReturnValue({ refresh, stop: vi.fn() });
		const view = render(SlidePlayer, { location: 'Break room' });
		const receive = vi.mocked(watchPlayback).mock.calls[0][0];
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		receive(content());
		await flush();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(refresh).toHaveBeenCalledOnce();
		expect(current.getByText('one First')).toBeInTheDocument();
		expect(current.queryByText('one Second')).not.toBeInTheDocument();
		receive(content('newly-published'));
		complete();
		await flush();
		expect(current.getByText('newly-published First')).toBeInTheDocument();
	});
	it('continues the loaded playlist when the boundary refresh cannot retrieve new content', async () => {
		const view = render(SlidePlayer, { location: 'Break room' });
		const [receive, connection] = vi.mocked(watchPlayback).mock.calls[0];
		receive(content());
		await flush();
		vi.mocked(vi.mocked(watchPlayback).mock.results[0].value.refresh).mockImplementation(
			async () => {
				connection(false);
			}
		);
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		const current = within(view.getByRole('region', { name: 'Current slide' }));
		expect(current.getByText('one Second')).toBeInTheDocument();
		expect(current.getByText(/Connection lost/)).toBeInTheDocument();
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
		vi.mocked(watchPlayback).mockReturnValue({ refresh: vi.fn(async () => {}), stop });
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
		const playlist = content('one', false);
		vi.mocked(watchPlayback).mock.calls[0][0](playlist);
		await flush();
		await vi.advanceTimersByTimeAsync(1000);
		await flush();
		expect(
			within(view.getByRole('region', { name: 'Up next' })).getByText('End of playlist')
		).toBeInTheDocument();
		expect(view.getByRole('timer')).toHaveTextContent('0:01');
		await vi.advanceTimersByTimeAsync(3000);
		await flush();
		expect(view.getByRole('timer')).toHaveTextContent('0:00');
		expect(view.container.querySelector('[data-playback-layer="incoming"]')!).toHaveStyle({
			opacity: '1'
		});
	});
});
