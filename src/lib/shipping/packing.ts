import {
	blankRateScenario,
	scenarioInput,
	MAX_RATE_SCENARIOS,
	UPS_SERVICES,
	type RateScenarioInput,
	type QuoteScenario,
	type QuotePackageGroup
} from '$lib/ups/quote';
import { calculateCases } from '$lib/ups/casePacking';
import {
	DEFAULT_NMFC_CODE,
	type QuoteServices,
	type ShippingService,
	type FreightItem,
	type ShippingRequest
} from './types';
import { record, ShippingError } from './validation';

export type PalletShape = {
	length: string;
	width: string;
	height: string;
	nmfc: string;
	stackable: boolean;
};
export type PackingMeta = PalletShape & {
	basis: ShippingService;
	packageCount: string;
	palletCount: string;
	shapes?: Record<string, PalletShape>;
	layouts?: { id: string; quantity: string; shape: PalletShape }[];
};
export type ShippingScenarioInput = RateScenarioInput & { shipping?: PackingMeta };
export type FreightScenario = {
	id: string;
	label: string;
	unitQuantity?: number;
	freight: FreightItem[];
	status: 'pending' | 'complete' | 'failed';
	message: string;
};
export const blankPalletShape = (): PalletShape => ({
	length: '48',
	width: '40',
	height: '48',
	nmfc: DEFAULT_NMFC_CODE,
	stackable: false
});
export const blankShippingScenario = (services: QuoteServices = 'Both'): ShippingScenarioInput => ({
	...blankRateScenario(),
	shipping: {
		...blankPalletShape(),
		basis: services === 'LTL' ? 'LTL' : 'UPS',
		packageCount: '',
		palletCount: ''
	}
});

export function packingInputsFromRequest(
	request?: ShippingRequest | null
): ShippingScenarioInput[] {
	if (request?.packingInputs?.length)
		return request.packingInputs.map((input) => ({
			...structuredClone(input),
			id: crypto.randomUUID()
		}));
	if (!request) return [blankShippingScenario()];
	const freight = request.freight ?? [],
		first = freight[0];
	const base: PackingMeta = {
		...blankPalletShape(),
		...(first
			? {
					length: String(first.length),
					width: String(first.width),
					height: String(first.height),
					nmfc: first.nmfc,
					stackable: first.stackable
				}
			: {}),
		basis: request.services === 'LTL' ? 'LTL' : 'UPS',
		packageCount: String(request.packages.reduce((sum, item) => sum + item.quantity, 0) || ''),
		palletCount: String(freight.reduce((sum, item) => sum + item.quantity, 0) || '')
	};
	if (request.services === 'Both' && freight.length > 1)
		base.layouts = freight.map((item) => ({
			id: crypto.randomUUID(),
			quantity: String(item.quantity),
			shape: {
				length: String(item.length),
				width: String(item.width),
				height: String(item.height),
				nmfc: item.nmfc,
				stackable: item.stackable
			}
		}));
	if (request.services !== 'LTL' && request.upsScenarios?.length)
		return request.upsScenarios.map((scenario) => ({
			...scenarioInput(scenario),
			shipping: structuredClone(base)
		}));
	const source = request.services === 'LTL' ? freight : request.packages;
	const row = {
		...blankShippingScenario(request.services),
		weightMode: 'groups' as const,
		groups: source.map((item) => ({
			id: crypto.randomUUID(),
			quantity: String(item.quantity),
			weight: String(item.weight)
		})),
		shipping: base
	};
	if (request.services === 'LTL')
		base.shapes = Object.fromEntries(
			row.groups.map((group, index) => [
				group.id,
				{
					length: String(freight[index].length),
					width: String(freight[index].width),
					height: String(freight[index].height),
					nmfc: freight[index].nmfc,
					stackable: freight[index].stackable
				}
			])
		);
	return source.length ? [row] : [blankShippingScenario(request.services)];
}

