import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { advanceShippingQuote } from './progress';
import { ShippingQuote, type ShippingQuoteRecord } from '../mongoose/models/ShippingQuote';
import { collectRates, shippingQuoteView } from './quotes';
import { validateShippingDestination } from './addresses';
import { blankRequest } from '$lib/shipping/types';
import { getMarkupConfigs } from './markups';
import { ShippingError } from '$lib/shipping/validation';

vi.mock('../mongoose/models/ShippingQuote', () => ({
	ShippingQuote: { findOne: vi.fn(), findOneAndUpdate: vi.fn(), updateOne: vi.fn() }
}));
vi.mock('./markups', () => ({ getMarkupConfigs: vi.fn() }));
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
	vi.mocked(getMarkupConfigs).mockResolvedValue(row.pricing!);
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
	it('rejects a stale batch snapshot when another request has already completed its selected rows', async () => {
		row.request.services = 'UPS';
		row.generation!.validation = 'skipped';
		row.generation!.tasks = Array.from({ length: 4 }, (_, index) => ({
			service: 'UPS',
			label: `Row ${index}`,
			status: 'pending',
			message: ''
		}));
		const old = snapshot();
		row.generation!.tasks = row.generation!.tasks.map((task, index) =>
			index < 3 ? { ...task, status: 'complete' } : task
		);
		model.findOne.mockReturnValueOnce({ lean: async () => old });
		await advanceShippingQuote({ quote: '1502' });
		expect(collectRates).not.toHaveBeenCalled();
		expect(row.generation!.tasks.slice(0, 3).every((task) => task.status === 'complete')).toBe(
			true
		);
	});
	it('finalizes saved results after an expired lease without repeating carrier requests', async () => {
		row.generation!.validation = 'skipped';
		row.generation!.rates = 'running';
		row.generation!.leaseUntil = new Date(0);
		row.generation!.tasks = row.generation!.tasks.map((task) => ({
			...task,
			status: 'complete',
			attempt: { service: task.service, status: 'success', message: '' }
		}));
		expect((await advanceShippingQuote({ quote: '1502' })).generation!.rates).toBe('complete');
		expect(collectRates).not.toHaveBeenCalled();
		expect(row.generation!.leaseUntil).toBeUndefined();
	});
	it('starts UPS and LTL together and persists the first response while the other is still running', async () => {
		row.generation!.validation = 'skipped';
		const releases = new Map<string, (result: Awaited<ReturnType<typeof collectRates>>) => void>();
		vi.mocked(collectRates).mockImplementation(
			(request) =>
				new Promise((resolve) => {
					releases.set(request.services, resolve);
				})
		);
		const work = advanceShippingQuote({ quote: '1502' });
		await vi.waitFor(() => expect(releases.size).toBe(2));
		expect(row.generation!.tasks.map((task) => task.status)).toEqual(['running', 'running']);
		const result = (service: 'UPS' | 'LTL'): Awaited<ReturnType<typeof collectRates>> => ({
			rates: [{ service, priceCents: 2000 } as never],
			attempts: [{ service, status: 'success', message: '' }],
			upsScenarios: [],
			ltlScenarios: []
		});
		releases.get('UPS')!(result('UPS'));
		await vi.waitFor(() => expect(row.rates).toHaveLength(1));
		const partial = await advanceShippingQuote({ quote: '1502', poll: true });
		expect(partial.generation!.tasks.map((task) => task.status)).toEqual(['complete', 'running']);
		releases.get('LTL')!(result('LTL'));
		expect((await work).rates).toHaveLength(2);
		expect(row.generation!.rates).toBe('complete');
	});
	it('loads pricing after navigation and reuses the persisted snapshot for both carriers', async () => {
		row.pricing = undefined;
		await advanceShippingQuote({ quote: '1502' });
		expect(row.pricing).toHaveLength(2);
		await advanceShippingQuote({ quote: '1502' });
		expect(getMarkupConfigs).toHaveBeenCalledOnce();
		for (const [, pricing] of vi.mocked(collectRates).mock.calls)
			expect(pricing).toEqual(row.pricing);
	});
	it('leaves failed progress writes recoverable without marking unsaved prices complete', async () => {
		row.generation!.validation = 'skipped';
		model.updateOne.mockRejectedValueOnce(new Error('database unavailable'));
		await expect(advanceShippingQuote({ quote: '1502' })).rejects.toThrow('database unavailable');
		expect(row.rates).toHaveLength(0);
		expect(row.generation!.tasks.map((task) => task.status)).toEqual(['running', 'running']);
		row.generation!.leaseUntil = new Date(0);
		expect((await advanceShippingQuote({ quote: '1502' })).rates).toHaveLength(2);
	});
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
		expect(partial.rates).toHaveLength(2);
		expect(partial.generation?.tasks.map((task) => task.status)).toEqual(['complete', 'complete']);
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
		const original = vi.mocked(collectRates).getMockImplementation()!;
		let fail = true;
		vi.mocked(collectRates).mockImplementation(async (request, pricing) =>
			request.services === 'LTL' && fail
				? {
						rates: [],
						attempts: [{ service: 'LTL', status: 'error', message: 'Unavailable' }],
						upsScenarios: [],
						ltlScenarios: []
					}
				: original(request, pricing)
		);
		const failed = await advanceShippingQuote({ quote: '1502' });
		expect(failed.generation?.rates).toBe('failed');
		expect(failed.rates).toHaveLength(1);
		await advanceShippingQuote({ quote: '1502' });
		expect(collectRates).toHaveBeenCalledTimes(2);
		fail = false;
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
		await vi.waitFor(() => expect(collectRates).toHaveBeenCalledTimes(2));
		expect((await advanceShippingQuote({ quote: '1502' })).generation?.rates).toBe('running');
		expect(collectRates).toHaveBeenCalledTimes(2);
		row.generation!.leaseUntil = new Date(0);
		await advanceShippingQuote({ quote: '1502' });
		release({
			rates: [],
			attempts: [{ service: 'UPS', status: 'error', message: 'Old result' }],
			upsScenarios: [],
			ltlScenarios: []
		});
		await first;
		expect(row.rates).toHaveLength(2);
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
