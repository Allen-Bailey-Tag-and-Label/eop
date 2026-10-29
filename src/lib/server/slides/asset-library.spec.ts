import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { Asset, Slide } from './models';
import {
	assetReferences,
	assetScope,
	listAssetLibrary,
	manageAsset,
	reconcileAssetScopes,
	validateAssetScope
} from './asset-library';
import { blankSlide, newElement } from '$lib/slides/types';
import { defaultRepeater } from '$lib/slides/repeater';
vi.mock('./models', () => ({
	Asset: {
		find: vi.fn(),
		findById: vi.fn(),
		bulkWrite: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
		create: vi.fn()
	},
	Slide: { find: vi.fn(), findOne: vi.fn(), exists: vi.fn() }
}));
const owner = 'a'.repeat(24),
	other = 'b'.repeat(24),
	id = 'c'.repeat(24),
	user = 'd'.repeat(24);
const objectId = (value: string) => new Types.ObjectId(value);
const query = (value: unknown) => ({
	select: vi.fn().mockReturnThis(),
	sort: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	lean: vi.fn().mockResolvedValue(value)
});
const asset = (scope: 'slide' | 'shared' | 'unassigned' = 'slide') => ({
	_id: objectId(id),
	name: 'Logo',
	contentType: 'image/svg+xml',
	scope,
	...(scope === 'slide' ? { slideId: objectId(owner) } : {}),
	data: Buffer.from('<svg/>')
});
function mockAsset(value = asset()) {
	vi.mocked(Asset.findById).mockReturnValue({
		select: vi.fn().mockResolvedValue(value)
	} as unknown as ReturnType<typeof Asset.findById>);
}
beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(Asset.find).mockReturnValue(query([]) as unknown as ReturnType<typeof Asset.find>);
	vi.mocked(Slide.find).mockReturnValue(query([]) as unknown as ReturnType<typeof Slide.find>);
	vi.mocked(Slide.exists).mockResolvedValue(null);
	vi.mocked(Asset.updateOne).mockResolvedValue({ modifiedCount: 1 } as Awaited<
		ReturnType<typeof Asset.updateOne>
	>);
});
describe('slide asset library', () => {
	it('requires explicit confirmation and deletes only unreferenced assets with the checked scope', async () => {
		mockAsset(asset('shared'));
		const fields = new FormData();
		fields.set('assetId', id);
		fields.set('operation', 'delete');
		await expect(manageAsset(fields, owner, user)).rejects.toThrow('Confirm deletion');
		expect(Asset.deleteOne).not.toHaveBeenCalled();
		fields.set('confirm', 'delete');
		vi.mocked(Asset.deleteOne).mockResolvedValue({ deletedCount: 1, acknowledged: true });
		await expect(manageAsset(fields, owner, user)).resolves.toMatchObject({
			success: 'Asset deleted.'
		});
		expect(Asset.deleteOne).toHaveBeenCalledWith({
			_id: id,
			scope: 'shared',
			slideId: { $exists: false }
		});
		vi.mocked(Asset.deleteOne).mockResolvedValue({ deletedCount: 0, acknowledged: true });
		await expect(manageAsset(fields, owner, user)).rejects.toThrow('changed');
	});
	it('blocks deleting assets used in drafts, published slides or repeater templates, including uppercase IDs', async () => {
		mockAsset(asset('shared'));
		const fields = new FormData();
		fields.set('assetId', id.toUpperCase());
		fields.set('operation', 'delete');
		fields.set('confirm', 'delete');
		const template = defaultRepeater();
		template.template.elements.push({ ...newElement('svg', 'nested'), assetId: id.toUpperCase() });
		for (const definition of [
			{ ...blankSlide(), elements: [{ ...newElement('image', 'image'), assetId: id }] },
			{ ...blankSlide(), elements: [{ ...newElement('list', 'repeater'), repeater: template }] }
		]) {
			for (const snapshot of ['draft', 'published']) {
				vi.mocked(Slide.find).mockReturnValue(
					query([
						{ _id: objectId(other), title: 'Other slide', slug: 'other', [snapshot]: definition }
					]) as unknown as ReturnType<typeof Slide.find>
				);
				await expect(manageAsset(fields, owner, user)).rejects.toThrow('Other slide');
			}
		}
		expect(Asset.deleteOne).not.toHaveBeenCalled();
	});
	it('moves shared assets to the current slide without changing their IDs or existing slide references', async () => {
		mockAsset(asset('shared'));
		const existing = {
			_id: objectId(other),
			draft: { ...blankSlide(), elements: [{ ...newElement('image', 'image'), assetId: id }] }
		};
		vi.mocked(Slide.find).mockReturnValue(
			query([existing]) as unknown as ReturnType<typeof Slide.find>
		);
		const fields = new FormData();
		fields.set('assetId', id);
		fields.set('operation', 'move');
		fields.set('targetSlideId', other);
		await expect(manageAsset(fields, owner, user)).resolves.toMatchObject({
			success: expect.stringContaining('moved')
		});
		expect(Asset.updateOne).toHaveBeenCalledWith(
			{ _id: id, scope: 'shared', slideId: { $exists: false } },
			{ $set: { scope: 'slide', slideId: objectId(owner) } }
		);
		expect(Asset.create).not.toHaveBeenCalled();
		expect(Asset.deleteOne).not.toHaveBeenCalled();
		vi.mocked(Asset.find).mockImplementation(
			(filter?: unknown) =>
				query(
					filter && typeof filter === 'object' && '_id' in filter ? [asset()] : []
				) as unknown as ReturnType<typeof Asset.find>
		);
		await expect(validateAssetScope(existing.draft, other)).resolves.toBeUndefined();
		await expect(validateAssetScope(existing.draft, 'e'.repeat(24))).rejects.toThrow('Copy');
		vi.mocked(Asset.updateOne).mockResolvedValue({ modifiedCount: 0 } as Awaited<
			ReturnType<typeof Asset.updateOne>
		>);
		await expect(manageAsset(fields, owner, user)).rejects.toThrow('changed');
		mockAsset();
		await expect(manageAsset(fields, owner, user)).rejects.toThrow('Only shared');
	});
	it('classifies legacy assets by distinct draft and published slide references including templates', async () => {
		const shared = 'e'.repeat(24),
			unused = 'f'.repeat(24),
			published = '1'.repeat(24);
		const template = defaultRepeater();
		template.template.elements.push({ ...newElement('svg', 'logo'), assetId: shared });
		const first = {
			...blankSlide(),
			elements: [
				{ ...newElement('image', 'photo'), assetId: id },
				{ ...newElement('list', 'grid'), repeater: template }
			]
		};
		vi.mocked(Slide.find).mockReturnValue(
			query([
				{
					_id: objectId(owner),
					draft: first,
					published: {
						...blankSlide(),
						elements: [
							{ ...newElement('image', 'photo'), assetId: id },
							{ ...newElement('image', 'published'), assetId: published }
						]
					}
				},
				{
					_id: objectId(other),
					draft: { ...blankSlide(), elements: [{ ...newElement('svg', 'logo'), assetId: shared }] }
				}
			]) as unknown as ReturnType<typeof Slide.find>
		);
		vi.mocked(Asset.find).mockReturnValue(
			query(
				[id, shared, unused, published].map((value) => ({ _id: objectId(value) }))
			) as unknown as ReturnType<typeof Asset.find>
		);
		await reconcileAssetScopes();
		expect(Asset.bulkWrite).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					updateOne: expect.objectContaining({
						filter: { _id: objectId(id), scope: { $exists: false } },
						update: { $set: { scope: 'slide', slideId: objectId(owner) } }
					})
				}),
				expect.objectContaining({
					updateOne: expect.objectContaining({
						filter: { _id: objectId(shared), scope: { $exists: false } },
						update: { $set: { scope: 'shared' } }
					})
				}),
				expect.objectContaining({
					updateOne: expect.objectContaining({
						filter: { _id: objectId(unused), scope: { $exists: false } },
						update: { $set: { scope: 'unassigned' } }
					})
				}),
				expect.objectContaining({
					updateOne: expect.objectContaining({
						filter: { _id: objectId(published), scope: { $exists: false } },
						update: { $set: { scope: 'slide', slideId: objectId(owner) } }
					})
				})
			])
		);
		const references = await assetReferences();
		expect(references.uses.get(id)?.size).toBe(1);
		vi.mocked(Asset.find).mockReturnValue(query([]) as unknown as ReturnType<typeof Asset.find>);
		await reconcileAssetScopes();
		expect(Asset.bulkWrite).toHaveBeenCalledOnce();
	});
	it('queries this slide, shared, and unreferenced assets separately without binary data', async () => {
		await listAssetLibrary(owner);
		expect(Asset.find).toHaveBeenCalledWith({
			$or: [{ scope: 'slide', slideId: owner }, { _id: { $in: [] } }]
		});
		expect(Asset.find).toHaveBeenCalledWith({ scope: 'shared' });
		expect(Asset.find).toHaveBeenCalledWith({
			scope: { $in: ['slide', 'unassigned'] },
			_id: { $nin: [] }
		});
	});
	it('preserves a new draft scope and resolves saved slides by their actual IDs', async () => {
		expect(await assetScope('new', owner)).toBe(owner);
		await expect(assetScope('new', 'invalid')).rejects.toThrow('Reload');
		vi.mocked(Slide.findOne).mockReturnValue(
			query({ _id: objectId(other) }) as unknown as ReturnType<typeof Slide.findOne>
		);
		expect(await assetScope('saved-slide', owner)).toBe(other);
	});
	it('explicitly shares an owned asset without changing its bytes or references', async () => {
		mockAsset();
		const fields = new FormData();
		fields.set('assetId', id);
		fields.set('operation', 'share');
		await manageAsset(fields, owner, user);
		expect(Asset.updateOne).toHaveBeenCalledWith(
			expect.objectContaining({ _id: id, scope: 'slide' }),
			{ $set: { scope: 'shared' }, $unset: { slideId: 1 } }
		);
		expect(Asset.create).not.toHaveBeenCalled();
	});
	it('copies shared assets into a destination slide as independent private records', async () => {
		const original = asset('shared');
		mockAsset(original);
		vi.mocked(Slide.exists).mockResolvedValue({ _id: objectId(other) });
		vi.mocked(Asset.create).mockResolvedValue({ _id: objectId('2'.repeat(24)) } as never);
		const fields = new FormData();
		fields.set('assetId', id);
		fields.set('operation', 'copy');
		fields.set('targetSlideId', other);
		await manageAsset(fields, owner, user);
		expect(Asset.create).toHaveBeenCalledWith(
			expect.objectContaining({ data: original.data, scope: 'slide', slideId: objectId(other) })
		);
		expect(Asset.updateOne).not.toHaveBeenCalled();
	});
	it('assigns only unassigned unused assets and never steals another slide’s asset', async () => {
		mockAsset(asset('unassigned'));
		const fields = new FormData();
		fields.set('assetId', id);
		fields.set('operation', 'assign');
		await manageAsset(fields, owner, user);
		expect(Asset.updateOne).toHaveBeenCalledWith(expect.anything(), {
			$set: { scope: 'slide', slideId: objectId(owner) }
		});
		mockAsset({ ...asset(), slideId: objectId(other) });
		await expect(manageAsset(fields, owner, user)).rejects.toThrow('Only unassigned');
	});
	it('rejects new references to another slide’s private asset but accepts deliberate sharing', async () => {
		const definition = {
			...blankSlide(),
			elements: [{ ...newElement('svg', 'logo'), assetId: id }]
		};
		vi.mocked(Asset.find).mockImplementation(
			(filter?: unknown) =>
				query(
					filter && typeof filter === 'object' && '_id' in filter
						? [{ ...asset(), slideId: objectId(other) }]
						: []
				) as unknown as ReturnType<typeof Asset.find>
		);
		await expect(validateAssetScope(definition, owner)).rejects.toThrow('Copy');
		vi.mocked(Asset.find).mockImplementation(
			(filter?: unknown) =>
				query(
					filter && typeof filter === 'object' && '_id' in filter ? [asset('shared')] : []
				) as unknown as ReturnType<typeof Asset.find>
		);
		await expect(validateAssetScope(definition, owner)).resolves.toBeUndefined();
	});
});
