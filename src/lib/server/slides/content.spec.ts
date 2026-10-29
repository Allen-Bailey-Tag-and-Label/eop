import { validateAssetScope } from './asset-library';
vi.mock('./asset-library', () => ({ validateAssetScope: vi.fn() }));
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import {
	assignPlaylist,
	duplicateSlide,
	duplicatePlaylist,
	deletePlaylist,
	listPlaylists,
	getPlayback,
	listSlideReferences,
	manageSlide,
	saveContent
} from './content';
import { Slide, Playlist, Asset } from './models';
import { MonitorSession } from '../monitors/model';
import { blankSlide, newElement, defaultDataSource } from '$lib/slides/types';
import { Holiday } from '../mongoose/models/Holiday';

vi.mock('../mongoose/models/Holiday', () => ({
	Holiday: { find: vi.fn(), schema: { path: () => ({ options: {} }) } }
}));
vi.mock('../mongoose/models', async () => ({
	Holiday: (await import('../mongoose/models/Holiday')).Holiday
}));

vi.mock('./models', () => ({
	Slide: {
		create: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
		countDocuments: vi.fn(),
		find: vi.fn(),
		findOne: vi.fn()
	},
	Playlist: {
		findOne: vi.fn(),
		deleteOne: vi.fn(),
		create: vi.fn(),
		updateOne: vi.fn(),
		findById: vi.fn(),
		find: vi.fn(),
		exists: vi.fn()
	},
	Asset: { find: vi.fn() }
}));
vi.mock('../monitors/model', () => ({
	MonitorSession: { find: vi.fn(), findById: vi.fn(), updateOne: vi.fn() }
}));
const query = (value: unknown) => ({
	select: vi.fn().mockReturnThis(),
	sort: vi.fn().mockReturnThis(),
	skip: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	maxTimeMS: vi.fn().mockReturnThis(),
	lean: vi.fn().mockResolvedValue(value)
});
const id = 'a'.repeat(24);
const userId = 'b'.repeat(24);
const slideUpdate = Slide.updateOne as unknown as ReturnType<
	typeof vi.fn<(filter: unknown, update: { $set: Record<string, unknown> }) => unknown>
