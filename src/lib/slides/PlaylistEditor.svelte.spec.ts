import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import PlaylistEditor from './PlaylistEditor.svelte';

vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
afterEach(cleanup);

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
		const definition = JSON.parse(
			(container.querySelector('input[name="definition"]') as HTMLInputElement).value
		);
		expect(definition.items).toEqual([
			{ slideId: id, durationMs: 4000 },
			{ slideId: id, durationMs: 2000 }
		]);
		expect(definition.loop).toBe(true);
	});
});
