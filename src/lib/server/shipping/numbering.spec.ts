import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blankRequest } from '$lib/shipping/types';

const models = vi.hoisted(() => ({
	ups: { findOne: vi.fn(), create: vi.fn(), init: vi.fn(async () => {}) },
	shipping: { aggregate: vi.fn(), findOne: vi.fn(), create: vi.fn(), init: vi.fn(async () => {}) },
	sequence: { findOneAndUpdate: vi.fn() },
	branch: { find: vi.fn(async () => []) }
}));
vi.mock('../mongoose/models/ShippingQuote', () => ({
	ShippingQuote: models.shipping,
	ShippingQuoteSequence: models.sequence
}));
vi.mock('../mongoose/models/UpsQuote', () => ({ UpsQuote: models.ups }));
vi.mock('../mongoose/models/Branch', () => ({ Branch: models.branch }));
vi.mock('$lib/ups', () => ({ getRates: vi.fn(), validateAddress: vi.fn() }));
vi.mock('$lib/server/mongoose/models', () => ({ UpsQuote: models.ups, Branch: models.branch }));
vi.mock('$lib/server/mongoose', () => ({ connect: vi.fn(async () => {}) }));
vi.mock('$app/forms', () => ({
	deserialize: () => ({
		type: 'success',
		data: [{ Service: { Code: '03' }, TotalCharges: { MonetaryValue: '10' } }]
	})
}));
vi.mock('./markups', () => ({
	getMarkupConfigs: async () => [
		{ service: 'UPS', revision: 0, ranges: [] },
		{ service: 'LTL', revision: 0, ranges: [] }
	]
}));
vi.mock('./ups', () => ({
	getUpsShippingRates: async () => [
		{
			service: 'UPS',
			provider: 'UPS',
			carrier: 'UPS',
			code: '03',
			description: 'Ground',
			currency: 'USD',
			costCents: 1000,
			rateBasis: 'published'
		}
	]
}));

let upsNumber: number | null;
let shippingNumbers: string[];
let reserved: number | undefined;
let initialized: boolean;
function query(value: unknown) {
	return { sort: () => query(value), select: () => query(value), lean: async () => value };
}
beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	upsNumber = 1500;
	shippingNumbers = [];
	reserved = undefined;
	initialized = false;
	models.ups.findOne.mockImplementation((filter?: { requestKey?: string }) =>
		query(filter?.requestKey || upsNumber === null ? null : { quote: upsNumber })
	);
	models.shipping.aggregate.mockImplementation(async () =>
		shippingNumbers.length
			? [{ value: Math.max(...shippingNumbers.map((number) => Number(number.replace(/^S-/, '')))) }]
			: []
	);
	models.shipping.findOne.mockImplementation(() => query(null));
	models.sequence.findOneAndUpdate.mockImplementation(
		(filter: { initialized?: boolean }, update: unknown, options: { upsert?: boolean }) => {
			if (!Array.isArray(update)) {
				if (
					!filter.initialized ||
					!initialized ||
					reserved === undefined ||
					reserved >= Number.MAX_SAFE_INTEGER
				)
					return query(null);
				reserved++;
				return query({ value: reserved });
			}
			if (reserved === Number.MAX_SAFE_INTEGER)
				return {
					lean: async () => {
						if (options.upsert) throw { code: 11000 };
						return null;
					}
				};
			const pipeline = update as [
				{ $set: { value: { $add: [{ $max: [unknown, number] }, number] } } }
			];
			const floor = pipeline[0].$set.value.$add[0].$max[1];
			reserved = Math.max(reserved ?? 0, floor) + 1;
			initialized = true;
			return query({ value: reserved });
		}
	);
	models.ups.create.mockImplementation(async (row: { quote: number }) => {
		upsNumber = Math.max(upsNumber ?? 0, row.quote);
		return row;
	});
	models.shipping.create.mockImplementation(async (row: { number: string }) => {
		shippingNumbers.push(row.number);
		return row;
	});
});

