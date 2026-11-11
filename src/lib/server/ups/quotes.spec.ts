import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import { UpsQuote } from '../mongoose/models/UpsQuote';
import { nextQuoteNumber } from '../shipping/numbering';
import { getRates, validateAddress } from '$lib/ups';
import { advancePendingUpsQuote, createPendingUpsQuote, findUpsQuote } from './quotes';
import type { UpsQuoteView } from '$lib/ups/quote';
vi.mock('../mongoose/models/UpsQuote', () => ({
	UpsQuote: {
		init: vi.fn(),
		findOne: vi.fn(),
		create: vi.fn(),
		findOneAndUpdate: vi.fn(),
		updateOne: vi.fn()
	}
}));
vi.mock('../mongoose/models/Branch', () => ({
	Branch: { findById: () => ({ select: () => ({ lean: async () => ({ number: 2046 }) }) }) }
}));
vi.mock('../shipping/numbering', () => ({ nextQuoteNumber: vi.fn() }));
vi.mock('$lib/ups', () => ({ getRates: vi.fn(), validateAddress: vi.fn() }));
const actor = { _id: 'a'.repeat(24), branches: [{ _id: 'b'.repeat(24) }] } as App.Locals['user'];
function input() {
	return {
		requestId: crypto.randomUUID(),
		_branchId: 'b'.repeat(24),
		isValidated: 'true',
		shipFromAddress: '3177 Lehigh Street',
		shipFromCity: 'Caledonia',
		shipFromState: 'NY',
		shipFromZIP: '14423',
		shipToAddress: '1 Main',
		shipToCity: 'Caledonia',
		shipToState: 'NY',
		shipToZIP: '14423',
		packageInfoTotalPackages: '2',
		packageInfoTotalWeight: '21'
	};
}
type Stored = Omit<UpsQuoteView, 'rates' | 'generation' | 'createdAt'> & {
	_id: string;
	createdAt: Date;
	requestKey: string;
	rates: unknown[];
	generation?: Record<string, unknown>;
	[key: string]: unknown;
};
type Update = { $set: Record<string, unknown>; $unset: Record<string, unknown> };
const model = UpsQuote as unknown as Record<
	'create' | 'findOne' | 'findOneAndUpdate' | 'updateOne',
	ReturnType<typeof vi.fn>
