import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import {
	assignPlaylist,
	getPlayback,
	listSlideReferences,
	manageSlide,
	saveContent
} from './content';
import { Slide, Playlist, Asset } from './models';
import { MonitorSession } from '../monitors/model';
import { blankSlide } from '$lib/slides/types';

vi.mock('./models', () => ({
	Slide: {
		create: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
		countDocuments: vi.fn(),
		find: vi.fn()
	},
	Playlist: {
		create: vi.fn(),
		updateOne: vi.fn(),
		findById: vi.fn(),
		find: vi.fn(),
		exists: vi.fn()
	},
	Asset: { find: vi.fn() }
}));
vi.mock('../monitors/model', () => ({ MonitorSession: { findById: vi.fn(), updateOne: vi.fn() } }));
const query = (value: unknown) => ({
	select: vi.fn().mockReturnThis(),
	sort: vi.fn().mockReturnThis(),
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
					items: [
						{ slideId: id, durationMs: 2500 },
						{ slideId: id, durationMs: null }
					]
				}
			}) as unknown as ReturnType<typeof Playlist.findById>
		);
		vi.mocked(Slide.find).mockReturnValue(
			query([
				{
					_id: new Types.ObjectId(id),
					published: blankSlide(),
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
		expect(JSON.stringify(playback)).not.toContain('SECRET DRAFT');
		expect((await getPlayback(id))?.version).toBe(playback?.version);
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
