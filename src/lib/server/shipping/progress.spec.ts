import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { advanceShippingQuote } from './progress';
import { ShippingQuote, type ShippingQuoteRecord } from '../mongoose/models/ShippingQuote';
import { collectRates, shippingQuoteView } from './quotes';
import { validateShippingDestination } from './addresses';
import { blankRequest } from '$lib/shipping/types';
import { ShippingError } from '$lib/shipping/validation';

vi.mock('../mongoose/models/ShippingQuote', () => ({
	ShippingQuote: { findOne: vi.fn(), findOneAndUpdate: vi.fn(), updateOne: vi.fn() }
}));
vi.mock('./addresses', () => ({ validateShippingDestination: vi.fn() }));
vi.mock('./quotes', async (original) => ({
	...(await original<typeof import('./quotes')>()),
	collectRates: vi.fn(),
	findShippingQuote: vi.fn(async () => shippingQuoteView(row))
}));

let row: ShippingQuoteRecord & { _id: string };
const model = ShippingQuote as unknown as Record<
	'findOne' | 'findOneAndUpdate' | 'updateOne',
	ReturnType<typeof vi.fn>
>;
function at(object: unknown, key: string): unknown {
	return key
		.split('.')
		.reduce(
			(value, part) => (value && typeof value === 'object' ? Reflect.get(value, part) : undefined),
			object
		);
}
function apply(update: { $set?: Record<string, unknown>; $unset?: Record<string, unknown> }) {
	for (const [key, value] of Object.entries(update.$set ?? {})) {
		const parts = key.split('.');
		const target = parts.length > 1 ? at(row, parts.slice(0, -1).join('.')) : row;
		Reflect.set(target as object, parts.at(-1)!, value);
	}
	for (const key of Object.keys(update.$unset ?? {})) {
		const parts = key.split('.');
		Reflect.deleteProperty(at(row, parts.slice(0, -1).join('.')) as object, parts.at(-1)!);
	}
}
const snapshot = () => ({
	...row,
	generation: structuredClone(row.generation),
	request: structuredClone(row.request),
	rates: [...row.rates]
});
beforeEach(() => {
	vi.clearAllMocks();
	row = {
		_id: 'record',
		number: '1502',
		requestKey: 'key',
		_createdById: new Types.ObjectId() as never,
		_branchId: new Types.ObjectId() as never,
		createdAt: new Date(),
		request: { ...blankRequest('2026-11-12'), services: 'Both', validateAddresses: true },
		rates: [],
		attempts: [],
		pricing: [
			{ service: 'UPS', revision: 7, ranges: [] },
			{ service: 'LTL', revision: 3, ranges: [] }
		],
		generation: {
			validation: 'pending',
			rates: 'pending',
			message: '',
			tasks: ['UPS', 'LTL'].map((service) => ({
				service: service as 'UPS' | 'LTL',
				label: 'Shipment',
				status: 'pending',
				message: ''
			}))
		}
	};
	model.findOne.mockImplementation(() => ({ lean: async () => snapshot() }) as never);
	model.findOneAndUpdate.mockImplementation(
		(filter: Record<string, unknown>, update: Parameters<typeof apply>[0]) =>
			({
				lean: async () => {
					if (row.generation?.leaseUntil && row.generation.leaseUntil > new Date()) return null;
					for (const [key, value] of Object.entries(filter))
						if (key.startsWith('generation.') && at(row, key) !== value) return null;
					apply(update as never);
					return snapshot();
				}
			}) as never
	);
	model.updateOne.mockImplementation(
		async (filter: Record<string, unknown>, update: Parameters<typeof apply>[0]) => {
			if (filter['generation.attemptId'] !== row.generation?.attemptId)
				return { matchedCount: 0 } as never;
			apply(update as never);
			return { matchedCount: 1 } as never;
		}
	);
	vi.mocked(validateShippingDestination).mockImplementation(async (request) => ({
		...request,
		shipTo: { ...request.shipTo, city: 'Validated city' }
	}));
	vi.mocked(collectRates).mockImplementation(async (request) => ({
		rates: [
			{ service: request.services, code: '03', description: 'Ground', priceCents: 2500 } as never
		],
		attempts: [
			{ service: request.services as 'UPS' | 'LTL', status: 'success', message: 'Returned rates.' }
		],
		upsScenarios: [],
		ltlScenarios: []
	}));
});

