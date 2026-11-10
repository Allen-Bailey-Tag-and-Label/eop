import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { ShippingQuote } from '../mongoose/models/ShippingQuote';
import { getSettings } from '../mongoose/getSettings';
import { getColumns } from '../mongoose/getColumns';
import { loadShippingQuoteFinder, shippingFinderPipeline } from './finder';
import type { Settings } from '../mongoose/types';
vi.mock('../mongoose/connect', () => ({ connect: vi.fn(async () => {}) }));
vi.mock('../mongoose/getSettings', () => ({ getSettings: vi.fn() }));
vi.mock('../mongoose/getColumns', () => ({ getColumns: vi.fn() }));
vi.mock('../mongoose/models/ShippingQuote', () => ({ ShippingQuote: { aggregate: vi.fn() } }));
vi.mock('../mongoose/models/UpsQuote', () => ({ UpsQuote: { collection: { name: 'upsquotes' } } }));
vi.mock('../mongoose/models/Branch', () => ({ Branch: { collection: { name: 'branches' } } }));
vi.mock('../mongoose/models/User', () => ({ User: { collection: { name: 'users' } } }));
let settings: Settings;
const input = {
	url: new URL('https://eop.example/shipping/quote-finder'),
	locals: { user: { _id: 'a'.repeat(24) } }
};
beforeEach(() => {
	vi.clearAllMocks();
	settings = {
		_routeId: 'b'.repeat(24),
		columnsOrder: [],
		currentPage: 1,
		filter: [],
		isPaginateable: true,
		rowsPerPage: 10,
		sortDirection: 'desc',
		sortKey: 'createdAt'
	};
	vi.mocked(getSettings).mockImplementation(async () => settings);
	vi.mocked(getColumns).mockResolvedValue([
		'number',
		'_branchId',
		'_createdById',
		'createdAt',
		'updatedAt'
	]);
	vi.mocked(ShippingQuote.aggregate).mockResolvedValue([
		{
			rows: [
				{
					_id: new Types.ObjectId(),
					number: '123',
					request: { services: 'UPS', shipTo: { city: 'Caledonia' } },
					createdAt: new Date('2026-11-10')
				}
			],
			count: [{ total: 40 }]
		}
	]);
});
describe('shipping MongooseTable finder', () => {
	it('returns the standard table contract and paginates combined new and legacy records', async () => {
		const data = await loadShippingQuoteFinder(input as never);
		expect(await data.rows).toMatchObject([
			{ number: '123', createdAt: '2026-11-10T00:00:00.000Z' }
		]);
		expect(await data.totalRows).toBe(40);
		expect(data.settings).toBe(settings);
		expect(data.columns).toContainEqual(
			expect.objectContaining({ key: 'request.shipTo.city', label: 'City' })
		);
		const pipeline = vi.mocked(ShippingQuote.aggregate).mock.calls[0][0]!;
		expect(pipeline[1]).toHaveProperty('$unionWith.coll', 'upsquotes');
		expect(pipeline[2]).toEqual({ $match: {} });
		expect(pipeline.at(-1)).toHaveProperty('$facet.rows', [
			{ $sort: { createdAt: -1, _id: -1 } },
			{ $skip: 10 },
			{ $limit: 10 }
		]);
		expect(pipeline.at(-1)).toHaveProperty('$facet.count', [{ $count: 'total' }]);
	});
	it('filters after normalization, including literal text, dates, and referenced branches', async () => {
		settings.filter = [
			{ key: 'request.shipTo.city', operator: 'contains', value: 'Main.*', options: [] },
			{ key: '_branchId', operator: 'equals', value: 'c'.repeat(24), options: [] },
			{ key: 'createdAt', operator: 'greater than', value: '2026-11-01', options: [] },
			{ key: 'requestKey', operator: 'contains', value: 'private', options: [] }
		];
		await loadShippingQuoteFinder(input as never);
		const stage = vi.mocked(ShippingQuote.aggregate).mock.calls[0][0]![2] as {
			$match: { $and: Record<string, unknown>[] };
		};
		expect(stage.$match.$and).toEqual([
			{ 'request.shipTo.city': { $regex: /Main\.\*/i } },
			{ _branchId: { $eq: new Types.ObjectId('c'.repeat(24)) } },
			{ createdAt: { $gt: new Date('2026-11-01') } }
		]);
	});
	it('normalizes legacy address arrays, numeric ZIPs and missing dates without exposing request IDs', () => {
		const pipeline = shippingFinderPipeline();
		expect(pipeline[0]).toHaveProperty(
			'$project',
			expect.objectContaining({ request: 1, number: 1, _createdById: 1 })
		);
		expect(pipeline[0]).not.toHaveProperty('$project.requestKey');
		const legacy = JSON.stringify(pipeline[1]);
		expect(legacy).toContain('"$reduce"');
		expect(legacy).toContain('"to":"date"');
		expect(legacy).toContain('"zip":{"$convert":{"input":"$shipTo.PostalCode","to":"string"');
	});
	it.each([
		['_branchId', 'branches', 'number'],
		['_createdById', 'users', 'username']
	])('sorts %s using the same labels shown by the table', async (key, collection, label) => {
		settings.sortKey = key;
		await loadShippingQuoteFinder(input as never);
		const pipeline = vi.mocked(ShippingQuote.aggregate).mock.calls[0][0]!;
		expect(pipeline.at(-1)).toHaveProperty('$facet.rows.0.$lookup', {
			from: collection,
			localField: key,
			foreignField: '_id',
			as: '__finderRef'
		});
		expect(JSON.stringify(pipeline.at(-1))).toContain(`$__finderRef.${label}`);
	});
	it('honors saved column order and supports disabling pagination without disabling filters', async () => {
		settings.columnsOrder = ['request.shipTo.city', 'number'];
		settings.isPaginateable = false;
		settings.sortKey = 'invalid-key';
		const data = await loadShippingQuoteFinder(input as never);
		expect(data.columns.slice(0, 2)).toEqual([
			expect.objectContaining({ key: 'request.shipTo.city' }),
			'number'
		]);
		expect(data.settings.sortKey).toBe('createdAt');
		const pipeline = vi.mocked(ShippingQuote.aggregate).mock.calls[0][0]!;
		expect(JSON.stringify(pipeline.at(-1))).not.toContain('$skip');
		expect(JSON.stringify(pipeline.at(-1))).not.toContain('$limit');
	});
});
