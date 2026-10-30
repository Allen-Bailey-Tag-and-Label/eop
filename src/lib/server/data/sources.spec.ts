import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSource, DataSourceCache, DataConnection } from './models';
import {
	resolveSource,
	previewWorkflow,
	saveSource,
	deleteSource,
	deleteConnection,
	getSource,
	moveSource,
	listSources,
	sourceOptions
} from './sources';
import { queryLink } from '../slides/data-sources';
import { Slide } from '../slides/models';
import { blankWorkflow } from '$lib/data/types';
import { blankSlide, defaultDataSource, newElement } from '$lib/slides/types';

vi.mock('./models', () => ({
	DataSource: {
		findById: vi.fn(),
		find: vi.fn(),
		create: vi.fn(),
		updateOne: vi.fn(),
		deleteOne: vi.fn(),
		exists: vi.fn()
	},
	DataSourceCache: { findOne: vi.fn(), updateOne: vi.fn(), deleteMany: vi.fn() },
	DataConnection: { findById: vi.fn(), find: vi.fn(), deleteOne: vi.fn() }
}));
vi.mock('../slides/data-sources', () => ({ queryLink: vi.fn() }));
vi.mock('../slides/models', () => ({ Slide: { find: vi.fn() } }));
const query = (value: unknown) => ({
	select: vi.fn().mockReturnThis(),
	lean: vi.fn().mockResolvedValue(value)
});
const id = 'a'.repeat(24),
	actor = 'b'.repeat(24),
	now = new Date('2026-10-30T12:00:00Z');
const reference = () => ({ sourceId: id, output: 'rows', parameters: {} });
beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(DataSourceCache.updateOne).mockResolvedValue({} as never);
	vi.mocked(DataSourceCache.deleteMany).mockResolvedValue({} as never);
	vi.mocked(Slide.find).mockReturnValue(query([]) as never);
});
describe('published data source lifecycle', () => {
	it('uses published definitions, selects outputs, caches shared results and ignores draft changes', async () => {
		const published = { ...blankWorkflow(), refreshSeconds: 60 };
		vi.mocked(DataSource.findById).mockReturnValue(
			query({ published, publishedAt: now, version: 3 }) as never
		);
		vi.mocked(DataSourceCache.findOne).mockReturnValue(query(null) as never);
		const result = await resolveSource(reference(), now);
		expect(result.outputs.rows[0].name).toBe('Example');
		expect(result).not.toHaveProperty('nodes');
		expect(DataSourceCache.updateOne).toHaveBeenCalledOnce();
		const key = vi.mocked(DataSourceCache.findOne).mock.calls[0][0];
		vi.mocked(DataSource.findById).mockReturnValue(
			query({ published, publishedAt: now, version: 4, draft: { secret: 'DRAFT' } }) as never
		);
		vi.mocked(DataSourceCache.findOne).mockReturnValue(
			query({ result, freshUntil: new Date(now.getTime() + 60000) }) as never
		);
		expect(await resolveSource(reference(), now)).toEqual(result);
		expect(vi.mocked(DataSourceCache.findOne).mock.calls[1][0]).toEqual(key);
	});
	it('uses a stale result only within the explicitly configured failure window', async () => {
		const published = {
			...blankWorkflow(),
			refreshSeconds: 10,
			staleSeconds: 60,
			nodes: [
				{
					id: 'rows',
					type: 'database' as const,
					inputs: [],
					config: { query: { ...defaultDataSource(), model: 'Holiday', select: 'name' } }
				}
			]
		};
		vi.mocked(DataSource.findById).mockReturnValue(query({ published, publishedAt: now }) as never);
		vi.mocked(DataSourceCache.findOne).mockReturnValue(
			query({
				result: { outputs: { rows: [{ name: 'Old' }] }, updatedAt: 'old' },
				freshUntil: new Date(now.getTime() - 1000),
				usableUntil: new Date(now.getTime() + 1000)
			}) as never
		);
		vi.mocked(queryLink).mockRejectedValue(new Error('offline'));
		expect(await resolveSource(reference(), now)).toMatchObject({
			stale: true,
			outputs: { rows: [{ name: 'Old' }] }
		});
		await expect(resolveSource(reference(), new Date(now.getTime() + 2000))).rejects.toThrow(
			'Database node'
		);
	});
	it('substitutes database parameters as values and keeps queries server-side', async () => {
		vi.mocked(queryLink).mockResolvedValue({
			state: 'ready',
			items: [{ id: 'one', label: '', detail: '', fields: { name: 'Alice' } }],
			message: ''
		});
		const definition = {
			...blankWorkflow(),
			parameters: { name: 'Alice' },
			nodes: [
				{
					id: 'rows',
					type: 'database',
					inputs: [],
					config: {
						query: {
							...defaultDataSource(),
							model: 'UserProfile',
							select: 'name',
							filter: '{"name":{"$param":"name"}}'
						}
					}
				}
			]
		};
		const result = await previewWorkflow(definition, { name: 'Bob' }, now);
		expect(queryLink).toHaveBeenCalledWith(
			expect.objectContaining({ filter: '{"name":"Bob"}' }),
			now
		);
		expect(result.outputs.rows[0].name).toBe('Alice');
	});
	it('requires current versions and prevents removing sources or connections that are in use', async () => {
		const fields = new FormData();
		fields.set('id', id);
		fields.set('version', '1');
		fields.set('confirm', 'delete');
		const element = { ...newElement('text', 'text'), dataReference: reference() };
		vi.mocked(Slide.find).mockReturnValue(
			query([
				{ title: 'Used', slug: 'used', draft: { ...blankSlide(), elements: [element] } }
			]) as never
		);
		await expect(deleteSource(fields, actor)).rejects.toThrow('Remove this source');
		expect(DataSource.deleteOne).not.toHaveBeenCalled();
		vi.mocked(DataSource.exists).mockResolvedValue({ _id: id } as never);
		await expect(deleteConnection(fields, actor)).rejects.toThrow('used');
		expect(DataConnection.deleteOne).not.toHaveBeenCalled();
	});
	it('preserves source output contracts on publication and rejects stale writes', async () => {
		const fields = new FormData();
		fields.set('id', id);
		fields.set('version', '1');
		fields.set('title', 'Example');
		fields.set('definition', JSON.stringify(blankWorkflow()));
		fields.set('intent', 'draft');
		vi.mocked(DataSource.updateOne).mockResolvedValue({ matchedCount: 0 } as never);
		await expect(saveSource(fields, actor)).rejects.toThrow('changed');
		fields.set('intent', 'publish');
		vi.mocked(Slide.find).mockReturnValue(
			query([
				{
					title: 'Published slide',
					draft: {
						...blankSlide(),
						elements: [
							{
								...newElement('text', 'text'),
								dataReference: { ...reference(), output: 'removed' }
							}
						]
					}
				}
			]) as never
		);
		await expect(saveSource(fields, actor)).rejects.toThrow('used by Published slide');
	});
});

