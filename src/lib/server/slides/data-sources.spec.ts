import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Holiday, Customer } from '../mongoose/models';
import { createSlideDataResolver, resolveDates, previewSlideData } from './data-sources';
import { blankSlide, newElement, defaultDataSource, type SlideDataSource } from '$lib/slides/types';
import { validateDataSource, validateSlide } from '$lib/slides/validation';
import { resolveSource } from '../data/sources';
import { defaultRepeater } from '$lib/slides/repeater';
vi.mock('../data/sources', () => ({ resolveSource: vi.fn() }));
vi.mock('../mongoose/models', () => {
	const schema = {
		path: (field: string) =>
			['_id', 'name', 'date', 'total'].includes(field) ? { options: {} } : undefined
	};
	return { Holiday: { find: vi.fn(), schema }, Customer: { find: vi.fn(), schema } };
});
const now = new Date('2026-03-08T04:30:00Z');
const source = (): SlideDataSource => ({
	...defaultDataSource(),
	model: 'Holiday',
	filter: '{"date":{"$gte":{"$date":"today"},"$lt":{"$date":"today+2d"}}}',
	select: 'name date',
	sort: '{"date":1,"_id":1}',
	labelField: 'name',
	detailField: 'date',
	detailFormat: 'date' as const
});
const element = () => ({ ...newElement('list', 'data'), dataSource: source() });
const query = (rows: unknown[]) => ({
	select: vi.fn().mockReturnThis(),
	sort: vi.fn().mockReturnThis(),
	skip: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	maxTimeMS: vi.fn().mockReturnThis(),
	lean: vi.fn().mockResolvedValue(rows)
});
beforeEach(() => vi.resetAllMocks());
describe('generic slide data links', () => {
	it('returns every output row for chart rendering in both preview and monitor resolution', async () => {
		const chart = {
			...newElement('chart', 'sales'),
			dataReference: { sourceId: 'a'.repeat(24), output: 'rows', parameters: {} }
		};
		const rows = [
			{ label: 'Mon', value: 25 },
			{ label: 'Tue', value: 40 }
		];
		vi.mocked(resolveSource).mockResolvedValue({ outputs: { rows }, updatedAt: now.toISOString() });
		const definition = { ...blankSlide(), elements: [chart] };
		for (const result of [
			await previewSlideData(definition, now),
			await createSlideDataResolver(now)(definition)
		])
			expect(result.sales.items.map((item) => item.fields)).toEqual(rows);
	});
	it('resolves collection references separately from fixed copies while preserving migrated labels and details', async () => {
		const reference = { sourceId: 'a'.repeat(24), output: 'rows', parameters: {} };
		const linked = {
			...newElement('repeater', 'linked'),
			repeater: defaultRepeater(),
			repeatItems: { mode: 'source' as const, source: reference }
		};
		const fixed = {
			...newElement('repeater', 'fixed'),
			repeater: defaultRepeater(),
			repeatItems: { mode: 'count' as const, count: 3 }
		};
		vi.mocked(resolveSource).mockResolvedValue({
			outputs: {
				rows: [{ _rowId: 'one', name: 'Holiday', _label: 'Holiday', _detail: 'Dec 25, 2026' }]
			},
			updatedAt: now.toISOString()
		});
		const resolved = await previewSlideData({ ...blankSlide(), elements: [linked, fixed] }, now);
		expect(resolved.linked.items[0]).toMatchObject({
			id: 'one',
			label: 'Holiday',
			detail: 'Dec 25, 2026',
			fields: { name: 'Holiday' }
		});
		expect(resolved.fixed).toBeUndefined();
		expect(resolveSource).toHaveBeenCalledOnce();
		expect(Holiday.find).not.toHaveBeenCalled();
	});
	it('resolves and previews data links nested inside frames', async () => {
		const rows = query([
			{ _id: 'one', name: 'Nested holiday', date: new Date('2026-03-08T05:00:00Z') }
		]);
		vi.mocked(Holiday.find).mockReturnValue(rows as unknown as ReturnType<typeof Holiday.find>);
		const frame = newElement('frame', 'frame');
		frame.frame!.elements = [element()];
		const definition = { ...blankSlide(), elements: [frame] };
		expect((await createSlideDataResolver(now)(definition)).data.items[0].label).toBe(
			'Nested holiday'
		);
		expect((await previewSlideData(definition, now)).data.items[0].label).toBe('Nested holiday');
	});
	it('previews valid links despite unfinished SVGs, templates, and other invalid links', async () => {
		const rows = query([{ _id: 'one', name: 'Holiday', date: new Date('2026-03-08T05:00:00Z') }]);
		vi.mocked(Holiday.find).mockReturnValue(rows as unknown as ReturnType<typeof Holiday.find>);
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const definition = {
				...blankSlide(),
				elements: [
					{ ...element(), repeater: { template: { width: 0 } } },
					newElement('svg', 'unfinished'),
					{ ...element(), id: 'bad', dataSource: { ...source(), model: 'User' } }
				]
			};
			expect(() => validateSlide(definition)).toThrow();
			const result = await previewSlideData(definition, now);
			expect(result.data.state).toBe('ready');
			expect(result.data.items[0].label).toBe('Holiday');
			expect(result.bad.state).toBe('error');
			expect(result.bad.message).toContain('supported business model');
			expect(result).not.toHaveProperty('unfinished');
		} finally {
			log.mockRestore();
		}
	});
	it('bounds and validates the preview envelope before querying persistence', async () => {
		await expect(previewSlideData({ elements: [element(), element()] })).rejects.toThrow('unique');
		await expect(previewSlideData({ elements: Array(101).fill(element()) })).rejects.toThrow('100');
		await expect(previewSlideData(null)).rejects.toThrow('slide');
		expect(Holiday.find).not.toHaveBeenCalled();
	});
	it('executes query components and returns only configured display values', async () => {
		const rows = query([
			{
				_id: 'one',
				name: ' Spring holiday ',
				date: new Date('2026-03-08T05:00:00Z'),
				secret: 'PRIVATE'
			}
		]);
		vi.mocked(Holiday.find).mockReturnValue(rows as unknown as ReturnType<typeof Holiday.find>);
		const result = await createSlideDataResolver(now)({ ...blankSlide(), elements: [element()] });
		expect(result.data).toMatchObject({
			state: 'ready',
			items: [{ label: 'Spring holiday', detail: 'Mar 8, 2026' }]
		});
		expect(JSON.stringify(result)).not.toContain('PRIVATE');
		expect(Holiday.find).toHaveBeenCalledWith({
			date: { $gte: new Date('2026-03-07T05:00:00Z'), $lt: new Date('2026-03-09T04:00:00Z') }
		});
		expect(rows.select).toHaveBeenCalledWith('name date');
		expect(rows.sort).toHaveBeenCalledWith({ date: 1, _id: 1 });
		expect(rows.skip).toHaveBeenCalledWith(0);
		expect(rows.limit).toHaveBeenCalledWith(5);
		expect(rows.maxTimeMS).toHaveBeenCalledWith(4000);
	});
	it('queries another model with arbitrary filters and number formatting', async () => {
		const rows = query([{ _id: 'customer', name: 'Example', total: 1234 }]);
		vi.mocked(Customer.find).mockReturnValue(rows as unknown as ReturnType<typeof Customer.find>);
		const item = element();
		item.dataSource = {
			...source(),
			model: 'Customer',
			filter: '{"total":{"$gte":100}}',
			select: 'name total',
			sort: '{"total":-1}',
			skip: 2,
			limit: 10,
			detailField: 'total',
			detailFormat: 'number'
		} as typeof item.dataSource;
		const result = await createSlideDataResolver(now)({ ...blankSlide(), elements: [item] });
		expect(result.data.items[0]).toMatchObject({ label: 'Example', detail: '1,234' });
		expect(Customer.find).toHaveBeenCalledWith({ total: { $gte: 100 } });
		expect(rows.skip).toHaveBeenCalledWith(2);
	});
	it('deduplicates within a response and queries again on the next request', async () => {
		vi.mocked(Holiday.find).mockReturnValue(
			query([]) as unknown as ReturnType<typeof Holiday.find>
		);
		const definition = { ...blankSlide(), elements: [element(), { ...element(), id: 'second' }] };
		const resolve = createSlideDataResolver(now);
		expect((await resolve(definition)).data).toMatchObject({
			state: 'empty',
			message: 'No matching records.'
		});
		await resolve(definition);
		expect(Holiday.find).toHaveBeenCalledOnce();
		await createSlideDataResolver(now)(definition);
		expect(Holiday.find).toHaveBeenCalledTimes(2);
	});
	it('keeps query errors off monitors and includes diagnostics in admin preview', async () => {
		const rows = query([]);
		rows.lean.mockRejectedValue(new Error('query failed'));
		vi.mocked(Holiday.find).mockReturnValue(rows as unknown as ReturnType<typeof Holiday.find>);
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const definition = { ...blankSlide(), elements: [element()] };
			expect((await createSlideDataResolver(now)(definition)).data).toEqual({
				state: 'error',
				items: [],
				message: 'Data is temporarily unavailable.'
			});
			expect((await createSlideDataResolver(now, true)(definition)).data.message).toBe(
				'query failed'
			);
		} finally {
			log.mockRestore();
		}
	});
	it('rejects invalid components, executable queries, and prototype keys', () => {
		for (const change of [
			{ model: 'User' },
			{ model: 'UserPasswordReset' },
			{ filter: '[]' },
			{ filter: '{"$where":"run()"}' },
			{ filter: '{"$expr":{"$function":{}}}' },
			{ filter: '{"__proto__":{}}' },
			{ filter: '{"date":{"$date":"bad"}}' },
			{ sort: '{"date":0}' },
			{ select: '+passwordHash' },
			{ select: '' },
			{ labelField: 'missing' },
			{ limit: 101 },
			{ limit: 1.5 },
			{ skip: -1 },
			{ timeZone: 'invalid' }
		])
			expect(() => validateDataSource({ ...source(), ...change })).toThrow();
		const slide = validateSlide({
			...blankSlide(),
			elements: [{ ...element(), data: { secret: 'PRIVATE' } }]
		});
		expect(JSON.stringify(slide)).not.toContain('PRIVATE');
	});
	it('rejects unknown and non-display schema fields before executing the query', async () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const item = element();
			item.dataSource.select = 'name date passwordHash';
			const result = await createSlideDataResolver(
				now,
				true
			)({ ...blankSlide(), elements: [item] });
			expect(result.data.message).toContain('Unavailable field');
			expect(Holiday.find).not.toHaveBeenCalled();
		} finally {
			log.mockRestore();
		}
	});
	it('upgrades saved holiday sources to generic query components', () => {
		expect(
			validateDataSource({
				source: 'upcoming-holidays',
				daysAhead: 30,
				limit: 5,
				timeZone: 'America/New_York'
			})
		).toMatchObject({
			model: 'Holiday',
			select: 'name date',
			labelField: 'name',
			detailField: 'date'
		});
	});
	it('resolves today across DST and now relative to request time', () => {
		expect(resolveDates({ $date: 'today+2d' }, now, 'America/New_York')).toEqual(
			new Date('2026-03-09T04:00:00Z')
		);
		expect(resolveDates({ $date: 'now-1d' }, now, 'America/New_York')).toEqual(
			new Date('2026-03-07T04:30:00Z')
		);
	});
	it('does not query for static slides', async () => {
		expect(await createSlideDataResolver(now)(blankSlide())).toEqual({});
		expect(Holiday.find).not.toHaveBeenCalled();
	});
});
