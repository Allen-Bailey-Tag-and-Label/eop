import type { CarrierRate, MarkupConfig, MarkupRange, PricedRate } from './types';
import { record, ShippingError, text } from './validation';

// Parse decimal strings exactly; currency and percentages never rely on floating-point multiplication.
export function decimalHundredths(value: unknown, label: string, max = 1_000_000_000) {
	if (typeof value !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(value.trim()))
		throw new ShippingError(`Enter a valid ${label} with at most two decimal places.`);
	const [whole, fraction = ''] = value.trim().split('.');
	const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
	if (!Number.isSafeInteger(result) || result > max)
		throw new ShippingError(`${label} is too large.`);
	return result;
}
export function parseMarkupRange(value: unknown): MarkupRange {
	const row = record(value);
	const id = text(row.id, 'rule ID', 36, true);
	if (!/^[a-f\d-]{36}$/i.test(id)) throw new ShippingError('Invalid markup rule ID.');
	const minCents = decimalHundredths(row.minimum, 'minimum freight cost');
	const maxCents =
		row.maximum === '' ? null : decimalHundredths(row.maximum, 'maximum freight cost');
	if (maxCents !== null && maxCents <= minCents)
		throw new ShippingError('Maximum cost must be greater than minimum cost.');
	return {
		id,
		minCents,
		maxCents,
		percentBps: decimalHundredths(row.percent, 'markup percentage', 100_000)
	};
}
export function validateRanges(ranges: MarkupRange[]) {
	const sorted = [...ranges].sort((a, b) => a.minCents - b.minCents);
	for (let i = 1; i < sorted.length; i++)
		if (sorted[i].minCents < (sorted[i - 1].maxCents ?? Infinity))
			throw new ShippingError(
				'Cost ranges for the same service cannot overlap. Minimum is inclusive; maximum is exclusive.'
			);
	if (new Set(ranges.map((range) => range.id)).size !== ranges.length)
		throw new ShippingError('Duplicate markup rule ID.');
	return sorted;
}
export function priceRate(rate: CarrierRate, config: MarkupConfig): PricedRate {
	if (
		!Number.isSafeInteger(rate.costCents) ||
		rate.costCents < 0 ||
		rate.costCents > 1_000_000_000 ||
		rate.service !== config.service ||
		rate.currency !== 'USD'
	)
		throw new ShippingError('Invalid carrier rate.');
	const range = validateRanges(config.ranges).find(
		(range) =>
			rate.costCents >= range.minCents &&
			(range.maxCents === null || rate.costCents < range.maxCents)
	);
	const percentBps = range?.percentBps ?? 0;
	const amountCents = Math.round((rate.costCents * percentBps) / 10_000);
	return {
		...rate,
		markup: {
			ruleId: range?.id ?? null,
			revision: config.revision,
			percentBps,
			amountCents
		},
		priceCents: rate.costCents + amountCents
	};
}