describe('slide and shared data libraries', () => {
	it('rejects editing a link owned by another slide', async () => {
		vi.mocked(DataSource.findById).mockReturnValue(
			query({
				_id: id,
				title: 'Other',
				version: 1,
				draft: blankWorkflow(),
				scope: 'slide',
				slideId: actor
			}) as never
		);
		await expect(getSource(id, 'c'.repeat(24))).rejects.toThrow('not found in this slide');
	});
	it('creates local links in the stable draft scope and supports shared links', async () => {
		vi.mocked(DataSource.create).mockResolvedValue({ _id: id } as never);
		const fields = new FormData();
		fields.set('id', '');
		fields.set('title', 'Birthdays');
		fields.set('version', '0');
		fields.set('definition', JSON.stringify(blankWorkflow()));
		await saveSource(fields, actor, 'c'.repeat(24));
		expect(DataSource.create).toHaveBeenLastCalledWith(
			expect.objectContaining({ scope: 'slide', slideId: 'c'.repeat(24) })
		);
		fields.set('scope', 'shared');
		await saveSource(fields, actor, 'c'.repeat(24));
		expect(DataSource.create).toHaveBeenLastCalledWith(
			expect.objectContaining({ scope: 'shared' })
		);
	});
	it('requires confirmation to move shared links without changing references', async () => {
		vi.mocked(DataSource.findById).mockReturnValue(
			query({
				_id: id,
				title: 'Shared',
				version: 1,
				draft: blankWorkflow(),
				scope: 'shared'
			}) as never
		);
		vi.mocked(DataSource.updateOne).mockResolvedValue({ matchedCount: 1 } as never);
		const fields = new FormData();
		fields.set('id', id);
		fields.set('version', '1');
		fields.set('scope', 'slide');
		await expect(moveSource(fields, actor, actor)).rejects.toThrow('Confirm');
		fields.set('confirm', 'move');
		await moveSource(fields, actor, actor);
		expect(DataSource.updateOne).toHaveBeenCalledWith(
			{ _id: id, version: 1 },
			{ $set: { scope: 'slide', slideId: actor }, $inc: { version: 1 } },
			expect.any(Object)
		);
	});
	it('lists only the current slide and shared libraries', async () => {
		const chain = {
			select: vi.fn().mockReturnThis(),
			sort: vi.fn().mockReturnThis(),
			lean: vi.fn().mockResolvedValue([])
		};
		vi.mocked(DataSource.find).mockReturnValue(chain as never);
		await listSources(actor);
		await sourceOptions(actor);
		expect(DataSource.find).toHaveBeenCalledWith(
			expect.objectContaining({
				$or: [
					{ scope: 'shared' },
					{ scope: { $exists: false } },
					{ scope: 'slide', slideId: actor }
				]
			})
		);
	});
});
