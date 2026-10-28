import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import AssetLibrary from './AssetLibrary.svelte';
vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
afterEach(cleanup);
describe('asset library', () => {
	it('defaults to the current slide and separates shared assets and unused-file review', async () => {
		const choose = vi.fn();
		const view = render(AssetLibrary, {
			scopeId: 'a'.repeat(24),
			action: '?/asset',
			onChoose: choose,
			slides: [],
			assets: [
				{
					id: '1',
					name: 'Private photo',
					contentType: 'image/png',
					scope: 'slide',
					slideId: 'a'.repeat(24)
				}
			],
			sharedAssets: [
				{ id: '2', name: 'Shared logo', contentType: 'image/svg+xml', scope: 'shared' }
			],
			unusedAssets: [{ id: '3', name: 'Old upload', contentType: 'image/png', scope: 'unassigned' }]
		});
		expect(view.getByText('Private photo')).toBeInTheDocument();
		expect(view.queryByText('Shared logo')).not.toBeInTheDocument();
		await fireEvent.click(view.getByRole('tab', { name: 'Shared library' }));
		expect(view.getByText('Shared logo')).toBeInTheDocument();
		await fireEvent.click(view.getByRole('button', { name: 'Add to canvas' }));
		expect(choose).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
		await fireEvent.click(view.getByRole('tab', { name: 'Unused assets' }));
		expect(view.getByText('Old upload')).toBeInTheDocument();
		expect(view.getByRole('button', { name: 'Assign to this slide' })).toBeInTheDocument();
		expect(view.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
		await fireEvent.input(view.getByRole('textbox', { name: 'Search assets' }), {
			target: { value: 'other' }
		});
		expect(view.queryByText('Old upload')).not.toBeInTheDocument();
	});
});
