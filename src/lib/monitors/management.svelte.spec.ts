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
	it('sends both navigation directions and the assignment, disables only the submitting monitor, and requires a playlist', async () => {
		const monitors = ['Break room', 'Office', 'Unassigned'].map((location, index) => ({
			id: String(index + 1).repeat(24),
			location,
			approvedAt: null,
			lastSeenAt: null,
			playlistId: index < 2 ? 'a'.repeat(24) : '',
			colorMode: 'dark'
		}));
		const view = render(Management, {
			data: { monitors, playlists: [{ id: 'a'.repeat(24), title: 'Default' }] }
		} as never);
		const prev = view.getByRole('button', { name: 'Previous slide on Break room' });
		const next = view.getByRole('button', { name: 'Next slide on Break room' });
		const form = next.closest('form')!;
		expect(form).toHaveAttribute('action', '?/navigate');
		expect(new FormData(form).get('sessionId')).toBe(monitors[0].id);
		expect(new FormData(form).get('playlistId')).toBe(monitors[0].playlistId);
		expect(prev).toHaveAttribute('name', 'direction');
		expect(prev).toHaveAttribute('value', 'prev');
		expect(next).toHaveAttribute('value', 'next');
		expect(view.getByRole('button', { name: 'Next slide on Unassigned' })).toBeDisabled();
		const finish = await handlers.get(form)!({} as never);
		await tick();
		expect(prev).toBeDisabled();
		expect(next).toBeDisabled();
		expect(view.getByRole('button', { name: 'Next slide on Office' })).not.toBeDisabled();
		if (typeof finish !== 'function') throw new Error('Missing navigation completion handler');
		await finish({ update: vi.fn(async () => {}) } as never);
		await tick();
		expect(next).not.toBeDisabled();
	});
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