>;
function fields(definition = blankSlide(), intent = 'draft') {
	const form = new FormData();
	for (const [key, value] of Object.entries({
		id,
		version: '1',
		slug: 'welcome',
		title: 'Welcome',
		definition: JSON.stringify(definition),
		intent
	}))
		form.set(key, value);
	return form;
}
beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(Slide.updateOne).mockResolvedValue({ modifiedCount: 1 } as Awaited<
		ReturnType<typeof Slide.updateOne>
	>);
	vi.mocked(Playlist.updateOne).mockResolvedValue({ modifiedCount: 1 } as Awaited<
		ReturnType<typeof Playlist.updateOne>
	>);
});
describe('slide publishing', () => {
	it('duplicates the saved draft into a unique unpublished slide and retains nested artwork references', async () => {
		const frame = newElement('frame', 'frame');
		frame.frame!.elements = [{ ...newElement('image', 'image'), assetId: 'c'.repeat(24) }];
		const draft = { ...blankSlide(), elements: [frame] };
		vi.mocked(Slide.findOne).mockReturnValue(
			query({
				slug: 'a'.repeat(80),
				title: 'b'.repeat(160),
				draft,
				published: blankSlide()
			}) as unknown as ReturnType<typeof Slide.findOne>
		);
		const key = await duplicateSlide(fields(draft), userId);
		expect(Slide.findOne).toHaveBeenCalledWith({ _id: id, version: 1 });
		expect(key).toHaveLength(80);
		expect(Slide.create).toHaveBeenCalledWith(
			expect.objectContaining({
				slug: key,
				title: `${'b'.repeat(153)} (copy)`,
				version: 1,
				draft,
				_createdById: userId
			})
		);
		const copy = vi.mocked(Slide.create).mock.calls[0][0];
		expect(copy).not.toHaveProperty('published');
		expect(copy).not.toHaveProperty('publishedAt');
		expect(copy).not.toHaveProperty('publishedTitle');
		expect(Slide.updateOne).not.toHaveBeenCalled();
	});
	it('rejects invalid or stale duplicate requests before creating anything', async () => {
		const invalid = fields();
		invalid.set('version', '0');
		await expect(duplicateSlide(invalid, userId)).rejects.toThrow('Invalid slide version');
		vi.mocked(Slide.findOne).mockReturnValue(
			query(null) as unknown as ReturnType<typeof Slide.findOne>
		);
		await expect(duplicateSlide(fields(), userId)).rejects.toThrow('changed or no longer exists');
		expect(Slide.create).not.toHaveBeenCalled();
	});
	it('uses the unsaved slide asset scope as the newly created slide ID', async () => {
		const form = fields();
		form.set('id', '');
		form.set('version', '0');
		form.set('assetScopeId', 'c'.repeat(24));
		await saveContent('slide', form, userId);
		expect(Slide.create).toHaveBeenCalledWith(
			expect.objectContaining({ _id: new Types.ObjectId('c'.repeat(24)) })
		);
		expect(validateAssetScope).toHaveBeenCalledWith(expect.anything(), 'c'.repeat(24));
	});
	it('keeps draft saves separate from the published snapshot', async () => {
		await saveContent('slide', fields(), userId);
		const change = slideUpdate.mock.calls[0][1];
		expect(change?.$set).toMatchObject({ draft: blankSlide() });
		expect(change?.$set).not.toHaveProperty('published');
		expect(change?.$set).not.toHaveProperty('publishedAt');
	});
	it('publishes the submitted definition atomically and rejects stale edits', async () => {
		await saveContent('slide', fields(blankSlide(), 'publish'), userId);
		expect(slideUpdate.mock.calls[0][1].$set).toMatchObject({
			draft: blankSlide(),
			published: blankSlide(),
			publishedTitle: 'Welcome'
		});
		vi.mocked(Slide.updateOne).mockResolvedValue({ modifiedCount: 0 } as Awaited<
			ReturnType<typeof Slide.updateOne>
		>);
		await expect(saveContent('slide', fields(), userId)).rejects.toThrow('another editor');
	});
	it('requires published slides before publishing a playlist', async () => {
		const form = fields();
		form.set(
			'definition',
			JSON.stringify({ loop: true, items: [{ slideId: id, durationMs: null }] })
		);
		form.set('intent', 'publish');
		vi.mocked(Slide.countDocuments).mockResolvedValue(0);
		await expect(saveContent('playlist', form, userId)).rejects.toThrow(
			'Publish all referenced slides'
		);
		expect(Playlist.updateOne).not.toHaveBeenCalled();
	});
	it('does not query media persistence for a text-only slide', async () => {
		await saveContent('slide', fields(), userId);
		expect(Asset.find).not.toHaveBeenCalled();
	});
});
describe('slide unpublishing and deletion', () => {
	it('finds draft-only and published-only references, including repeated entries', async () => {
		vi.mocked(Playlist.find).mockReturnValue(
			query([
				{
					slug: 'draft',
					title: 'Draft playlist',
					draft: { items: [{ slideId: id }, { slideId: id }] }
				},
				{
					slug: 'live',
					title: 'Live playlist',
					draft: { items: [] },
					published: { items: [{ slideId: id }] }
				}
			]) as unknown as ReturnType<typeof Playlist.find>
		);
		expect(await listSlideReferences(id)).toEqual([
			{ slug: 'draft', title: 'Draft playlist', draft: true, published: false },
			{ slug: 'live', title: 'Live playlist', draft: false, published: true }
		]);
		expect(Playlist.find).toHaveBeenCalledWith({
			$or: [{ 'draft.items.slideId': id }, { 'published.items.slideId': id }]
		});
	});
	it('unpublishes only the saved snapshot and advances the concurrency version', async () => {
		expect(await manageSlide('unpublish', 'welcome', fields(), userId)).toEqual([]);
		expect(Slide.updateOne).toHaveBeenCalledWith(
			{ _id: id, slug: 'welcome', version: 1, published: { $exists: true } },
			{ $unset: { published: 1, publishedAt: 1, publishedTitle: 1 }, $inc: { version: 1 } },
			{ _createdById: userId, runValidators: true }
		);
		expect(Slide.deleteOne).not.toHaveBeenCalled();
	});
	it('blocks deletion when a published playlist still uses the slide', async () => {
		vi.mocked(Playlist.find).mockReturnValue(
			query([
				{
					slug: 'live',
					title: 'Live playlist',
					draft: { items: [] },
					published: { items: [{ slideId: id }] }
				}
			]) as unknown as ReturnType<typeof Playlist.find>
		);
		expect(await manageSlide('delete', 'welcome', fields(), userId)).toEqual([
			{ slug: 'live', title: 'Live playlist', draft: false, published: true }
		]);
		expect(Slide.deleteOne).not.toHaveBeenCalled();
	});
	it('deletes an unreferenced slide with a version check and retains uploaded assets', async () => {
		vi.mocked(Playlist.find).mockReturnValue(
			query([]) as unknown as ReturnType<typeof Playlist.find>
		);
		vi.mocked(Slide.deleteOne).mockResolvedValue({ deletedCount: 1, acknowledged: true });
		expect(await manageSlide('delete', 'welcome', fields(), userId)).toEqual([]);
		expect(Slide.deleteOne).toHaveBeenCalledWith(
			{ _id: id, slug: 'welcome', version: 1 },
			{ _createdById: userId }
		);
		expect(Asset.find).not.toHaveBeenCalled();
	});
	it('rejects invalid versions and stale deletes or unpublishes', async () => {
		const invalid = fields();
		invalid.set('version', '0');
		await expect(manageSlide('delete', 'welcome', invalid, userId)).rejects.toThrow(
			'Invalid slide version'
		);
		expect(Slide.deleteOne).not.toHaveBeenCalled();
		vi.mocked(Playlist.find).mockReturnValue(
			query([]) as unknown as ReturnType<typeof Playlist.find>
		);
		vi.mocked(Slide.deleteOne).mockResolvedValue({ deletedCount: 0, acknowledged: true });
		await expect(manageSlide('delete', 'welcome', fields(), userId)).rejects.toThrow(
			'another editor'
		);
		vi.mocked(Slide.updateOne).mockResolvedValue({ modifiedCount: 0 } as Awaited<
			ReturnType<typeof Slide.updateOne>
		>);
		await expect(manageSlide('unpublish', 'welcome', fields(), userId)).rejects.toThrow(
			'another editor'
		);
	});
});
describe('monitor playlist playback', () => {
	it('filters published slides by local-date rules on every read and includes playlist playback options', async () => {
		vi.mocked(MonitorSession.findById).mockReturnValue(
			query({ playlistId: new Types.ObjectId(id) }) as unknown as ReturnType<
				typeof MonitorSession.findById
			>
		);
		vi.mocked(Playlist.findById).mockReturnValue(
			query({
				publishedTitle: 'Events',
				published: {
					loop: true,
					randomStart: true,
					upcomingCount: 4,
					items: [
						{ slideId: id, durationMs: null },
						{ slideId: userId, durationMs: 2000 }
					]
				}
			}) as unknown as ReturnType<typeof Playlist.findById>
		);
		vi.mocked(Slide.find).mockReturnValue(
			query([
				{
					_id: new Types.ObjectId(id),
					publishedTitle: 'Event',
					published: {
						...blankSlide(),
						visibility: {
							match: 'all',
							timeZone: 'America/New_York',
							rules: [{ kind: 'date', operator: 'on-or-before', value: '2026-10-29' }]
						}
					}
				},
				{ _id: new Types.ObjectId(userId), publishedTitle: 'Always', published: blankSlide() }
			]) as unknown as ReturnType<typeof Slide.find>
		);
		const before = await getPlayback(id, new Date('2026-10-30T03:59:59Z'));
		expect(before?.slides.map((slide) => slide.title)).toEqual(['Event', 'Always']);
		expect(before).toMatchObject({ randomStart: true, upcomingCount: 4 });
		const after = await getPlayback(id, new Date('2026-10-30T04:00:00Z'));
		expect(after?.slides.map((slide) => slide.title)).toEqual(['Always']);
		expect(after?.version).not.toBe(before?.version);
	});
	it('reevaluates data conditions and returns an assigned empty playlist when no slide is eligible', async () => {
		vi.mocked(MonitorSession.findById).mockReturnValue(
			query({ playlistId: new Types.ObjectId(id) }) as unknown as ReturnType<
				typeof MonitorSession.findById
			>
		);
		vi.mocked(Playlist.findById).mockReturnValue(
			query({
				published: { loop: true, items: [{ slideId: id, durationMs: null }] }
			}) as unknown as ReturnType<typeof Playlist.findById>
		);
		const calendar = {
			...newElement('list', 'calendar'),
			dataSource: { ...defaultDataSource(), model: 'Holiday', select: 'name', labelField: 'name' }
		};
		vi.mocked(Slide.find).mockReturnValue(
			query([
				{
					_id: new Types.ObjectId(id),
					published: {
						...blankSlide(),
						elements: [calendar],
						visibility: {
							match: 'all',
							timeZone: 'America/New_York',
							rules: [{ kind: 'dataCount', elementId: 'calendar', operator: 'gt', value: '0' }]
						}
					}
				}
			]) as unknown as ReturnType<typeof Slide.find>
		);
		vi.mocked(Holiday.find).mockReturnValue(
			query([]) as unknown as ReturnType<typeof Holiday.find>
		);
		const empty = await getPlayback(id);
		expect(empty).not.toBeNull();
		expect(empty?.slides).toEqual([]);
		vi.mocked(Holiday.find).mockReturnValue(
			query([{ _id: new Types.ObjectId(), name: 'Holiday' }]) as unknown as ReturnType<
				typeof Holiday.find
			>
		);
		const active = await getPlayback(id);
		expect(active?.slides).toHaveLength(1);
		expect(active?.version).not.toBe(empty?.version);
	});
	it('includes playlist versions for list actions', async () => {
		vi.mocked(Playlist.find).mockReturnValue(
			query([
				{ _id: new Types.ObjectId(id), slug: 'live', title: 'Live', version: 4 }
			]) as unknown as ReturnType<typeof Playlist.find>
		);
		expect(await listPlaylists()).toEqual([
			{ id, slug: 'live', title: 'Live', version: 4, publishedAt: null }
		]);
	});
	it('duplicates playlist draft order, overrides and loop settings without publishing or assigning the copy', async () => {
		const draft = {
			transition: { type: 'crossfade', durationMs: 2000 },
			loop: false,
			items: [
				{ slideId: id, durationMs: 5000 },
				{ slideId: 'c'.repeat(24), durationMs: null },
				{ slideId: id, durationMs: 2000 }
			]
		};
		vi.mocked(Playlist.findOne).mockReturnValue(
			query({
				slug: 'a'.repeat(80),
				title: 'b'.repeat(160),
				draft,
				published: { loop: true, items: [] }
			}) as unknown as ReturnType<typeof Playlist.findOne>
		);
		const key = await duplicatePlaylist(fields(), userId);
		expect(key).toHaveLength(80);
		expect(Playlist.findOne).toHaveBeenCalledWith({ _id: id, version: 1 });
		expect(Playlist.create).toHaveBeenCalledWith(
			expect.objectContaining({
				slug: key,
				title: `${'b'.repeat(153)} (copy)`,
				version: 1,
				draft,
				_createdById: userId
			})
		);
		const copy = vi.mocked(Playlist.create).mock.calls[0][0];
		expect(copy).not.toHaveProperty('published');
		expect(copy).not.toHaveProperty('publishedAt');
		expect(copy).not.toHaveProperty('publishedTitle');
		expect(MonitorSession.updateOne).not.toHaveBeenCalled();
		expect(Slide.create).not.toHaveBeenCalled();
	});
	it('requires a current version for duplicate and delete and explicit confirmation for deletion', async () => {
		const invalid = fields();
		invalid.set('version', '0');
		await expect(duplicatePlaylist(invalid, userId)).rejects.toThrow('Invalid playlist version');
		await expect(deletePlaylist(invalid, userId)).rejects.toThrow('Invalid playlist version');
		await expect(deletePlaylist(fields(), userId)).rejects.toThrow('Confirm deletion');
		vi.mocked(Playlist.findOne).mockReturnValue(
			query(null) as unknown as ReturnType<typeof Playlist.findOne>
		);
		await expect(duplicatePlaylist(fields(), userId)).rejects.toThrow(
			'changed or no longer exists'
		);
		expect(Playlist.create).not.toHaveBeenCalled();
		expect(Playlist.deleteOne).not.toHaveBeenCalled();
	});
	it('blocks playlist deletion while approved monitors are assigned and returns their locations', async () => {
		vi.mocked(MonitorSession.find).mockReturnValue(
			query([{ _id: new Types.ObjectId(userId), location: 'Break room' }]) as unknown as ReturnType<
				typeof MonitorSession.find
			>
		);
		const form = fields();
		form.set('confirm', 'delete');
		expect(await deletePlaylist(form, userId)).toEqual([{ id: userId, location: 'Break room' }]);
		expect(MonitorSession.find).toHaveBeenCalledWith({ playlistId: id, status: 'approved' });
		expect(Playlist.deleteOne).not.toHaveBeenCalled();
	});
	it('deletes unassigned playlists with a version check and preserves slides and assignments', async () => {
		vi.mocked(MonitorSession.find).mockReturnValue(
			query([]) as unknown as ReturnType<typeof MonitorSession.find>
		);
		vi.mocked(Playlist.deleteOne).mockResolvedValue({ deletedCount: 1, acknowledged: true });
		const form = fields();
		form.set('confirm', 'delete');
		expect(await deletePlaylist(form, userId)).toEqual([]);
		expect(Playlist.deleteOne).toHaveBeenCalledWith(
			{ _id: id, slug: 'welcome', version: 1 },
			{ _createdById: userId }
		);
		expect(Slide.deleteOne).not.toHaveBeenCalled();
		expect(MonitorSession.updateOne).not.toHaveBeenCalled();
		vi.mocked(Playlist.deleteOne).mockResolvedValue({ deletedCount: 0, acknowledged: true });
		await expect(deletePlaylist(form, userId)).rejects.toThrow('changed or no longer exists');
	});
	it('returns no content until a playlist is assigned', async () => {
		vi.mocked(MonitorSession.findById).mockReturnValue(
			query({}) as unknown as ReturnType<typeof MonitorSession.findById>
		);
		expect(await getPlayback(id)).toBeNull();
		expect(Playlist.findById).not.toHaveBeenCalled();
	});
	it('plays published snapshots in playlist order with duration overrides and no draft data', async () => {
		vi.mocked(MonitorSession.findById).mockReturnValue(
			query({ playlistId: new Types.ObjectId(id) }) as unknown as ReturnType<
				typeof MonitorSession.findById
			>
		);
		vi.mocked(Playlist.findById).mockReturnValue(
			query({
				title: 'SECRET DRAFT',
				publishedTitle: 'Break room',
				published: {
					loop: true,
					transition: { type: 'crossfade', durationMs: 3500 },
					items: [
						{ slideId: id, durationMs: 2500, transition: { type: 'none', durationMs: 0 } },
						{ slideId: id, durationMs: null }
					]
				}
			}) as unknown as ReturnType<typeof Playlist.findById>
		);
		vi.mocked(Holiday.find).mockReturnValue(
			query([
				{ _id: new Types.ObjectId(), date: new Date('2026-11-26T05:00:00Z'), name: 'Thanksgiving' }
			]) as unknown as ReturnType<typeof Holiday.find>
		);
		vi.mocked(Slide.find).mockReturnValue(
			query([
				{
					_id: new Types.ObjectId(id),
					published: {
						...blankSlide(),
						elements: [
							{
								...newElement('list', 'calendar'),
								dataSource: {
									...defaultDataSource(),
									model: 'Holiday',
									select: 'name date',
									labelField: 'name',
									detailField: 'date',
									detailFormat: 'date' as const
								}
							}
						]
					},
					publishedTitle: 'Welcome',
					title: 'SECRET DRAFT',
					draft: { secret: 'SECRET DRAFT' }
				}
			]) as unknown as ReturnType<typeof Slide.find>
		);
		const playback = await getPlayback(id);
		expect(playback?.slides.map((slide) => slide.durationMs)).toEqual([2500, 10000]);
		expect(playback?.slides.map((slide) => slide.title)).toEqual(['Welcome', 'Welcome']);
		expect(playback?.title).toBe('Break room');
		expect(playback?.transition).toEqual({ type: 'crossfade', durationMs: 3500 });
		expect(playback?.slides[0].transition).toEqual({ type: 'none', durationMs: 0 });
		expect(playback?.slides[1].transition).toBeUndefined();
		expect(JSON.stringify(playback)).not.toContain('SECRET DRAFT');
		expect((await getPlayback(id))?.version).toBe(playback?.version);
		expect(playback?.slides[0].data?.calendar.items[0].label).toBe('Thanksgiving');
		vi.mocked(Holiday.find).mockReturnValue(
			query([
				{
					_id: new Types.ObjectId(),
					date: new Date('2026-11-26T05:00:00Z'),
					name: 'Updated holiday'
				}
			]) as unknown as ReturnType<typeof Holiday.find>
		);
		const refreshed = await getPlayback(id);
		expect(refreshed?.slides[0].data?.calendar.items[0].label).toBe('Updated holiday');
		expect(refreshed?.version).toBe(playback?.version);
		expect(Holiday.find).toHaveBeenCalledTimes(3);
	});
	it('rejects unpublished assignments and supports clearing an assignment', async () => {
		vi.mocked(Playlist.exists).mockResolvedValue(null);
		expect(await assignPlaylist(id, userId)).toBe(false);
		expect(MonitorSession.updateOne).not.toHaveBeenCalled();
		vi.mocked(MonitorSession.updateOne).mockResolvedValue({ matchedCount: 1 } as Awaited<
			ReturnType<typeof MonitorSession.updateOne>
		>);
		expect(await assignPlaylist(id, '')).toBe(true);
		expect(MonitorSession.updateOne).toHaveBeenCalledWith(
			{ _id: id, status: 'approved' },
			{ $unset: { playlistId: 1 } }
		);
	});
});
