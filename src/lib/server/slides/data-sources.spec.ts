import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { Holiday } from '../mongoose/models/Holiday';
import { createSlideDataResolver } from './data-sources';
import { blankSlide, newElement } from '$lib/slides/types';
import { validateDataSource, validateSlide } from '$lib/slides/validation';

vi.mock('../mongoose/models/Holiday', () => ({ Holiday: { find: vi.fn() } }));
const now = new Date('2026-03-08T04:30:00Z'); // March 7 in New York, just before the DST change.
const element = () => newElement('list', 'calendar');
const query = (rows: unknown[]) => ({
	select: vi.fn().mockReturnThis(),
	sort: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	maxTimeMS: vi.fn().mockReturnThis(),
	lean: vi.fn().mockResolvedValue(rows)
});
beforeEach(() => vi.resetAllMocks());

describe('slide data sources', () => {
	it('queries the selected business-calendar window with sorted, bounded, display-safe results', async () => {
		const rows = query([
			{
				_id: new Types.ObjectId(),
				name: ' Spring holiday ',
				date: new Date('2026-03-08T05:00:00Z'),
				secret: 'PRIVATE'
			}
		]);
		vi.mocked(Holiday.find).mockReturnValue(rows as unknown as ReturnType<typeof Holiday.find>);
		const list = element();
		list.dataSource!.daysAhead = 2;
		const result = await createSlideDataResolver(now)({ ...blankSlide(), elements: [list] });
		expect(result.calendar).toMatchObject({
			state: 'ready',
			items: [{ label: 'Spring holiday', detail: 'Mar 8, 2026' }]
		});
		expect(JSON.stringify(result)).not.toContain('PRIVATE');
		const calls = vi.mocked(Holiday.find).mock.calls as unknown as [unknown][];
		const filter = JSON.stringify(calls[0][0]);
		expect(filter).toContain('2026-03-07');
		expect(filter).toContain('2026-03-09');
		expect(filter).toContain('America/New_York');
		expect(rows.select).toHaveBeenCalledWith('date name');
		expect(rows.sort).toHaveBeenCalledWith({ date: 1, _id: 1 });
		expect(rows.limit).toHaveBeenCalledWith(5);
		expect(rows.maxTimeMS).toHaveBeenCalledWith(4000);
	});
	it('shares identical queries within one response and queries again for the next render', async () => {
		vi.mocked(Holiday.find).mockReturnValue(
			query([]) as unknown as ReturnType<typeof Holiday.find>
		);
		const definition = { ...blankSlide(), elements: [element(), { ...element(), id: 'second' }] };
		const resolve = createSlideDataResolver(now);
		expect((await resolve(definition)).calendar.state).toBe('empty');
		await resolve(definition);
		expect(Holiday.find).toHaveBeenCalledOnce();
		await createSlideDataResolver(now)(definition);
		expect(Holiday.find).toHaveBeenCalledTimes(2);
	});
	it('supports older unnamed holidays and shows a safe message when persistence fails', async () => {
		const rows = query([{ _id: new Types.ObjectId(), date: new Date('2026-03-08T05:00:00Z') }]);
		vi.mocked(Holiday.find).mockReturnValue(rows as unknown as ReturnType<typeof Holiday.find>);
		const definition = { ...blankSlide(), elements: [element()] };
		expect((await createSlideDataResolver(now)(definition)).calendar.items[0].label).toBe(
			'Holiday'
		);
		rows.lean.mockRejectedValueOnce(new Error('PRIVATE database error'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const result = await createSlideDataResolver(now)(definition);
			expect(result.calendar).toMatchObject({ state: 'error', items: [] });
			expect(JSON.stringify(result)).not.toContain('PRIVATE');
		} finally {
			log.mockRestore();
		}
	});
	it('validates source names, limits, and time zones and strips queries and supplied results', () => {
		const source = element().dataSource!;
		for (const change of [
			{ source: 'User' },
			{ source: { $ne: null } },
			{ daysAhead: 0 },
			{ daysAhead: 366 },
			{ daysAhead: 1.5 },
			{ limit: 21 },
			{ limit: Infinity },
			{ timeZone: 'invalid-zone' }
		])
			expect(() => validateDataSource({ ...source, ...change })).toThrow();
		const slide = validateSlide({
			...blankSlide(),
			elements: [
				{
					...element(),
					dataSource: { ...source, query: { $where: 'run()' } },
					data: { secret: 'PRIVATE' }
				}
			]
		});
		expect(slide.elements[0].dataSource).toEqual(source);
		expect(JSON.stringify(slide)).not.toContain('PRIVATE');
		expect(JSON.stringify(slide)).not.toContain('$where');
		expect(() =>
			validateSlide({ ...blankSlide(), elements: [{ ...element(), dataSource: undefined }] })
		).toThrow();
	});
	it('does not query persistence for static slides', async () => {
		expect(await createSlideDataResolver(now)(blankSlide())).toEqual({});
		expect(Holiday.find).not.toHaveBeenCalled();
	});
});