describe('remote shipping quote generation', () => {
	it('rates quantity options independently without losing earlier rows or relabeling later options as row one', async () => {
		row.request.services = 'UPS';
		row.generation!.validation = 'skipped';
		row.request.upsScenarios = ['first', 'second'].map((id) => ({
			id,
			label: '',
			services: ['03'],
			weightMode: 'groups',
			packageGroups: [{ quantity: 1, weight: 10 }],
			packageTotalCount: 1,
			packageTotalWeight: 10,
			packageWeight: 10,
			status: 'pending',
			rates: [],
			unavailableServices: [],
			message: ''
		}));
		row.generation!.tasks = row.request.upsScenarios.map((scenario, index) => ({
			service: 'UPS',
			scenarioId: scenario.id,
			label: `Rate row ${index + 1}`,
			status: 'pending',
			message: ''
		}));
		vi.mocked(collectRates).mockImplementation(async (request) => {
			expect(request.upsScenarios).toHaveLength(1);
			const scenario = request.upsScenarios![0];
			return {
				rates: [{ service: 'UPS', scenarioId: scenario.id, priceCents: 2500 } as never],
				attempts: [{ service: 'UPS', status: 'success', message: '' }],
				upsScenarios: [
					{
						...scenario,
						status: 'complete',
						rates: [{ description: 'Ground', rate: 25, serviceCode: '03' }]
					}
				],
				ltlScenarios: []
			};
		});
		await advanceShippingQuote({ quote: '1502' });
		const complete = await advanceShippingQuote({ quote: '1502' });
		expect(complete.rates.map((rate) => rate.scenarioId)).toEqual(['first', 'second']);
		expect(complete.request?.upsScenarios?.map((scenario) => scenario.status)).toEqual([
			'complete',
			'complete'
		]);
		expect(complete.request?.upsScenarios?.map((scenario) => scenario.label)).toEqual([
			'Rate row 1',
			'Rate row 2'
		]);
		expect(complete.generation?.rates).toBe('complete');
	});
	it('polls without carrier work, validates first, then persists each provider independently', async () => {
		expect((await advanceShippingQuote({ quote: '1502', poll: true })).generation?.validation).toBe(
			'pending'
		);
		expect(ShippingQuote.findOneAndUpdate).not.toHaveBeenCalled();
		expect(collectRates).not.toHaveBeenCalled();
		const validated = await advanceShippingQuote({ quote: '1502' });
		expect(validated.shipTo.city).toBe('Validated city');
		expect(validated.generation?.validation).toBe('complete');
		expect(collectRates).not.toHaveBeenCalled();
		const partial = await advanceShippingQuote({ quote: '1502' });
		expect(partial.rates).toHaveLength(1);
		expect(partial.generation?.tasks.map((task) => task.status)).toEqual(['complete', 'pending']);
		expect(collectRates).toHaveBeenCalledWith(
			expect.objectContaining({
				services: 'UPS',
				shipTo: expect.objectContaining({ city: 'Validated city' })
			}),
			row.pricing
		);
		const complete = await advanceShippingQuote({ quote: '1502' });
		expect(complete.generation?.rates).toBe('complete');
		expect(complete.rates).toHaveLength(2);
		expect(complete.attempts.map((attempt) => attempt.service)).toEqual(['UPS', 'LTL']);
		expect(JSON.stringify(complete)).not.toMatch(/leaseUntil|attemptId|pricing/);
		await advanceShippingQuote({ quote: '1502', retry: true });
		expect(collectRates).toHaveBeenCalledTimes(2);
	});
	it('keeps successful prices and retries only the failed provider', async () => {
		row.generation!.validation = 'skipped';
		await advanceShippingQuote({ quote: '1502' });
		vi.mocked(collectRates).mockResolvedValueOnce({
			rates: [],
			attempts: [{ service: 'LTL', status: 'error', message: 'Unavailable' }],
			upsScenarios: [],
			ltlScenarios: []
		});
		const failed = await advanceShippingQuote({ quote: '1502' });
		expect(failed.generation?.rates).toBe('failed');
		expect(failed.rates).toHaveLength(1);
		await advanceShippingQuote({ quote: '1502' });
		expect(collectRates).toHaveBeenCalledTimes(2);
		const recovered = await advanceShippingQuote({ quote: '1502', retry: true });
		expect(recovered.generation?.rates).toBe('complete');
		expect(recovered.rates).toHaveLength(2);
		expect(collectRates).toHaveBeenLastCalledWith(
			expect.objectContaining({ services: 'LTL' }),
			row.pricing
		);
	});
	it('does not duplicate work across pages and fences a stale request after lease recovery', async () => {
		row.generation!.validation = 'skipped';
		let release!: (value: Awaited<ReturnType<typeof collectRates>>) => void;
		vi.mocked(collectRates).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					release = resolve;
				})
		);
		const first = advanceShippingQuote({ quote: '1502' });
		await vi.waitFor(() => expect(collectRates).toHaveBeenCalledOnce());
		expect((await advanceShippingQuote({ quote: '1502' })).generation?.rates).toBe('running');
		expect(collectRates).toHaveBeenCalledOnce();
		row.generation!.leaseUntil = new Date(0);
		await advanceShippingQuote({ quote: '1502' });
		release({
			rates: [],
			attempts: [{ service: 'UPS', status: 'error', message: 'Old result' }],
			upsScenarios: [],
			ltlScenarios: []
		});
		await first;
		expect(row.rates).toHaveLength(1);
		expect(row.generation!.tasks[0].status).toBe('complete');
	});
	it('stops after failed validation and resumes only on explicit retry', async () => {
		vi.mocked(validateShippingDestination).mockRejectedValueOnce(
			new ShippingError('Check address.')
		);
		expect((await advanceShippingQuote({ quote: '1502' })).generation?.validation).toBe('failed');
		await advanceShippingQuote({ quote: '1502' });
		expect(validateShippingDestination).toHaveBeenCalledOnce();
		expect(collectRates).not.toHaveBeenCalled();
		expect(
			(await advanceShippingQuote({ quote: '1502', retry: true })).generation?.validation
		).toBe('complete');
		await expect(advanceShippingQuote({ quote: { $ne: null } })).rejects.toMatchObject({
			status: 400
		});
		await expect(advanceShippingQuote({ quote: '1502', poll: 'yes' })).rejects.toMatchObject({
			status: 400
		});
	});
});