function number(value: unknown, label: string, max = 1_000_000_000, integer = false) {
	if (!['string', 'number'].includes(typeof value) || String(value).trim() === '')
		throw new ShippingError(`Enter a valid ${label}.`);
	const result = Number(value);
	if (
		!Number.isFinite(result) ||
		result <= 0 ||
		result > max ||
		(integer && !Number.isSafeInteger(result))
	)
		throw new ShippingError(`Enter a valid ${label} (maximum ${max}).`);
	return result;
}
function pounds(value: unknown, label: string, max = 2_000_000) {
	const result = number(value, label, max);
	if (Math.abs(result * 1000 - Math.round(result * 1000)) > 1e-6)
		throw new ShippingError(`${label} allows up to three decimal places.`);
	return result;
}
function numericInput(value: unknown, label: string) {
	if (value === undefined || value === null) return '';
	if (
		!['string', 'number'].includes(typeof value) ||
		String(value).length > 200 ||
		(typeof value === 'number' && !Number.isFinite(value))
	)
		throw new ShippingError(`Enter a valid ${label}.`);
	return String(value);
}
function groupId(value: unknown) {
	if (
		typeof value !== 'string' ||
		!/^[a-z\d_-]{1,64}$/i.test(value) ||
		['__proto__', 'constructor', 'prototype'].includes(value)
	)
		throw new ShippingError('Enter valid packing group IDs.');
	return value;
}
// Split thousandths of a pound exactly: three packages totaling 10 lb become
// two at 3.333 and one at 3.334, rather than silently increasing shipment weight.
export function distributeWeight(totalWeight: number, count: number): QuotePackageGroup[] {
	if (
		!Number.isFinite(totalWeight) ||
		totalWeight <= 0 ||
		!Number.isSafeInteger(count) ||
		count < 1 ||
		count > 100
	)
		throw new ShippingError('Enter a valid total weight and handling-unit quantity.');
	const mills = Math.round(totalWeight * 1000),
		low = Math.floor(mills / count),
		extra = mills % count;
	if (low < 1)
		throw new ShippingError('Shipment weight must allow at least 0.001 lb per handling unit.');
	return [
		...(count - extra ? [{ quantity: count - extra, weight: low / 1000 }] : []),
		...(extra ? [{ quantity: extra, weight: (low + 1) / 1000 }] : [])
	];
}
export function packingSummary(row: ShippingScenarioInput) {
	const basis = row.shipping?.basis ?? 'UPS',
		maxCount = basis === 'LTL' ? 100 : 50,
		maxWeight = basis === 'LTL' ? 20000 : 150;
	let groups: QuotePackageGroup[];
	if (row.weightMode === 'cartons') {
		try {
			groups = calculateCases(
				number(row.unitQuantity, 'total units', Number.MAX_SAFE_INTEGER, true),
				{
					unitsPerCarton: number(
						row.unitsPerCarton,
						'units per handling unit',
						Number.MAX_SAFE_INTEGER,
						true
					),
					cartonWeight: pounds(row.cartonWeight, 'full handling-unit weight', maxWeight),
					tareWeight: Number(row.tareWeight || 0),
					partialCase: row.partialCase
				},
				{ maxCount, maxWeight }
			).packageGroups;
		} catch (cause) {
			if (cause instanceof ShippingError) throw cause;
			throw new ShippingError(
				cause instanceof Error ? cause.message : 'Enter valid case or pallet packing.'
			);
		}
	} else if (row.weightMode === 'groups') {
		if (!Array.isArray(row.groups) || !row.groups.length || row.groups.length > 50)
			throw new ShippingError('Enter 1-50 weight groups.');
		groups = row.groups.map((group) => ({
			quantity: number(group.quantity, 'group quantity', maxCount, true),
			weight: pounds(group.weight, 'handling-unit weight', maxWeight)
		}));
	} else if (row.weightMode === 'total' || row.weightMode === 'each') {
		const count = number(
			row.totalPackages,
			basis === 'LTL' ? 'pallet quantity' : 'package quantity',
			maxCount,
			true
		);
		groups =
			row.weightMode === 'total'
				? distributeWeight(pounds(row.totalWeight, 'total shipment weight'), count)
				: [{ quantity: count, weight: pounds(row.eachWeight, 'handling-unit weight', maxWeight) }];
	} else throw new ShippingError('Select a weight entry mode.');
	const count = groups.reduce((sum, group) => sum + group.quantity, 0);
	if (count > maxCount || groups.some((group) => group.weight > maxWeight))
		throw new ShippingError(
			`${basis} supports at most ${maxCount} handling units, each weighing up to ${maxWeight} lb.`
		);
	return {
		groups,
		count,
		totalWeight: Number(
			groups.reduce((sum, group) => sum + group.quantity * group.weight, 0).toFixed(3)
		)
	};
}
export function changePackingBasis(row: ShippingScenarioInput, next: ShippingService) {
	const meta = row.shipping!;
	if (meta.basis === next) return;
	let total = row.totalWeight;
	if (meta.basis === 'LTL' && row.weightMode === 'groups')
		meta.layouts = row.groups.map((group) => ({
			id: group.id,
			quantity: String(group.quantity),
			shape: {
				length: meta.length,
				width: meta.width,
				height: meta.height,
				nmfc: meta.nmfc,
				stackable: meta.stackable,
				...(meta.shapes?.[group.id] ?? {})
			}
		}));
	try {
		const current = packingSummary(row);
		total = String(current.totalWeight);
		meta[meta.basis === 'UPS' ? 'packageCount' : 'palletCount'] = String(current.count);
	} catch {
		/* Retain incomplete input while switching. */
	}
	meta.basis = next;
	row.totalPackages = meta[next === 'UPS' ? 'packageCount' : 'palletCount'];
	row.totalWeight = total;
	row.weightMode = 'total';
	// Per-package and case weights cannot be relabeled as per-pallet weights.
	// Keep the shared mass/counts, and seed any newly selected entry mode from them.
	row.groups = [];
	row.eachWeight =
		Number(row.totalPackages) > 0 && Number(total) > 0
			? String(Math.ceil((Number(total) / Number(row.totalPackages)) * 1000 - 1e-9) / 1000)
			: '';
	row.unitsPerCarton = '';
	row.cartonWeight = '';
	row.tareWeight = '0';
	row.partialCase = 'prorate';
	if (next === 'LTL' && meta.layouts?.length && Number(total) > 0) {
		try {
			const freight = layoutFreight(Number(total), meta);
			row.groups = freight.map((item) => ({
				id: crypto.randomUUID(),
				quantity: String(item.quantity),
				weight: String(item.weight)
			}));
			meta.shapes = Object.fromEntries(
				row.groups.map((group, index) => [
					group.id,
					{
						length: String(freight[index].length),
						width: String(freight[index].width),
						height: String(freight[index].height),
						nmfc: freight[index].nmfc,
						stackable: freight[index].stackable
					}
				])
			);
			row.weightMode = 'groups';
		} catch {
			/* Incomplete layouts remain editable. */
		}
	}
}