>;
let row: Stored | undefined;
function query(value: unknown) {
	return { select: () => query(value), lean: async () => value };
}
beforeEach(() => {
	vi.clearAllMocks();
	row = undefined;
	vi.mocked(nextQuoteNumber).mockResolvedValue(1234);
	model.findOne.mockImplementation(
		(filter: Record<string, unknown>) =>
			query(
				row && (filter.quote === row.quote || filter.requestKey === row.requestKey)
					? structuredClone(row)
					: null
			) as never
	);
	model.create.mockImplementation(async (value: Stored) => {
		row = {
			...(value as unknown as Stored),
			_id: new Types.ObjectId().toString(),
			createdAt: new Date()
		};
		return row as never;
	});
	model.findOneAndUpdate.mockImplementation((filter: Record<string, unknown>, update: Update) => {
		if (!row) return query(null) as never;
		const key = Object.keys(filter).find((key) => key.startsWith('generation.'))!;
		const step = key.split('.')[1];
		if (
			row.generation![step] !== filter[key] ||
			(row.generation!.leaseUntil instanceof Date && row.generation!.leaseUntil > new Date())
		)
			return query(null) as never;
		for (const [path, value] of Object.entries((update as Update).$set))
			row.generation![path.split('.')[1]] = value;
		return query(structuredClone(row)) as never;
	});
	model.updateOne.mockImplementation(async (filter: Record<string, unknown>, update: Update) => {
		if (row?.generation!.attemptId !== filter!['generation.attemptId'])
			return { matchedCount: 0 } as never;
		for (const [path, value] of Object.entries((update as Update).$set)) {
			if (path.startsWith('generation.')) row!.generation![path.split('.')[1]] = value;
			else row![path] = value;
		}
		for (const path of Object.keys((update as Update).$unset))
			delete row!.generation![path.split('.')[1]];
		return { matchedCount: 1 } as never;
	});
	vi.mocked(validateAddress).mockResolvedValue({
		XAVResponse: {
			Candidate: {
				AddressClassification: { Description: 'Commercial' },
				AddressKeyFormat: {
					AddressLine: '1 MAIN ST',
					PoliticalDivision2: 'CALEDONIA',
					PoliticalDivision1: 'NY',
					PostcodePrimaryLow: '14423'
				}
			}
		}
	});
	vi.mocked(getRates).mockResolvedValue({
		RateResponse: {
			RatedShipment: [
				{ Service: { Code: '03' }, TotalCharges: { MonetaryValue: '12.50' } },
				{ Service: { Code: '01' }, TotalCharges: { MonetaryValue: '30' } }
			]
		}
	});
});
describe('UPS remote quote generation', () => {
	it('rates different package weights together and uses the returned shipment price once', async () => {
		await createPendingUpsQuote(
			{
				...input(),
				isValidated: 'false',
				weightMode: 'groups',
				packageGroups: JSON.stringify([
					{ quantity: '1', weight: '10' },
					{ quantity: '1', weight: '20' }
				])
			},
			actor
		);
		const completed = await advancePendingUpsQuote({ quote: 1234 });
		expect(completed).toMatchObject({
			weightMode: 'groups',
			packageTotalCount: 2,
			packageTotalWeight: 30,
			packageGroups: [
				{ quantity: 1, weight: 10 },
				{ quantity: 1, weight: 20 }
			]
		});
		expect(getRates).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			[{ weight: 10 }, { weight: 20 }],
			expect.any(AbortSignal)
		);
		expect(completed.rates[0].rate).toBe(12.5);
	});
	it('calculates shipment totals from a per-package weight rather than trusting submitted totals', async () => {
		await createPendingUpsQuote(
			{
				...input(),
				weightMode: 'each',
				packageInfoTotalPackages: '3',
				packageInfoPackageWeight: '10',
				packageInfoTotalWeight: '999'
			},
			actor
		);
		expect(row).toMatchObject({
			packageTotalCount: 3,
			packageTotalWeight: 30,
			packageGroups: [{ quantity: 3, weight: 10 }]
		});
	});
	it('rounds equal-weight estimates upward to three decimal places for total mode', async () => {
		await createPendingUpsQuote(
			{ ...input(), packageInfoTotalPackages: '3', packageInfoTotalWeight: '1' },
			actor
		);
		expect(row).toMatchObject({
			packageTotalWeight: 1,
			packageGroups: [{ quantity: 3, weight: 0.334 }]
		});
	});
	it('keeps the old single-package estimate for a pending quote saved before package groups existed', async () => {
		await createPendingUpsQuote({ ...input(), isValidated: 'false' }, actor);
		delete row!.packageGroups;
		delete row!.weightMode;
		const completed = await advancePendingUpsQuote({ quote: 1234 });
		expect(getRates).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			{ weight: 11 },
			expect.any(AbortSignal)
		);
		expect(completed.rates[0].rate).toBe(25);
	});
	it.each([
		{ weightMode: 'invalid' },
		{ weightMode: 'each', packageInfoPackageWeight: '0' },
		{ weightMode: 'each', packageInfoPackageWeight: '151' },
		{ weightMode: 'each', packageInfoPackageWeight: '1.1234' },
		{ weightMode: 'groups', packageGroups: 'invalid json' },
		{ weightMode: 'groups', packageGroups: [] },
		{ weightMode: 'groups', packageGroups: [{ quantity: 0, weight: 10 }] },
		{ weightMode: 'groups', packageGroups: [{ quantity: 1, weight: 151 }] },
		{
			weightMode: 'groups',
			packageGroups: [
				{ quantity: 30, weight: 10 },
				{ quantity: 21, weight: 20 }
			]
		},
		{ packageInfoTotalPackages: '51' }
	])(
		'rejects invalid package groups and unsupported weights before allocating a quote: %j',
		async (changes) => {
			await expect(createPendingUpsQuote({ ...input(), ...changes }, actor)).rejects.toMatchObject({
				status: 400
			});
			expect(nextQuoteNumber).not.toHaveBeenCalled();
		}
	);
	it('reserves and saves a pending quote without waiting for UPS and deduplicates creation retries', async () => {
		const values = input();
		expect(await createPendingUpsQuote(values, actor)).toBe(1234);
		expect(validateAddress).not.toHaveBeenCalled();
		expect(getRates).not.toHaveBeenCalled();
		expect(row).toMatchObject({
			rates: [],
			packageWeight: 11,
			generation: { validation: 'pending', rates: 'pending' }
		});
		expect(await createPendingUpsQuote(values, actor)).toBe(1234);
		expect(nextQuoteNumber).toHaveBeenCalledOnce();
		expect(UpsQuote.create).toHaveBeenCalledOnce();
	});
	it('validates first, saves the normalized address, and then requests and saves rates in service order', async () => {
		await createPendingUpsQuote(input(), actor);
		const validated = await advancePendingUpsQuote({ quote: 1234 });
		expect(validated).toMatchObject({
			isValidated: true,
			classification: 'Commercial',
			shipTo: { AddressLine: '1 MAIN ST' },
			generation: { validation: 'complete', rates: 'pending' }
		});
		expect(getRates).not.toHaveBeenCalled();
		const completed = await advancePendingUpsQuote({ quote: 1234 });
		expect(getRates).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ address: '1 MAIN ST' }),
			[{ weight: 10.5 }, { weight: 10.5 }],
			expect.any(AbortSignal)
		);
		expect(completed.rates).toEqual([
			{ description: 'Ground', rate: 12.5 },
			{ description: 'Next Day Air', rate: 30 }
		]);
		expect(completed.generation).toMatchObject({ validation: 'complete', rates: 'complete' });
		expect(JSON.stringify(completed)).not.toMatch(/requestKey|attemptId|leaseUntil/);
		await advancePendingUpsQuote({ quote: 1234 });
		expect(getRates).toHaveBeenCalledOnce();
	});
	it('skips address validation when not selected', async () => {
		await createPendingUpsQuote({ ...input(), isValidated: 'false' }, actor);
		const completed = await advancePendingUpsQuote({ quote: 1234 });
		expect(validateAddress).not.toHaveBeenCalled();
		expect(getRates).toHaveBeenCalledOnce();
		expect(completed.isValidated).toBe(false);
		expect(completed.generation?.rates).toBe('complete');
	});
	it('does not request rates after failed validation, and retries the same quote explicitly', async () => {
		await createPendingUpsQuote(input(), actor);
		vi.mocked(validateAddress).mockResolvedValueOnce({ XAVResponse: {} });
		const failed = await advancePendingUpsQuote({ quote: 1234 });
		expect(failed.generation).toMatchObject({ validation: 'failed', rates: 'pending' });
		await advancePendingUpsQuote({ quote: 1234 });
		expect(validateAddress).toHaveBeenCalledOnce();
		expect(getRates).not.toHaveBeenCalled();
		const recovered = await advancePendingUpsQuote({ quote: 1234, retry: true });
		expect(recovered.generation?.validation).toBe('complete');
		expect(UpsQuote.create).toHaveBeenCalledOnce();
	});
	it('retries rate failures without revalidating or changing the quote number', async () => {
		await createPendingUpsQuote(input(), actor);
		await advancePendingUpsQuote({ quote: 1234 });
		vi.mocked(getRates).mockRejectedValueOnce(new Error('UPS unavailable'));
		expect((await advancePendingUpsQuote({ quote: 1234 })).generation).toMatchObject({
			rates: 'failed',
			message: 'UPS unavailable'
		});
		expect((await advancePendingUpsQuote({ quote: 1234, retry: true })).generation?.rates).toBe(
			'complete'
		);
		expect(validateAddress).toHaveBeenCalledOnce();
		expect(nextQuoteNumber).toHaveBeenCalledOnce();
	});
	it('allows only one in-flight call per step and recovers an interrupted lease', async () => {
		await createPendingUpsQuote({ ...input(), isValidated: 'false' }, actor);
		let release!: (value: unknown) => void;
		const response = {
			RateResponse: {
				RatedShipment: { Service: { Code: '03' }, TotalCharges: { MonetaryValue: '5' } }
			}
		};
		vi.mocked(getRates).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					release = resolve;
				})
		);
		const first = advancePendingUpsQuote({ quote: 1234 });
		await vi.waitFor(() => expect(getRates).toHaveBeenCalledOnce());
		expect((await advancePendingUpsQuote({ quote: 1234 })).generation?.rates).toBe('running');
		expect(getRates).toHaveBeenCalledOnce();
		row!.generation!.leaseUntil = new Date(0);
		expect((await advancePendingUpsQuote({ quote: 1234 })).generation?.rates).toBe('complete');
		release(response);
		await first;
		expect((await findUpsQuote(1234)).rates[0].rate).toBe(12.5);
	});
	it.each([
		{ packageInfoTotalPackages: '0' },
		{ packageInfoTotalPackages: '1.5' },
		{ packageInfoTotalWeight: '-1' },
		{ shipToZIP: 'bad' },
		{ _branchId: 'c'.repeat(24) },
		{ isValidated: 'maybe' },
		{ requestId: 'invalid' }
	])('rejects invalid input before allocating a number: %j', async (changes) => {
		await expect(createPendingUpsQuote({ ...input(), ...changes }, actor)).rejects.toMatchObject({
			status: 400
		});
		expect(nextQuoteNumber).not.toHaveBeenCalled();
	});
	it('keeps historical completed quotes readable without invoking UPS', async () => {
		await createPendingUpsQuote(input(), actor);
		delete row!.generation;
		row!.rates = [null, { description: 'Ground', rate: '18.25' }];
		expect((await advancePendingUpsQuote({ quote: 1234 })).rates).toEqual([
			{ description: 'Ground', rate: 18.25 }
		]);
		expect(validateAddress).not.toHaveBeenCalled();
		expect(getRates).not.toHaveBeenCalled();
	});
});
