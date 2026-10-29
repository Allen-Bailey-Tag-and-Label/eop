import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import PlaylistEditor from './PlaylistEditor.svelte';

vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('svelte/transition', async (importOriginal) => ({
	...(await importOriginal<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));
beforeEach(() =>
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	)
);
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe('playlist authoring', () => {
	it('reorders repeated slide references while keeping each duration override', async () => {
		const id = 'a'.repeat(24);
		const { container, getByRole } = render(PlaylistEditor, {
			data: {
				playlist: {
					id: '',
					title: '',
					slug: '',
					version: 0,
					publishedAt: null,
					draft: {
						loop: true,
						items: [
							{ slideId: id, durationMs: 2000 },
							{ slideId: id, durationMs: 4000 }
						]
					}
				},
				slides: [{ id, title: 'Welcome', publishedAt: '2026-10-28T00:00:00Z' }]
			}
		});
		await fireEvent.click(getByRole('button', { name: 'Move slide 2 up' }));
		await fireEvent.input(getByRole('spinbutton', { name: 'Playlist transition duration (ms)' }), {
			target: { value: '3500' }
		});
		await fireEvent.change(getByRole('combobox', { name: 'Transition into slide 1' }), {
			target: { value: 'none' }
		});
		await fireEvent.click(getByRole('checkbox', { name: 'Random starting slide' }));
		await fireEvent.input(getByRole('spinbutton', { name: 'Upcoming slide previews' }), {
			target: { value: '5' }
		});
		const definition = JSON.parse(
			(container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(definition.items).toEqual([
			{ slideId: id, durationMs: 4000, transition: { type: 'none', durationMs: 2000 } },
			{ slideId: id, durationMs: 2000 }
		]);
		expect(definition.loop).toBe(true);
		expect(definition.transition).toEqual({ type: 'crossfade', durationMs: 3500 });
		expect(definition.randomStart).toBe(true);
		expect(definition.upcomingCount).toBe(5);
	});
});