export function layoutFreight(totalWeight: number, meta: PackingMeta): FreightItem[] {
	const layouts = meta.layouts ?? [];
	const counts = layouts.map((layout) =>
		number(layout.quantity, 'pallet group quantity', 100, true)
	);
	const count = counts.reduce((sum, value) => sum + value, 0);
	if (count > 100) throw new ShippingError('Use at most 100 pallets.');
	const weights = distributeWeight(totalWeight, count).map((group) => ({ ...group }));
	const result: FreightItem[] = [];
	for (const [index, layout] of layouts.entries()) {
		let remaining = counts[index];
		while (remaining > 0) {
			const group = weights[0],
				quantity = Math.min(remaining, group.quantity);
			result.push({
				id: `${layout.id}-${result.length}`,
				quantity,
				weight: group.weight,
				length: Number(layout.shape.length),
				width: Number(layout.shape.width),
				height: Number(layout.shape.height),
				nmfc: layout.shape.nmfc,
				stackable: layout.shape.stackable,
				description: '',
				freightClass: ''
			});
			remaining -= quantity;
			group.quantity -= quantity;
			if (!group.quantity) weights.shift();
		}
	}
	return result;
}

function shape(value: unknown): PalletShape {
	const raw = record(value);
	const text = (key: string) => {
		if (
			!['string', 'number'].includes(typeof raw[key]) ||
			String(raw[key]).length > 40 ||
			(typeof raw[key] === 'number' && !Number.isFinite(raw[key]))
		)
			throw new ShippingError('Enter valid pallet details.');
		return String(raw[key]);
	};
	if (typeof raw.stackable !== 'boolean')
		throw new ShippingError('Select whether the pallets are stackable.');
	return {
		length: text('length'),
		width: text('width'),
		height: text('height'),
		nmfc: text('nmfc'),
		stackable: raw.stackable
	};
}
export function parsePackingScenarios(value: unknown, services: QuoteServices) {
	let raw = value;
	if (typeof raw === 'string') {
		if (raw.length > 256000) throw new ShippingError('Too much packing information.');
		try {
			raw = JSON.parse(raw);
		} catch {
			throw new ShippingError('Enter valid packing options.');
		}
	}
	if (!Array.isArray(raw) || !raw.length || raw.length > MAX_RATE_SCENARIOS)
		throw new ShippingError(`Enter 1-${MAX_RATE_SCENARIOS} rate rows.`);
	const upsScenarios: QuoteScenario[] = [],
		ltlScenarios: FreightScenario[] = [],
		packingInputs: ShippingScenarioInput[] = [];
	for (const value of raw) {
		const input = record(value),
			meta = record(input.shipping);
		if (meta.basis !== 'UPS' && meta.basis !== 'LTL')
			throw new ShippingError('Select packages or pallets for weight entry.');
		if ((services === 'UPS' || services === 'LTL') && meta.basis !== services)
			throw new ShippingError('Weight entry must match the selected shipping service.');
		const text = (key: string) => {
			if (typeof input[key] !== 'string' || input[key].length > 200)
				throw new ShippingError(`Enter a valid ${key}.`);
			return input[key] as string;
		};
		const numericText = (key: string) => numericInput(input[key], key);
		const id = text('id');
		if (
			!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) ||
			packingInputs.some((row) => row.id === id)
		)
			throw new ShippingError('Rate rows need unique IDs.');
		if (!Array.isArray(input.groups) || input.groups.length > 50)
			throw new ShippingError('Enter valid weight groups.');
		const groups = input.groups.map((value) => {
			const group = record(value);
			return {
				id: groupId(group.id),
				quantity: numericInput(group.quantity, 'group quantity'),
				weight: numericInput(group.weight, 'group weight')
			};
		});
		if (new Set(groups.map((group) => group.id)).size !== groups.length)
			throw new ShippingError('Packing groups need unique IDs.');
		const selected = Array.isArray(input.services)
			? input.services.filter(
					(code): code is string =>
						typeof code === 'string' && UPS_SERVICES.some((service) => service.code === code)
				)
			: [];
		if (
			services !== 'LTL' &&
			(!selected.length || selected.length !== (input.services as unknown[])?.length)
		)
			throw new ShippingError('Select valid UPS services for each rate row.');
		const shipping: PackingMeta = {
			...shape(meta),
			basis: meta.basis,
			packageCount: numericInput(meta.packageCount, 'package count'),
			palletCount: numericInput(meta.palletCount, 'pallet count'),
			shapes: {}
		};
		if (meta.layouts !== undefined) {
			if (!Array.isArray(meta.layouts) || meta.layouts.length > 50)
				throw new ShippingError('Enter up to 50 pallet layouts.');
			shipping.layouts = meta.layouts.map((value) => {
				const layout = record(value);
				return {
					id: groupId(layout.id),
					quantity: numericInput(layout.quantity, 'pallet quantity'),
					shape: shape(layout.shape)
				};
			});
			if (new Set(shipping.layouts.map((layout) => layout.id)).size !== shipping.layouts.length)
				throw new ShippingError('Pallet layouts need unique IDs.');
		}
		if (meta.shapes) {
			const shapes = record(meta.shapes);
			for (const group of groups)
				if (shapes[group.id]) shipping.shapes![group.id] = shape(shapes[group.id]);
		}
		const row: ShippingScenarioInput = {
			id,
			label: text('label'),
			unitQuantity: numericText('unitQuantity'),
			services: [...new Set(selected)],
			weightMode: text('weightMode') as RateScenarioInput['weightMode'],
			totalPackages: numericText('totalPackages'),
			totalWeight: numericText('totalWeight'),
			eachWeight: numericText('eachWeight'),
			groups,
			unitsPerCarton: numericText('unitsPerCarton'),
			cartonWeight: numericText('cartonWeight'),
			tareWeight: numericText('tareWeight'),
			partialCase: text('partialCase') as 'prorate' | 'full',
			shipping
		};
		const summary = packingSummary(row),
			unitQuantity = row.unitQuantity
				? number(row.unitQuantity, 'total units', Number.MAX_SAFE_INTEGER, true)
				: undefined;
		const upsGroups =
			services === 'LTL'
				? []
				: shipping.basis === 'UPS'
					? summary.groups
					: distributeWeight(
							summary.totalWeight,
							number(shipping.packageCount, 'package quantity', 50, true)
						);
		if (upsGroups.some((group) => group.weight > 150))
			throw new ShippingError(
				'Increase the UPS package count: each package must weigh at most 150 lb.'
			);
		const freightGroups =
			services === 'UPS'
				? []
				: shipping.basis === 'UPS' && shipping.layouts?.length
					? []
					: shipping.basis === 'LTL'
						? summary.groups
						: distributeWeight(
								summary.totalWeight,
								number(shipping.palletCount, 'pallet quantity', 100, true)
							);
		const freight =
			shipping.basis === 'UPS' && shipping.layouts?.length && services !== 'UPS'
				? layoutFreight(summary.totalWeight, shipping)
				: freightGroups.map((group, index) => {
						const dimensions =
							shipping.basis === 'LTL' && row.weightMode === 'groups'
								? (shipping.shapes?.[row.groups[index].id] ?? shipping)
								: shipping;
						return {
							...group,
							id: `${id}-${index}`,
							length: Number(dimensions.length),
							width: Number(dimensions.width),
							height: Number(dimensions.height),
							nmfc: dimensions.nmfc,
							stackable: dimensions.stackable,
							description: '',
							freightClass: ''
						};
					});
		if (services !== 'LTL')
			upsScenarios.push({
				id,
				label: row.label,
				...(unitQuantity ? { unitQuantity } : {}),
				services: row.services,
				weightMode: 'groups',
				packageGroups: upsGroups,
				packageTotalCount: upsGroups.reduce((sum, group) => sum + group.quantity, 0),
				packageTotalWeight: summary.totalWeight,
				packageWeight: Math.ceil(
					summary.totalWeight / upsGroups.reduce((sum, group) => sum + group.quantity, 0)
				),
				status: 'pending',
				rates: [],
				unavailableServices: [],
				message: ''
			});
		if (services !== 'UPS')
			ltlScenarios.push({
				id,
				label: row.label,
				...(unitQuantity ? { unitQuantity } : {}),
				freight,
				status: 'pending',
				message: ''
			});
		packingInputs.push(row);
	}
	return { packingInputs, upsScenarios, ltlScenarios };
}
