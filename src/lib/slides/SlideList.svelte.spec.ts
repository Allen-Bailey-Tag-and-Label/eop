import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import SlideList from '../../routes/(private)/(padded)/admin/monitors/slides/+page.svelte';

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
const slides = [
	{ id: 'a'.repeat(24), title: 'Welcome', slug: 'welcome', version: 2, publishedAt: null },
	{
		id: 'b'.repeat(24),
		title: 'Holidays',
		slug: 'holidays',
		version: 3,
		publishedAt: '2026-10-29T12:00:00Z'
	}
];
const data = { slides } as ComponentProps<typeof SlideList>['data'];
describe('slide list actions', () => {
	it('uses sortable Datatable columns with readable titles and separate per-slide actions', async () => {
		const view = render(SlideList, { data, form: null, params: {} });
		expect(view.getByRole('link', { name: 'Edit Welcome' })).toHaveAttribute(
			'href',
			'/admin/monitors/slides/welcome'
		);
		expect(view.getByRole('link', { name: 'Edit Welcome' })).toHaveClass('text-white');
		expect(view.getByText('Welcome').closest('a')).toBeNull();
		expect(view.getByText('Draft only')).toBeInTheDocument();
		const duplicate = view.getByRole('button', { name: 'Duplicate Welcome' });
		expect(duplicate.closest('form')).toHaveAttribute('action', '?/duplicate');
		expect(duplicate.closest('form')?.querySelector('input[name="id"]')).toHaveValue(slides[0].id);
		await fireEvent.click(view.getByRole('button', { name: 'Slide' }));
		expect(view.getByRole('link', { name: 'Edit Holidays' })).toHaveAttribute(
			'href',
			'/admin/monitors/slides/holidays'
		);
		await fireEvent.click(view.getByRole('button', { name: 'Delete Welcome' }));
		expect(view.getByRole('dialog', { name: 'Delete slide?' })).toHaveTextContent('Welcome');
		const confirmation = view.getByRole('button', { name: 'Delete slide' }).closest('form');
		expect(confirmation).toHaveAttribute('action', '?/delete');
		expect(confirmation?.querySelector('input[name="version"]')).toHaveValue('2');
		expect(confirmation?.querySelector('input[name="confirm"]')).toHaveValue('delete');
		await fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
		expect(view.queryByRole('dialog')).toBeNull();
	});
	it('preserves the create link and helpful empty state', () => {
		const view = render(SlideList, { data: { ...data, slides: [] }, form: null, params: {} });
		expect(view.getByRole('link', { name: 'Create slide' })).toHaveAttribute(
			'href',
			'/admin/monitors/slides/new'
		);
		expect(
			view.getByText('No slides yet. Create your first slide to get started.')
		).toBeInTheDocument();
	});
});