describe('shared shipping and UPS quote numbering', () => {
	it('increments an initialized counter without historical scans, including on a fresh server', async () => {
		reserved = 3000;
		initialized = true;
		const first = await import('./numbering');
		expect(await first.nextQuoteNumber()).toBe(3001);
		vi.resetModules();
		const second = await import('./numbering');
		expect(await second.nextQuoteNumber()).toBe(3002);
		expect(models.ups.findOne).not.toHaveBeenCalled();
		expect(models.shipping.aggregate).not.toHaveBeenCalled();
		expect(models.sequence.findOneAndUpdate).toHaveBeenCalledTimes(2);
	});
	it('starts at one without requiring an existing UPS quote', async () => {
		upsNumber = null;
		const { nextQuoteNumber } = await import('./numbering');
		expect(await nextQuoteNumber()).toBe(1);
	});
	it('starts above UPS, numeric shipping, and historical prefixed shipping numbers', async () => {
		shippingNumbers = ['S-000050', 'S-002500', '2000'];
		reserved = 30;
		const { nextQuoteNumber } = await import('./numbering');
		expect(await nextQuoteNumber()).toBe(2501);
		expect(models.shipping.aggregate).toHaveBeenCalledWith(
			expect.arrayContaining([
				{ $match: { number: { $regex: '^(S-)?[0-9]+$' } } },
				{ $group: { _id: null, value: { $max: '$value' } } }
			])
		);
		expect(JSON.stringify(models.shipping.aggregate.mock.calls[0])).toContain('"$replaceOne"');
		expect(shippingNumbers).toEqual(['S-000050', 'S-002500', '2000']);
	});
	it('never lowers or reuses the old counter value even when some reserved quotes were not saved', async () => {
		reserved = 3000;
		const { nextQuoteNumber } = await import('./numbering');
		expect(await nextQuoteNumber()).toBe(3001);
		expect(await nextQuoteNumber()).toBe(3002);
		expect(models.ups.findOne).toHaveBeenCalledOnce();
		expect(models.shipping.aggregate).toHaveBeenCalledOnce();
	});
	it('reserves unique consecutive numbers across concurrent calls and independently initialized servers', async () => {
		const first = await import('./numbering');
		vi.resetModules();
		const second = await import('./numbering');
		const numbers = await Promise.all(
			Array.from({ length: 40 }, (_, index) => (index % 2 ? first : second).nextQuoteNumber())
		);
		expect(new Set(numbers).size).toBe(40);
		expect([...numbers].sort((a, b) => a - b)).toEqual(
			Array.from({ length: 40 }, (_, index) => 1501 + index)
		);
		expect(models.sequence.findOneAndUpdate).toHaveBeenCalledWith(
			expect.objectContaining({ _id: 'shipping' }),
			expect.any(Array),
			{ upsert: true, new: true }
		);
	});
	it('retries a concurrent first insert using the existing counter', async () => {
		models.sequence.findOneAndUpdate
			.mockReturnValueOnce(query(null))
			.mockImplementationOnce(() => ({
				lean: async () => {
					reserved = 1501;
					throw { code: 11000 };
				}
			}));
		const { nextQuoteNumber } = await import('./numbering');
		expect(await nextQuoteNumber()).toBe(1502);
		expect(models.sequence.findOneAndUpdate.mock.calls[2][2]).toEqual({ upsert: false, new: true });
	});
	it('retries failed initialization and does not fall back to a potentially colliding number', async () => {
		models.ups.findOne.mockImplementationOnce(() => ({
			sort: () => ({
				select: () => ({
					lean: async () => {
						throw new Error('offline');
					}
				})
			})
		}));
		const { nextQuoteNumber } = await import('./numbering');
		await expect(nextQuoteNumber()).rejects.toThrow('offline');
		expect(models.sequence.findOneAndUpdate).toHaveBeenCalledOnce();
		expect(await nextQuoteNumber()).toBe(1501);
	});
	it('fails safely when the counter or historical numbers exhaust safe integer precision', async () => {
		reserved = Number.MAX_SAFE_INTEGER;
		const { nextQuoteNumber } = await import('./numbering');
		await expect(nextQuoteNumber()).rejects.toThrow('Could not allocate');
		expect(reserved).toBe(Number.MAX_SAFE_INTEGER);
		vi.resetModules();
		upsNumber = Number.MAX_SAFE_INTEGER;
		const nextServer = await import('./numbering');
		await expect(nextServer.nextQuoteNumber()).rejects.toThrow('numbering range');
	});
	it('uses a single sequence when actual UPS and shipping creation paths alternate', async () => {
		const { createPendingUpsQuote } = await import('../ups/quotes');
		const { createShippingQuote } = await import('./quotes');
		const createUps = () => {
			const fields = {
				requestId: crypto.randomUUID(),
				_branchId: 'a'.repeat(24),
				isValidated: 'false',
				shipFromAddress: '3177 Lehigh Street',
				shipFromZIP: '14423',
				shipFromCity: 'Caledonia',
				shipFromState: 'NY',
				shipToAddress: '123 Main Street',
				shipToZIP: '14423',
				shipToCity: 'Caledonia',
				shipToState: 'NY',
				packageInfoTotalPackages: '1',
				packageInfoTotalWeight: '10'
			};
			return createPendingUpsQuote(fields, {
				_id: 'b'.repeat(24),
				branches: [{ _id: 'a'.repeat(24) }]
			} as App.Locals['user']);
		};
		await expect(createUps()).resolves.toBe(1501);
		const request = blankRequest('2026-11-10');
		request.branchId = 'a'.repeat(24);
		request.services = 'Both';
		expect(await createShippingQuote(request, crypto.randomUUID(), 'b'.repeat(24))).toBe('1502');
		await expect(createUps()).resolves.toBe(1503);
		expect(models.ups.create.mock.calls.map(([row]) => row.quote)).toEqual([1501, 1503]);
		expect(models.shipping.create).toHaveBeenCalledWith(
			expect.objectContaining({
				number: '1502',
				request: expect.objectContaining({ services: 'Both' })
			})
		);
		expect(models.sequence.findOneAndUpdate).toHaveBeenCalledTimes(4);
	});
});
