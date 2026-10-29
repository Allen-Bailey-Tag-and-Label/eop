import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import PlaylistList from '../../routes/(private)/(padded)/admin/monitors/playlists/+page.svelte';

vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
beforeEach(() => {
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
});
const playlists = [
	{ id: 'a'.repeat(24), title: 'Welcome', slug: 'welcome', version: 2, publishedAt: null },
	{
		id: 'b'.repeat(24),
		title: 'Holidays',
		slug: 'holidays',
		version: 3,
		publishedAt: '2026-10-29T12:00:00Z'
	}
];
const data = { playlists } as ComponentProps<typeof PlaylistList>['data'];
describe('playlist list actions', () => {
	it('uses sortable Datatable columns with readable titles and separate per-playlist actions', async () => {
		const view = render(PlaylistList, { data, form: null, params: {} });
		expect(view.getByRole('link', { name: 'Edit Welcome' })).toHaveAttribute(
			'href',
			'/admin/monitors/playlists/welcome'
		);
		expect(view.getByRole('link', { name: 'Edit Welcome' })).toHaveClass('text-white');
		expect(view.getByText('Welcome').closest('a')).toBeNull();
		expect(view.getByText('Draft only')).toBeInTheDocument();
		const duplicate = view.getByRole('button', { name: 'Duplicate Welcome' });
		expect(duplicate.closest('form')).toHaveAttribute('action', '?/duplicate');
		expect(duplicate.closest('form')?.querySelector('input[name="id"]')).toHaveValue(
			playlists[0].id
		);
		await fireEvent.click(view.getByRole('button', { name: 'Playlist' }));
		expect(view.getByRole('link', { name: 'Edit Holidays' })).toHaveAttribute(
			'href',
			'/admin/monitors/playlists/holidays'
		);
		await fireEvent.click(view.getByRole('button', { name: 'Delete Welcome' }));
		expect(view.getByRole('dialog', { name: 'Delete playlist?' })).toHaveTextContent('Welcome');
		const confirmation = view.getByRole('button', { name: 'Delete playlist' }).closest('form');
		expect(confirmation).toHaveAttribute('action', '?/delete');
		expect(confirmation?.querySelector('input[name="version"]')).toHaveValue('2');
		expect(confirmation?.querySelector('input[name="confirm"]')).toHaveValue('delete');
		await fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
		expect(view.queryByRole('dialog')).toBeNull();
	});
	it('preserves the create link and helpful empty state', () => {
		const view = render(PlaylistList, { data: { ...data, playlists: [] }, form: null, params: {} });
		expect(view.getByRole('link', { name: 'Create playlist' })).toHaveAttribute(
			'href',
			'/admin/monitors/playlists/new'
		);
		expect(
			view.getByText('No playlists yet. Publish slides, then create a playlist.')
		).toBeInTheDocument();
	});
});
