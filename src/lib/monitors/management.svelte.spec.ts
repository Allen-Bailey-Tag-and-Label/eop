import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import Management from '../../routes/(private)/(padded)/admin/monitors/management/+page.svelte';

const handlers = vi.hoisted(() => new Map<HTMLFormElement, SubmitFunction>());
vi.mock('$app/forms', () => ({
	enhance: (form: HTMLFormElement, submit: SubmitFunction) => {
		handlers.set(form, submit);
		return { destroy: () => handlers.delete(form) };
	}
}));
afterEach(() => {
	cleanup();
	handlers.clear();
});

describe('remote monitor refresh controls', () => {
	it('posts the chosen monitor ID and disables only its refresh button while requesting', async () => {
		const monitors = ['Break room', 'Office'].map((location, index) => ({
			id: String(index + 1).repeat(24),
			location,
			approvedAt: null,
			lastSeenAt: null,
			playlistId: '',
			colorMode: 'dark'
		}));
		const view = render(Management, { data: { monitors, playlists: [] } } as never);
		const button = view.getByRole('button', { name: 'Hard refresh Break room' });
		const form = button.closest('form')!;
		expect(form).toHaveAttribute('action', '?/refresh');
		expect(new FormData(form).get('sessionId')).toBe(monitors[0].id);
		const finish = await handlers.get(form)!({} as never);
		await tick();
		expect(button).toBeDisabled();
		expect(view.getByRole('button', { name: 'Hard refresh Office' })).not.toBeDisabled();
		if (typeof finish !== 'function') throw new Error('Missing refresh completion handler');
		const update = vi.fn(async () => {});
		await finish({ update } as never);
		await tick();
		expect(update).toHaveBeenCalledOnce();
		expect(button).not.toBeDisabled();
	});
});
