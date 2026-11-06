import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import PlaylistEditor from './PlaylistEditor.svelte';

vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('svelte/transition', async (importOriginal) => ({
	...(await importOriginal<typeof import('svelte/transition')>()),
	scale: () => ({ duration: 0 })
}));
beforeEach(() => {
	vi.stubGlobal(
		'DragEvent',
		class extends MouseEvent {
			dataTransfer: DataTransfer | null;
			constructor(type: string, init: DragEventInit = {}) {
				super(type, init);
				this.dataTransfer = init.dataTransfer ?? null;
			}
		}
	);
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
	);
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('playlist authoring', () => {
	it('dismisses removal confirmations without changing the playlist and confirms only the selected entry', async () => {
		const id = 'a'.repeat(24);
		const entries = [
			{ slideId: id, durationMs: 2000 },
			{ slideId: id, durationMs: 4000 }
		];
		const view = render(PlaylistEditor, {
			data: {
				playlist: {
					id: '',
					title: '',
					slug: '',
					version: 0,
					publishedAt: null,
					draft: { loop: true, items: entries }
				},
				slides: [{ id, title: 'Welcome', publishedAt: null }]
			}
		});
		const items = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			).items;
		for (const action of ['cancel', 'escape', 'close', 'outside']) {
			const trigger = view.getByRole('button', { name: 'Remove slide 2' });
			await fireEvent.click(trigger);
			const dialog = view.getByRole('alertdialog', { name: 'Remove slide from playlist?' });
			expect(items()).toEqual(entries);
			expect(view.getByRole('button', { name: 'Cancel' })).toHaveFocus();
			if (action === 'cancel') await fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
			if (action === 'escape') await fireEvent.keyDown(dialog, { key: 'Escape' });
			if (action === 'close')
				await fireEvent.click(view.getByRole('button', { name: 'Close dialog' }));
			if (action === 'outside') await fireEvent.click(dialog.parentElement!.parentElement!);
			expect(view.queryByRole('alertdialog')).toBeNull();
			expect(items()).toEqual(entries);
			expect(trigger).toHaveFocus();
		}
		await fireEvent.click(view.getByRole('button', { name: 'Remove slide 2' }));
		await fireEvent.click(view.getByRole('button', { name: 'Remove slide' }));
		expect(items()).toEqual([entries[0]]);
		expect(view.getByRole('button', { name: 'Add slide' })).toHaveFocus();
		await fireEvent.click(view.getByRole('button', { name: 'Add slide' }));
		expect(items()).toEqual([entries[0], { slideId: id, durationMs: null }]);
	});
	it('drags duplicate slide entries in both directions with their settings and ignores cancelled or external drops', async () => {
		const id = 'a'.repeat(24);
		const entries = [
			{
				slideId: id,
				durationMs: 2000,
				transition: { type: 'crossfade' as const, durationMs: 1500 }
			},
			{ slideId: id, durationMs: 4000 },
			{ slideId: id, durationMs: 6000, transition: { type: 'none' as const, durationMs: 0 } }
		];
		const view = render(PlaylistEditor, {
			data: {
				playlist: {
					id: '',
					title: '',
					slug: '',
					version: 0,
					publishedAt: null,
					draft: { loop: true, items: entries }
				},
				slides: [{ id, title: 'Welcome', publishedAt: null }]
			}
		});
		const items = () =>
			JSON.parse(
				(view.container.querySelector('input[name="definition"]') as HTMLInputElement).value
			).items;
		const row = (index: number) => view.getByRole('group', { name: 'Playlist slide ' + index });
		vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
			top: 0,
			height: 100
		} as DOMRect);
		const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };
		await fireEvent.dragStart(view.getByRole('button', { name: 'Reorder slide 1' }), {
			dataTransfer
		});
		await fireEvent.dragOver(row(3), { dataTransfer, clientY: 75 });
		expect(dataTransfer.dropEffect).toBe('move');
		await fireEvent.drop(row(3), { dataTransfer, clientY: 75 });
		expect(items()).toEqual([entries[1], entries[2], entries[0]]);
		await fireEvent.dragStart(row(3), { dataTransfer });
		await fireEvent.dragOver(row(1), { dataTransfer, clientY: 25 });
		await fireEvent.drop(row(1), { dataTransfer, clientY: 25 });
		expect(items()).toEqual(entries);
		await fireEvent.dragStart(row(1), { dataTransfer });
		await fireEvent.dragEnd(row(1));
		await fireEvent.drop(row(3), { dataTransfer, clientY: 75 });
		expect(items()).toEqual(entries);
		await fireEvent.drop(row(3), { dataTransfer, clientY: 75 });
		expect(items()).toEqual(entries);
		await fireEvent.click(view.getByRole('button', { name: 'Remove slide 2' }));
		expect(items()).toEqual(entries);
		await fireEvent.click(view.getByRole('button', { name: 'Remove slide' }));
		expect(items()).toEqual([entries[0], entries[2]]);
	});
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
		await fireEvent.keyDown(getByRole('button', { name: 'Reorder slide 2' }), {
			key: 'ArrowUp',
			altKey: true
		});
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
