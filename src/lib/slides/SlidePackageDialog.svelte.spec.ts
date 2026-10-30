import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import SlidePackageDialog from './SlidePackageDialog.svelte';
import { blankSlide } from './types';
vi.mock('$app/navigation', () => ({ goto: vi.fn().mockResolvedValue(undefined) }));
vi.mock('$app/paths', () => ({
	resolve: (_: string, params: { slug: string }) => `/admin/monitors/slides/${params.slug}`
}));
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
	vi.clearAllMocks();
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});
const props = {
	definition: blankSlide(),
	title: 'Weather',
	slug: 'weather',
	endpoint: '/admin/monitors/slides/weather/package'
};
describe('slide package dialogs', () => {
	it('reviews a package and sends explicit reuse choices before opening the new draft', async () => {
		const id = 'a'.repeat(24),
			reused = 'b'.repeat(24);
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						package: {
							slide: { title: 'Imported weather', slug: 'weather-live' },
							assets: [{ id, name: 'Sun' }],
							sources: [],
							connections: []
						},
						existing: {
							assets: [{ id: reused, title: 'Shared sun' }],
							sources: [],
							connections: []
						}
					})
				)
			)
			.mockResolvedValueOnce(new Response(JSON.stringify({ slug: 'weather-live' })));
		vi.stubGlobal('fetch', fetcher);
		const view = render(SlidePackageDialog, { ...props, mode: 'import' });
		expect(view.queryByRole('button', { name: 'Import as new draft' })).not.toBeInTheDocument();
		await fireEvent.change(view.getByLabelText('Slide package file'), {
			target: { files: [new File(['zip'], 'weather.zip')] }
		});
		await waitFor(() =>
			expect(view.getByRole('button', { name: 'Import as new draft' })).toBeInTheDocument()
		);
		await fireEvent.change(view.getByRole('combobox', { name: `Import assets ${id}` }), {
			target: { value: reused }
		});
		await fireEvent.click(view.getByRole('button', { name: 'Import as new draft' }));
		await waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/admin/monitors/slides/weather-live', {
				invalidateAll: true
			})
		);
		const fields = fetcher.mock.calls[1][1].body as FormData;
		expect(fields.get('operation')).toBe('import');
		expect(JSON.parse(String(fields.get('choices'))).assets[id]).toBe(reused);
	});
	it('shows validation errors without importing or leaving the current slide', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response(JSON.stringify({ error: 'Package is missing slide.json.' }), { status: 400 })
			)
		);
		const view = render(SlidePackageDialog, { ...props, mode: 'import' });
		await fireEvent.change(view.getByLabelText('Slide package file'), {
			target: { files: [new File(['zip'], 'bad.zip')] }
		});
		await waitFor(() => expect(view.getByRole('alert')).toHaveTextContent('missing slide.json'));
		expect(goto).not.toHaveBeenCalled();
	});
	it('exports the current layout without requiring a saved slide', async () => {
		const fetcher = vi.fn<typeof fetch>(
			async () => new Response('zip', { headers: { 'content-type': 'application/zip' } })
		);
		vi.stubGlobal('fetch', fetcher);
		vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		vi.stubGlobal(
			'URL',
			Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:package'), revokeObjectURL: vi.fn() })
		);
		const view = render(SlidePackageDialog, { ...props, mode: 'export' });
		await fireEvent.click(view.getByRole('button', { name: 'Download slide package' }));
		await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
		const fields = fetcher.mock.calls[0][1]!.body as FormData;
		expect(JSON.parse(String(fields.get('definition')))).toEqual(props.definition);
	});
});
