import { randomUUID } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { Types } from 'mongoose';
import { Branch } from '../mongoose/models/Branch';
import { UpsQuote } from '../mongoose/models/UpsQuote';
import { nextQuoteNumber } from '../shipping/numbering';
import { getRates, validateAddress } from '$lib/ups';
import type { QuoteAddress, QuoteGeneration, UpsQuoteView } from '$lib/ups/quote';

type QuoteRecord = Omit<UpsQuoteView, '_branchId' | 'createdAt' | 'rates'> & {
	_id: Types.ObjectId;
	_branchId: Types.ObjectId;
	createdAt: Date;
	rates: unknown[];
	generation?: QuoteGeneration & { attemptId?: string; leaseUntil?: Date };
};
type Actor = Pick<App.Locals['user'], '_id' | 'branches'>;
function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		error(400, 'Invalid quote request.');
	return value as Record<string, unknown>;
}
function text(value: unknown, label: string, required = true) {
	if (typeof value !== 'string' || value.length > 200 || (required && !value.trim()))
		error(400, `Enter a valid ${label}.`);
	return value.trim();
}
function positive(value: unknown, label: string, integer = false) {
	if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '')
		error(400, `Enter a valid ${label}.`);
	const number = Number(value);
	if (
		!Number.isFinite(number) ||
		number <= 0 ||
		number > 1_000_000 ||
		(integer && !Number.isSafeInteger(number))
	)
		error(400, `Enter a valid ${label}.`);
	return number;
}
function address(
	input: Record<string, unknown>,
	prefix: 'shipFrom' | 'shipTo',
	required: boolean
): QuoteAddress {
	const zip = text(String(input[`${prefix}ZIP`] ?? ''), 'ZIP code').padStart(5, '0');
	const state = text(input[`${prefix}State`], 'state');
	if (!/^\d{5}(-\d{4})?$/.test(zip) || !/^[A-Z]{2}$/.test(state))
		error(400, 'Enter a valid ZIP code and state.');
	return {
		AddressLine: text(input[`${prefix}Address`], 'address', required),
		City: text(input[`${prefix}City`], 'city'),
		StateProvinceCode: state,
		PostalCode: zip,
		CountryCode: 'US'
	};
}
export function parseQuoteNumber(value: unknown) {
	if (
		(typeof value !== 'string' && typeof value !== 'number') ||
		!/^\d+$/.test(String(value)) ||
		!Number.isSafeInteger(Number(value)) ||
		Number(value) < 1
	)
		error(400, 'Invalid quote number.');
	return Number(value);
}
function view(row: QuoteRecord): UpsQuoteView {
	return {
		quote: row.quote,
		_branchId: row._branchId?.toString() ?? '',
		createdAt: row.createdAt.toISOString(),
		classification: row.classification,
		isValidated: row.isValidated,
		packageTotalCount: row.packageTotalCount,
		packageTotalWeight: row.packageTotalWeight,
		packageWeight: row.packageWeight,
		shipper: row.shipper,
		shipTo: row.shipTo,
		rates: (row.rates ?? []).flatMap((rate) => {
			if (
				!rate ||
				typeof rate !== 'object' ||
				!('description' in rate) ||
				typeof rate.description !== 'string' ||
				!('rate' in rate) ||
				(typeof rate.rate !== 'string' && typeof rate.rate !== 'number') ||
				String(rate.rate).trim() === '' ||
				!Number.isFinite(Number(rate.rate))
			)
				return [];
			return [{ description: rate.description, rate: Number(rate.rate) }];
		}),
		...(row.generation
			? {
					generation: {
						validation: row.generation.validation,
						rates: row.generation.rates,
						message: row.generation.message ?? ''
					}
				}
			: {})
	};
}
async function record(quote: number) {
	const row = await UpsQuote.findOne({ quote }).lean<QuoteRecord | null>();
	if (!row) error(404, 'Quote not found.');
	return row;
}
export async function findUpsQuote(value: unknown) {
	return view(await record(parseQuoteNumber(value)));
}
export async function createPendingUpsQuote(value: unknown, actor: Actor) {
	const input = object(value);
	const requestId = text(input.requestId, 'request ID');
	if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(requestId))
		error(400, 'Reload the form and try again.');
	const branchId = text(input._branchId, 'branch');
	if (!/^[a-f\d]{24}$/i.test(branchId) || !actor.branches.some((branch) => branch._id === branchId))
		error(400, 'Choose one of your branches.');
	if (input.isValidated !== 'true' && input.isValidated !== 'false')
		error(400, 'Choose whether to validate the address.');
	const validationRequired = input.isValidated === 'true';
	const shipper = address(input, 'shipFrom', validationRequired),
		shipTo = address(input, 'shipTo', validationRequired);
	const packageTotalCount = positive(input.packageInfoTotalPackages, 'package count', true);
	const packageTotalWeight = positive(input.packageInfoTotalWeight, 'total weight');
	const packageWeight = Math.ceil(packageTotalWeight / packageTotalCount);
	const requestKey = `${actor._id}:${requestId}`;
	await UpsQuote.init();
	const existing = await UpsQuote.findOne({ requestKey })
		.select('quote')
		.lean<{ quote: number } | null>();
	if (existing) return existing.quote;
	const quote = await nextQuoteNumber();
	try {
		await UpsQuote.create({
			quote,
			requestKey,
			_branchId: branchId,
			_createdById: actor._id,
			classification: 'Unknown',
			isValidated: false,
			packageTotalCount,
			packageTotalWeight,
			packageWeight,
			shipper,
			shipTo,
			rates: [],
			generation: { validation: validationRequired ? 'pending' : 'skipped', rates: 'pending' }
		});
	} catch (cause) {
		if (cause && typeof cause === 'object' && 'code' in cause && cause.code === 11000) {
			const saved = await UpsQuote.findOne({ requestKey })
				.select('quote')
				.lean<{ quote: number } | null>();
			if (saved) return saved.quote;
		}
		throw cause;
	}
	return quote;
}
function upsAddress(value: QuoteAddress) {
	return {
		address: value.AddressLine,
		city: value.City,
		state: value.StateProvinceCode,
		zip: value.PostalCode
	};
}
async function validated(row: QuoteRecord, signal: AbortSignal) {
	const result = await validateAddress(upsAddress(row.shipTo), signal);
	const candidates = result?.XAVResponse?.Candidate;
	const candidate = Array.isArray(candidates) ? candidates[0] : candidates;
	const address = candidate?.AddressKeyFormat;
	if (!address || !candidate.AddressClassification?.Description)
		throw new Error('UPS could not validate this address. Check the destination and try again.');
	const line = Array.isArray(address.AddressLine) ? address.AddressLine[0] : address.AddressLine;
	return {
		classification: candidate.AddressClassification.Description,
		isValidated: true,
		shipTo: {
			...row.shipTo,
			AddressLine: line || row.shipTo.AddressLine,
			City: address.PoliticalDivision2 || row.shipTo.City,
			StateProvinceCode: address.PoliticalDivision1 || row.shipTo.StateProvinceCode,
			PostalCode: address.PostcodePrimaryLow || row.shipTo.PostalCode
		}
	};
}
async function rated(row: QuoteRecord, signal: AbortSignal) {
	const result = await getRates(
		upsAddress(row.shipper),
		upsAddress(row.shipTo),
		{ weight: row.packageWeight },
		signal
	);
	const shipments = result?.RateResponse?.RatedShipment;
	if (!shipments) throw new Error('UPS returned no rates. Please try again.');
	const rows = (Array.isArray(shipments) ? shipments : [shipments]) as {
		Service?: { Code?: string };
		TotalCharges?: { MonetaryValue?: string };
	}[];
	// Retain the estimator's service order and per-package pricing.
	const services = [
		['03', 'Ground'],
		['12', '3 Day Select'],
		['02', '2nd Day Air'],
		['59', '2nd Day Air A.M.'],
		['13', 'Next Day Air Saver'],
		['01', 'Next Day Air'],
		['14', 'Next Day Air Early'],
		['75', 'Heavy Goods']
	];
	const branch = await Branch.findById(row._branchId)
		.select('number')
		.lean<{ number: number } | null>();
	let discount = 0;
	if (branch?.number === 2060) {
		const now = Date.now();
		for (const phase of [
			{ discount: 0.25, from: Date.parse('06/01/2025'), to: Date.parse('11/30/2025') },
			{ discount: 0.125, from: Date.parse('12/01/2025'), to: Date.parse('05/31/2026') }
		])
			if (now >= phase.from && now <= phase.to) discount = phase.discount;
	}
	const rates = services.flatMap(([code, description]) => {
		const value = rows.find((item) => item.Service?.Code === code)?.TotalCharges?.MonetaryValue;
		if (value === undefined) return [];
		const amount = Number(value);
		if (value === null || String(value).trim() === '' || !Number.isFinite(amount) || amount < 0)
			throw new Error('UPS returned an invalid rate. Please try again.');
		return [{ description, rate: amount * row.packageTotalCount * (1 - discount) }];
	});
	if (!rates.length) throw new Error('UPS returned no supported rates. Please try again.');
	return { rates };
}
export async function advancePendingUpsQuote(value: unknown) {
	const input = object(value),
		quote = parseQuoteNumber(input.quote);
	if (input.retry !== undefined && typeof input.retry !== 'boolean')
		error(400, 'Invalid retry request.');
	const row = await record(quote);
	const generation = row.generation;
	if (!generation || generation.rates === 'complete') return view(row);
	const step = ['complete', 'skipped'].includes(generation.validation) ? 'rates' : 'validation';
	if (generation[step] === 'failed' && input.retry !== true) return view(row);
	const attemptId = randomUUID();
	const claimed = await UpsQuote.findOneAndUpdate(
		{
			_id: row._id,
			[`generation.${step}`]: generation[step],
			$or: [
				{ 'generation.leaseUntil': { $exists: false } },
				{ 'generation.leaseUntil': { $lte: new Date() } }
			]
		},
		{
			$set: {
				[`generation.${step}`]: 'running',
				'generation.attemptId': attemptId,
				'generation.leaseUntil': new Date(Date.now() + 60_000),
				'generation.message': ''
			}
		},
		{ new: true }
	).lean<QuoteRecord | null>();
	if (!claimed) return findUpsQuote(quote);
	let changes: Record<string, unknown>;
	try {
		const signal = AbortSignal.timeout(25_000);
		changes = {
			...(step === 'validation' ? await validated(claimed, signal) : await rated(claimed, signal)),
			[`generation.${step}`]: 'complete',
			'generation.message': ''
		};
	} catch (cause) {
		changes = {
			[`generation.${step}`]: 'failed',
			'generation.message':
				cause instanceof Error && cause.name !== 'TimeoutError'
					? cause.message
					: 'UPS did not respond in time. Please try again.'
		};
	}
	// Fence stale requests after a lease expires; they cannot replace a newer attempt.
	await UpsQuote.updateOne(
		{ _id: row._id, 'generation.attemptId': attemptId },
		{ $set: changes, $unset: { 'generation.attemptId': 1, 'generation.leaseUntil': 1 } }
	);
	return findUpsQuote(quote);
}
