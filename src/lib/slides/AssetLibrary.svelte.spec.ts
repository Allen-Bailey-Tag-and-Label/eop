import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { enhance } from '$app/forms';
import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
import AssetLibrary from './AssetLibrary.svelte';
vi.mock('$app/forms', () => ({ enhance: vi.fn(() => ({ destroy: vi.fn() })) }));
vi.mock('sveltewind/transitions', () => ({ subtleReveal: () => ({ duration: 0 }) }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
describe('asset library', () => {
	const base = {
		scopeId: 'a'.repeat(24),
		action: '?/asset',
		onChoose: vi.fn(),
		slides: [],
		assets: [],
		sharedAssets: [],
		unusedAssets: []
	};
	const photo = {
		id: '1',
		name: 'Photo',
		contentType: 'image/png',
		scope: 'slide' as const,
		slideId: base.scopeId
	};
	async function respond(
		form: HTMLFormElement,
		result: ActionResult,
		update = vi.fn(async () => {})
	) {
		const submit = vi.mocked(enhance).mock.calls.find(([element]) => element === form)?.[1];
		if (!submit) throw new Error('Missing enhanced confirmation form');
		const finish = await submit({} as Parameters<SubmitFunction>[0]);
		if (typeof finish !== 'function') throw new Error('Missing action callback');
		await finish({
			action: new URL('http://localhost/?/asset'),
			formData: new FormData(form),
			formElement: form,
			result,
			update
		});
		return update;
	}
	it('requires confirmation, focuses Cancel and prevents deleting assets used in unfinished edits', async () => {
		const view = render(AssetLibrary, { ...base, assets: [photo], usedAssetIds: ['1'] });
		const remove = view.getByRole('button', { name: 'Delete asset' });
		remove.focus();
		await fireEvent.click(remove);
		const confirmation = view.getByRole('alertdialog', { name: 'Delete asset?' });
		expect(confirmation).toHaveTextContent('Photo');
		expect(view.getByRole('button', { name: 'Delete asset' })).toBeDisabled();
		expect(view.getByRole('button', { name: 'Cancel' })).toHaveFocus();
		await fireEvent.click(view.getByRole('button', { name: 'Cancel' }));
		expect(view.queryByRole('alertdialog')).toBeNull();
		expect(remove).toHaveFocus();
	});
	it('submits a confirmed deletion, keeps reference errors visible, and returns to the library after success', async () => {
		const view = render(AssetLibrary, { ...base, assets: [photo] });
		await fireEvent.click(view.getByRole('button', { name: 'Delete asset' }));
		const form = view.getByRole('alertdialog').querySelector('form')!;
		expect(Object.fromEntries(new FormData(form))).toMatchObject({
			assetId: '1',
			assetScopeId: base.scopeId,
			operation: 'delete',
			confirm: 'delete'
		});
		await respond(form, {
			type: 'failure',
			status: 400,
			data: { error: 'Used by published slide Safety.' }
		});
		expect(view.getByRole('alertdialog')).toHaveTextContent('Used by published slide Safety.');
		await respond(
			form,
			{ type: 'success', status: 200, data: { success: 'Asset deleted.' } },
			vi.fn(async () => {
				await view.rerender({ assets: [] });
			})
		);
		expect(view.queryByRole('alertdialog')).toBeNull();
		expect(view.getByRole('textbox', { name: 'Search assets' })).toHaveFocus();
		expect(view.queryByText('Photo')).toBeNull();
	});
	it('moves a shared asset to the current slide and returns to This slide after the action refresh', async () => {
		const shared = { ...photo, scope: 'shared' as const, slideId: undefined };
		const view = render(AssetLibrary, { ...base, sharedAssets: [shared] });
		await fireEvent.click(view.getByRole('tab', { name: 'Shared library' }));
		await fireEvent.click(view.getByRole('button', { name: 'Move to this slide' }));
		const form = view
			.getByRole('alertdialog', { name: 'Move asset to this slide?' })
			.querySelector('form')!;
		expect(Object.fromEntries(new FormData(form))).toMatchObject({
			assetId: '1',
			assetScopeId: base.scopeId,
			operation: 'move'
		});
		await respond(
			form,
			{ type: 'success', status: 200, data: {} },
			vi.fn(async () => {
				await view.rerender({ sharedAssets: [], assets: [photo] });
			})
		);
		expect(view.getByRole('tab', { name: 'This slide' })).toHaveAttribute('aria-selected', 'true');
		expect(view.getByText('Photo')).toBeInTheDocument();
		expect(view.getByRole('button', { name: 'Share asset' })).toBeInTheDocument();
		expect(view.queryByRole('button', { name: 'Move to this slide' })).toBeNull();
	});
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
		expect(view.getByRole('button', { name: 'Delete asset' })).toBeInTheDocument();
		await fireEvent.input(view.getByRole('textbox', { name: 'Search assets' }), {
			target: { value: 'other' }
		});
		expect(view.queryByText('Old upload')).not.toBeInTheDocument();
	});
});
