import { randomUUID } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { Types } from 'mongoose';
import { Branch } from '../mongoose/models/Branch';
import { UpsQuote } from '../mongoose/models/UpsQuote';
import { nextQuoteNumber } from '../shipping/numbering';
import { getRates, validateAddress } from '$lib/ups';
import {
	MAX_QUOTE_PACKAGES,
	MAX_RATE_SCENARIOS,
	UPS_SERVICES,
	type QuoteAddress,
	type QuoteGeneration,
	type UpsQuoteView,
	type QuotePackageGroup,
	type WeightMode,
	type QuoteScenario
} from '$lib/ups/quote';
import { calculateCases } from '$lib/ups/casePacking';

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
function packageDetails(input: Record<string, unknown>) {
	const mode = input.weightMode ?? 'total';
	if (mode !== 'total' && mode !== 'each' && mode !== 'groups' && mode !== 'cartons')
		error(400, 'Select a valid weight mode.');
	if (mode === 'cartons') {
		const unitQuantity = wholeUnits(input.unitQuantity);
		const casePacking = {
			unitsPerCarton: wholeUnits(input.unitsPerCarton),
			cartonWeight: Number(input.cartonWeight),
			tareWeight: Number(input.tareWeight || 0),
			partialCase: input.partialCase ?? 'prorate'
		};
		if (
			(typeof input.cartonWeight !== 'number' && typeof input.cartonWeight !== 'string') ||
			(input.tareWeight !== undefined &&
				typeof input.tareWeight !== 'number' &&
				typeof input.tareWeight !== 'string') ||
			(casePacking.partialCase !== 'prorate' && casePacking.partialCase !== 'full')
		)
			error(400, 'Enter valid case weights and a partial-case strategy.');
		try {
			const result = calculateCases(unitQuantity, {
				...casePacking,
				partialCase: casePacking.partialCase
			});
			return {
				...result,
				weightMode: 'cartons' as const,
				packageWeight: Math.ceil(result.packageTotalWeight / result.packageTotalCount),
				casePacking: {
					...casePacking,
					partialCase: casePacking.partialCase as 'prorate' | 'full'
				}
			};
		} catch (cause) {
			error(400, cause instanceof Error ? cause.message : 'Invalid case packing.');
		}
	}
	const quantity = (value: unknown) => {
		const count = positive(value, 'package count', true);
		if (count > MAX_QUOTE_PACKAGES)
			error(400, `Enter at most ${MAX_QUOTE_PACKAGES} packages per quote.`);
		return count;
	};
	const weight = (value: unknown) => {
		const amount = positive(value, 'package weight');
		if (
			amount < 0.001 ||
			amount > 150 ||
			Math.abs(amount * 1000 - Math.round(amount * 1000)) > 1e-7
		)
			error(
				400,
				'Package weights must be between 0.001 and 150 lbs, with at most three decimal places.'
			);
		return amount;
	};
	let groups: QuotePackageGroup[];
	let totalWeight: number;
	if (mode === 'groups') {
		let raw: unknown = input.packageGroups;
		if (typeof raw === 'string') {
			if (raw.length > 8000) error(400, 'Too many package groups.');
			try {
				raw = JSON.parse(raw);
			} catch {
				error(400, 'Enter valid package groups.');
			}
		}
		if (!Array.isArray(raw) || !raw.length || raw.length > MAX_QUOTE_PACKAGES)
			error(400, 'Enter at least one package group.');
		groups = raw.map((value) => {
			const group = object(value);
			return { quantity: quantity(group.quantity), weight: weight(group.weight) };
		});
		totalWeight = Number(
			groups.reduce((sum, group) => sum + group.quantity * group.weight, 0).toFixed(3)
		);
	} else {
		const count = quantity(input.packageInfoTotalPackages);
		totalWeight =
			mode === 'total'
				? positive(input.packageInfoTotalWeight, 'total weight')
				: Number((weight(input.packageInfoPackageWeight) * count).toFixed(3));
		const each =
			mode === 'total'
				? weight(Math.ceil((totalWeight / count) * 1000 - 1e-9) / 1000)
				: weight(input.packageInfoPackageWeight);
		groups = [{ quantity: count, weight: each }];
	}
	const count = groups.reduce((sum, group) => sum + group.quantity, 0);
	if (count > MAX_QUOTE_PACKAGES)
		error(400, `Enter at most ${MAX_QUOTE_PACKAGES} packages per quote.`);
	return {
		weightMode: mode as WeightMode,
		packageGroups: groups,
		packageTotalCount: count,
		packageTotalWeight: totalWeight,
		packageWeight: Math.ceil(totalWeight / count)
	};
}
function wholeUnits(value: unknown) {
	if (
		(typeof value !== 'string' && typeof value !== 'number') ||
		!Number.isSafeInteger(Number(value)) ||
		Number(value) < 1
	)
		error(400, 'Enter a positive whole-number unit quantity.');
	return Number(value);
}
function parseScenarios(value: unknown): QuoteScenario[] {
	let raw = value;
	if (typeof raw === 'string') {
		if (raw.length > 128_000) error(400, 'Too much rate scenario information.');
		try {
			raw = JSON.parse(raw);
		} catch {
			error(400, 'Enter valid rate rows.');
		}
	}
	if (!Array.isArray(raw) || !raw.length || raw.length > MAX_RATE_SCENARIOS)
		error(400, `Enter 1–${MAX_RATE_SCENARIOS} rate rows.`);
	const rows = raw.map((value) => {
		const row = object(value);
		const id = text(row.id, 'rate row ID');
		if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)) error(400, 'Invalid rate row ID.');
		if (
			!Array.isArray(row.services) ||
			!row.services.length ||
			row.services.length > UPS_SERVICES.length ||
			row.services.some(
				(code) => typeof code !== 'string' || !UPS_SERVICES.some((service) => service.code === code)
			) ||
			new Set(row.services).size !== row.services.length
		)
			error(400, 'Choose at least one valid UPS service for each rate row.');
		const selected = row.services as string[];
		return {
			...packageDetails({
				weightMode: row.weightMode,
				packageInfoTotalPackages: row.totalPackages,
				packageInfoTotalWeight: row.totalWeight,
				packageInfoPackageWeight: row.eachWeight,
				packageGroups: row.groups,
				unitQuantity: row.unitQuantity,
				unitsPerCarton: row.unitsPerCarton,
				cartonWeight: row.cartonWeight,
				tareWeight: row.tareWeight,
				partialCase: row.partialCase
			}),
			id,
			label: text(row.label ?? '', 'rate row label', false),
			...(row.unitQuantity === '' || row.unitQuantity === undefined
				? {}
				: { unitQuantity: wholeUnits(row.unitQuantity) }),
			services: UPS_SERVICES.filter((service) => selected.includes(service.code)).map(
				(service) => service.code
			),
			status: 'pending' as const,
			rates: [],
			unavailableServices: [],
			message: ''
		};
	});
	if (new Set(rows.map((row) => row.id)).size !== rows.length)
		error(400, 'Each rate row must have a unique ID.');
	return rows;
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
		...(row.scenarios?.length
			? {
					scenarios: row.scenarios.map((scenario) => ({
						...scenario,
						packageGroups: scenario.packageGroups.map(({ quantity, weight }) => ({
							quantity,
							weight
						})),
						rates: scenario.rates.map(({ description, rate, serviceCode }) => ({
							description,
							rate,
							serviceCode
						}))
					}))
				}
			: {}),
		...(row.packageGroups?.length
			? {
					weightMode: row.weightMode ?? 'groups',
					packageGroups: row.packageGroups.map(({ quantity, weight }) => ({ quantity, weight }))
				}
			: {}),
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
	const scenarios =
		input.rateScenarios === undefined ? undefined : parseScenarios(input.rateScenarios);
	const packages = scenarios?.[0] ?? packageDetails(input);
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
			packageTotalCount: packages.packageTotalCount,
			packageTotalWeight: packages.packageTotalWeight,
			packageWeight: packages.packageWeight,
			weightMode: packages.weightMode,
			packageGroups: packages.packageGroups,
			...(scenarios ? { scenarios } : {}),
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
async function rated(row: QuoteRecord, signal: AbortSignal, selected?: string[]) {
	const result = await getRates(
		upsAddress(row.shipper),
		upsAddress(row.shipTo),
		row.packageGroups?.length
			? row.packageGroups.flatMap((group) =>
					Array.from({ length: group.quantity }, () => ({ weight: group.weight }))
				)
			: { weight: row.packageWeight },
		signal
	);
	const shipments = result?.RateResponse?.RatedShipment;
	if (!shipments) throw new Error('UPS returned no rates. Please try again.');
	const rows = (Array.isArray(shipments) ? shipments : [shipments]) as {
		Service?: { Code?: string };
		TotalCharges?: { MonetaryValue?: string };
	}[];
	// Multi-package responses already contain the shipment total. Older pending
	// quotes without groups retain the original single-package estimate behavior.
	const services = UPS_SERVICES.filter((service) => !selected || selected.includes(service.code));
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
	const rates = services.flatMap(({ code, title: description }) => {
		const value = rows.find((item) => item.Service?.Code === code)?.TotalCharges?.MonetaryValue;
		if (value === undefined) return [];
		const amount = Number(value);
		if (value === null || String(value).trim() === '' || !Number.isFinite(amount) || amount < 0)
			throw new Error('UPS returned an invalid rate. Please try again.');
		return [
			{
				description,
				...(selected ? { serviceCode: code } : {}),
				rate: amount * (row.packageGroups?.length ? 1 : row.packageTotalCount) * (1 - discount)
			}
		];
	});
	if (!rates.length && !selected)
		throw new Error('UPS returned no supported rates. Please try again.');
	return {
		rates,
		unavailableServices:
			selected?.filter(
				(code) => !rates.some((rate) => 'serviceCode' in rate && rate.serviceCode === code)
			) ?? []
	};
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
	const scenarios =
		step === 'rates'
			? row.scenarios?.map((scenario) =>
					input.retry === true && scenario.status === 'failed'
						? { ...scenario, status: 'pending' as const, message: '' }
						: scenario
				)
			: undefined;
	const scenarioIndex =
		scenarios?.findIndex(
			(scenario) => scenario.status === 'pending' || scenario.status === 'running'
		) ?? -1;
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
				'generation.message': '',
				...(scenarios && scenarioIndex >= 0
					? {
							scenarios: scenarios.map((scenario, index) =>
								index === scenarioIndex ? { ...scenario, status: 'running' } : scenario
							)
						}
					: {})
			}
		},
		{ new: true }
	).lean<QuoteRecord | null>();
	if (!claimed) return findUpsQuote(quote);
	let changes: Record<string, unknown>;
	try {
		const signal = AbortSignal.timeout(25_000);
		if (scenarios && scenarioIndex >= 0) {
			const scenario = scenarios[scenarioIndex];
			const result = await rated({ ...claimed, ...scenario }, signal, scenario.services);
			scenarios[scenarioIndex] = { ...scenario, ...result, status: 'complete', message: '' };
			changes = scenarioProgress(scenarios);
		} else
			changes = {
				...(step === 'validation'
					? await validated(claimed, signal)
					: await rated(claimed, signal)),
				[`generation.${step}`]: 'complete',
				'generation.message': ''
			};
	} catch (cause) {
		const message =
			cause instanceof Error && cause.name !== 'TimeoutError'
				? cause.message
				: 'UPS did not respond in time. Please try again.';
		if (scenarios && scenarioIndex >= 0) {
			scenarios[scenarioIndex] = { ...scenarios[scenarioIndex], status: 'failed', message };
			changes = scenarioProgress(scenarios);
		} else changes = { [`generation.${step}`]: 'failed', 'generation.message': message };
	}
	// Fence stale requests after a lease expires; they cannot replace a newer attempt.
	await UpsQuote.updateOne(
		{ _id: row._id, 'generation.attemptId': attemptId },
		{ $set: changes, $unset: { 'generation.attemptId': 1, 'generation.leaseUntil': 1 } }
	);
	return findUpsQuote(quote);
}

function scenarioProgress(scenarios: QuoteScenario[]): Record<string, unknown> {
	const pending = scenarios.some(
		(scenario) => scenario.status === 'pending' || scenario.status === 'running'
	);
	const failed = scenarios.some((scenario) => scenario.status === 'failed');
	return {
		scenarios,
		rates: scenarios.flatMap((scenario, index) =>
			scenario.rates.map((rate) => ({
				...rate,
				description:
					scenarios.length === 1 && !scenario.label && !scenario.unitQuantity
						? rate.description
						: `${scenario.label || (scenario.unitQuantity ? `${scenario.unitQuantity.toLocaleString('en-US')} units` : `Rate row ${index + 1}`)} — ${rate.description}`,
				scenarioId: scenario.id
			}))
		),
		'generation.rates': pending ? 'pending' : failed ? 'failed' : 'complete',
		'generation.message':
			!pending && failed
				? 'Some rate rows failed. Retry to continue those rows; completed rates are retained.'
				: ''
	};
}
