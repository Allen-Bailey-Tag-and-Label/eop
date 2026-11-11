import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blankRequest, type CarrierRate } from '$lib/shipping/types';
import { collectRates, createShippingQuote, findShippingQuote } from './quotes';
import { getMarkupConfigs } from './markups';
import { getUpsShippingRates } from './ups';
import { ShippingQuote } from '../mongoose/models/ShippingQuote';
import { UpsQuote } from '../mongoose/models/UpsQuote';
import { nextQuoteNumber } from './numbering';
import { Types } from 'mongoose';
import { validateShippingDestination } from './addresses';
import type { QuoteScenario } from '$lib/ups/quote';
vi.mock('./addresses', () => ({ validateShippingDestination: vi.fn() }));
vi.mock('./markups', () => ({ getMarkupConfigs: vi.fn() }));
vi.mock('./ups', () => ({ getUpsShippingRates: vi.fn() }));
vi.mock('./numbering', () => ({ nextQuoteNumber: vi.fn() }));
vi.mock('../mongoose/models/ShippingQuote', () => ({
	ShippingQuote: {
		findOne: vi.fn(),
		create: vi.fn(),
		aggregate: vi.fn(),
		init: vi.fn(async () => {})
	}
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
	vi.mocked(validateShippingDestination).mockImplementation(async (request) => request);
	vi.mocked(getMarkupConfigs).mockResolvedValue([
		{ service: 'UPS', revision: 0, ranges: [] },
		{ service: 'LTL', revision: 0, ranges: [] }
	]);
	vi.mocked(getUpsShippingRates).mockResolvedValue([rate]);
	vi.mocked(ShippingQuote.findOne).mockReturnValue(query(null) as never);
	vi.mocked(nextQuoteNumber).mockResolvedValue(1502);
	vi.mocked(ShippingQuote.create).mockResolvedValue({} as never);
});
describe('shipping quote persistence', () => {
	it('validates before pricing and persists the corrected address; failures do not allocate a quote', async () => {
		const request = { ...blankRequest('2026-11-11'), validateAddresses: true };
		const corrected = { ...request, shipTo: { ...request.shipFrom, residential: true } };
		vi.mocked(validateShippingDestination).mockResolvedValue(corrected);
		await createShippingQuote(request, crypto.randomUUID(), 'user');
		expect(getUpsShippingRates).toHaveBeenCalledWith(corrected);
		expect(ShippingQuote.create).toHaveBeenCalledWith(
			expect.objectContaining({ request: corrected })
		);
		vi.mocked(getUpsShippingRates).mockClear();
		vi.mocked(nextQuoteNumber).mockClear();
		vi.mocked(validateShippingDestination).mockRejectedValue(new Error('Validation failed'));
		await expect(createShippingQuote(request, crypto.randomUUID(), 'user')).rejects.toThrow(
			'Validation failed'
		);
		expect(getUpsShippingRates).not.toHaveBeenCalled();
		expect(nextQuoteNumber).not.toHaveBeenCalled();
	});
	it('prices shared UPS scenarios in parallel and preserves each row and selected services', async () => {
		const scenario = (label: string, quantity: number, services: string[]): QuoteScenario => ({
			id: crypto.randomUUID(),
			label,
			unitQuantity: quantity * 100,
			services,
			weightMode: 'groups',
			packageGroups: [{ quantity, weight: 10 }],
			packageTotalCount: quantity,
			packageTotalWeight: quantity * 10,
			packageWeight: 10,
			status: 'pending',
			rates: [],
			unavailableServices: [],
			message: ''
		});
		const request = {
			...blankRequest('2026-11-11'),
			upsScenarios: [scenario('Small run', 2, ['03']), scenario('Large run', 3, ['02'])]
		};
		let release!: (rates: CarrierRate[]) => void;
		vi.mocked(getUpsShippingRates)
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						release = resolve;
					})
			)
			.mockResolvedValueOnce([{ ...rate, code: '02' }]);
		const pending = collectRates(request);
		await Promise.resolve();
		await Promise.resolve();
		expect(getUpsShippingRates).toHaveBeenCalledTimes(2);
		release([rate, { ...rate, code: '02' }]);
		const result = await pending;
		expect(result.rates.map((row) => [row.scenarioLabel, row.code])).toEqual([
			['Small run', '03'],
			['Large run', '02']
		]);
		expect(result.upsScenarios.map((row) => row.status)).toEqual(['complete', 'complete']);
		expect(getUpsShippingRates).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ packages: [expect.objectContaining({ quantity: 3, weight: 10 })] })
		);
		vi.mocked(getUpsShippingRates)
			.mockRejectedValueOnce(new Error('private-token'))
			.mockResolvedValueOnce([{ ...rate, code: '02' }]);
		const partial = await collectRates(request);
		expect(partial.rates).toHaveLength(1);
		expect(partial.upsScenarios.map((row) => row.status)).toEqual(['failed', 'complete']);
		expect(JSON.stringify(partial)).not.toContain('private-token');
		await createShippingQuote(request, crypto.randomUUID(), 'user');
		expect(ShippingQuote.create).toHaveBeenLastCalledWith(
			expect.objectContaining({
				request: expect.objectContaining({
					upsScenarios: expect.arrayContaining([
						expect.objectContaining({ label: 'Small run', status: 'complete' })
					])
				})
			})
		);
	});
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
	it('saves the exact pricing snapshot under a shared numeric number and does not reserve again for a retry', async () => {
		const request = blankRequest('2026-11-10'),
			requestId = crypto.randomUUID();
		request.branchId = 'a'.repeat(24);
		expect(await createShippingQuote(request, requestId, 'user')).toBe('1502');
		expect(ShippingQuote.create).toHaveBeenCalledWith(
			expect.objectContaining({
				number: '1502',
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
		vi.mocked(ShippingQuote.findOne).mockReturnValue(query({ number: '1502' }) as never);
		expect(await createShippingQuote(request, requestId, 'user')).toBe('1502');
		expect(getUpsShippingRates).toHaveBeenCalledOnce();
		expect(nextQuoteNumber).toHaveBeenCalledOnce();
	});
	it('retains the prefixed number of a submission saved before the shared sequence', async () => {
		vi.mocked(ShippingQuote.findOne).mockReturnValue(query({ number: 'S-000007' }) as never);
		expect(await createShippingQuote(blankRequest('2026-11-10'), crypto.randomUUID(), 'user')).toBe(
			'S-000007'
		);
		expect(nextQuoteNumber).not.toHaveBeenCalled();
		expect(getUpsShippingRates).not.toHaveBeenCalled();
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
		expect(ShippingQuote.findOne).toHaveBeenCalledWith({ number: '123' });
		await findShippingQuote('S-000001');
		expect(ShippingQuote.findOne).toHaveBeenCalledWith({ number: 'S-000001' });
		expect(await findShippingQuote('{"$ne":null}')).toBeNull();
	});
	it('finds numeric shipping quotes before falling back to UPS and keeps historical prefixed URLs working', async () => {
		const request = blankRequest('2026-11-10');
		const row = {
			number: '1502',
			createdAt: new Date('2026-11-10'),
			_branchId: new Types.ObjectId(),
			request,
			rates: [],
			attempts: []
		};
		vi.mocked(ShippingQuote.findOne).mockReturnValue(query(row) as never);
		expect(await findShippingQuote('1502')).toMatchObject({ number: '1502', origin: 'shipping' });
		expect(UpsQuote.findOne).not.toHaveBeenCalled();
		expect(await findShippingQuote('001502')).toMatchObject({ number: '1502' });
		expect(ShippingQuote.findOne).toHaveBeenLastCalledWith({ number: '1502' });
		vi.mocked(ShippingQuote.findOne).mockReturnValue(
			query({ ...row, number: 'S-000007' }) as never
		);
		expect(await findShippingQuote('S-000007')).toMatchObject({
			number: 'S-000007',
			origin: 'shipping'
		});
		expect(await findShippingQuote('9007199254740992')).toBeNull();
	});
});
