import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blankRequest, type CarrierRate } from '$lib/shipping/types';
import { collectRates, createShippingQuote, findShippingQuote, listShippingQuotes } from './quotes';
import { getMarkupConfigs } from './markups';
import { getUpsShippingRates } from './ups';
import { ShippingQuote, ShippingQuoteSequence } from '../mongoose/models/ShippingQuote';
import { UpsQuote } from '../mongoose/models/UpsQuote';
vi.mock('./markups', () => ({ getMarkupConfigs: vi.fn() }));
vi.mock('./ups', () => ({ getUpsShippingRates: vi.fn() }));
vi.mock('../mongoose/models/ShippingQuote', () => ({
	ShippingQuote: {
		findOne: vi.fn(),
		create: vi.fn(),
		aggregate: vi.fn(),
		init: vi.fn(async () => {})
	},
	ShippingQuoteSequence: { findOneAndUpdate: vi.fn() }
}));
vi.mock('../mongoose/models/UpsQuote', () => ({
	UpsQuote: { findOne: vi.fn(), collection: { name: 'upsquotes' } }
}));
const rate: CarrierRate = {
	service: 'UPS',
	provider: 'UPS',
	carrier: 'UPS',
	code: '03',
	description: 'Ground',
	currency: 'USD',
	costCents: 10000,
	rateBasis: 'published'
};
const query = (value: unknown) => ({ select: () => query(value), lean: async () => value });
beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(getMarkupConfigs).mockResolvedValue([
		{ service: 'UPS', revision: 0, ranges: [] },
		{ service: 'LTL', revision: 0, ranges: [] }
	]);
	vi.mocked(getUpsShippingRates).mockResolvedValue([rate]);
	vi.mocked(ShippingQuote.findOne).mockReturnValue(query(null) as never);
	vi.mocked(ShippingQuoteSequence.findOneAndUpdate).mockReturnValue(query({ value: 1 }) as never);
	vi.mocked(ShippingQuote.create).mockResolvedValue({} as never);
});
describe('shipping quote persistence', () => {
	it('keeps successful UPS rates when LTL is not configured and does not quote unselected services', async () => {
		const request = { ...blankRequest('2026-11-10'), services: 'Both' as const };
		const result = await collectRates(request);
		expect(result.rates[0]).toMatchObject({
			costCents: 10000,
			priceCents: 10000,
			markup: { percentBps: 0 }
		});
		expect(result.attempts).toEqual([
			expect.objectContaining({ service: 'UPS', status: 'success' }),
			expect.objectContaining({ service: 'LTL', status: 'not-configured' })
		]);
		vi.mocked(getUpsShippingRates).mockClear();
		expect((await collectRates({ ...request, services: 'LTL' })).rates).toEqual([]);
		expect(getUpsShippingRates).not.toHaveBeenCalled();
	});
	it('records provider failures without leaking tokens or claiming zero-dollar rates', async () => {
		vi.mocked(getUpsShippingRates).mockRejectedValue(new Error('private-token'));
		const result = await collectRates(blankRequest('2026-11-10'));
		expect(result.rates).toEqual([]);
		expect(result.attempts[0].status).toBe('error');
		expect(JSON.stringify(result)).not.toContain('private-token');
	});
	it('saves the exact pricing snapshot under a prefixed number and returns existing submissions without rating again', async () => {
		const request = blankRequest('2026-11-10'),
			requestId = crypto.randomUUID();
		request.branchId = 'a'.repeat(24);
		expect(await createShippingQuote(request, requestId, 'user')).toBe('S-000001');
		expect(ShippingQuote.create).toHaveBeenCalledWith(
			expect.objectContaining({
				number: 'S-000001',
				requestKey: `user:${requestId}`,
				request,
				rates: [
					expect.objectContaining({
						costCents: 10000,
						priceCents: 10000,
						markup: expect.objectContaining({ revision: 0, percentBps: 0 })
					})
				]
			})
		);
		vi.mocked(ShippingQuote.findOne).mockReturnValue(query({ number: 'S-000001' }) as never);
		expect(await createShippingQuote(request, requestId, 'user')).toBe('S-000001');
		expect(getUpsShippingRates).toHaveBeenCalledOnce();
	});
	it('uses the saved result after a concurrent duplicate submission and never overwrites it', async () => {
		vi.mocked(ShippingQuote.findOne)
			.mockReturnValueOnce(query(null) as never)
			.mockReturnValueOnce(query({ number: 'S-000099' }) as never);
		vi.mocked(ShippingQuote.create).mockRejectedValueOnce({ code: 11000 });
		expect(await createShippingQuote(blankRequest('2026-11-10'), crypto.randomUUID(), 'user')).toBe(
			'S-000099'
		);
		expect(ShippingQuote.create).toHaveBeenCalledOnce();
	});
	it('reads numeric legacy quotes without migrating them and routes new numbers to the new model', async () => {
		vi.mocked(UpsQuote.findOne).mockReturnValue(
			query({ quote: 123, rates: [{ description: 'Ground', rate: 30 }] }) as never
		);
		expect(await findShippingQuote('123')).toMatchObject({
			origin: 'legacy-ups',
			legacyRates: [{ priceCents: 3000 }]
		});
		expect(UpsQuote.findOne).toHaveBeenCalledWith({ quote: 123 });
		expect(ShippingQuote.findOne).not.toHaveBeenCalled();
		await findShippingQuote('S-000001');
		expect(ShippingQuote.findOne).toHaveBeenCalledWith({ number: 'S-000001' });
		expect(await findShippingQuote('{"$ne":null}')).toBeNull();
	});
	it('unions both collections before filtering, sorting and paginating quote history', async () => {
		vi.mocked(ShippingQuote.aggregate).mockResolvedValue([
			{
				rows: [
					{
						number: '123',
						origin: 'legacy-ups',
						createdAt: new Date('2025-01-01'),
						services: 'UPS',
						customer: '',
						reference: '',
						destination: 'Caledonia',
						status: 'Legacy'
					}
				],
				count: [{ total: 40 }]
			}
		]);
		const result = await listShippingQuotes(
			new URL('https://eop.example/shipping/quotes?q=Main.*&page=2')
		);
		expect(result).toMatchObject({
			page: 2,
			total: 40,
			quotes: [{ number: '123', createdAt: '2025-01-01T00:00:00.000Z' }]
		});
		const pipeline = vi.mocked(ShippingQuote.aggregate).mock.calls[0][0]!;
		expect(pipeline).toContainEqual(
			expect.objectContaining({ $unionWith: expect.objectContaining({ coll: 'upsquotes' }) })
		);
		expect(JSON.stringify(pipeline)).toContain('"to":"date"');
		expect(JSON.stringify(pipeline)).toContain('"to":"string","onError":"","onNull":""');
		expect(JSON.stringify(pipeline)).toContain('Main\\\\.\\\\*');
		expect(pipeline.at(-1)).toHaveProperty('$facet.rows', [
			{ $skip: 25 },
			{ $limit: 25 },
			{ $unset: '_id' }
		]);
	});
});
