import type { QuoteView, ShippingAddress } from './types';

type LegacyAddress = {
	AddressLine?: string | string[];
	City?: string;
	StateProvinceCode?: string;
	PostalCode?: string | number;
};
type LegacyQuote = {
	quote: number;
	createdAt?: Date | string;
	date?: Date | string;
	_branchId?: { toString(): string };
	shipper?: LegacyAddress | null;
	shipTo?: LegacyAddress | null;
	rates?: unknown[];
	packageTotalCount?: number;
	packageTotalWeight?: number;
};
function address(row: LegacyAddress | null = {}): ShippingAddress {
	row ??= {};
	return {
		address: Array.isArray(row.AddressLine) ? row.AddressLine.join(', ') : (row.AddressLine ?? ''),
		city: row.City ?? '',
		state: row.StateProvinceCode ?? '',
		zip: String(row.PostalCode ?? ''),
		residential: false
	};
}
export function legacyQuoteView(row: LegacyQuote): QuoteView {
	const date = row.createdAt ?? row.date;
	return {
		number: String(row.quote),
		origin: 'legacy-ups',
		createdAt:
			date && Number.isFinite(new Date(date).getTime()) ? new Date(date).toISOString() : null,
		branchId: row._branchId?.toString() ?? '',
		request: null,
		shipFrom: address(row.shipper),
		shipTo: address(row.shipTo),
		rates: [],
		attempts: [],
		packageTotalCount: row.packageTotalCount,
		packageTotalWeight: row.packageTotalWeight,
		// Legacy data contains final prices only. Never invent historical costs or markups.
		legacyRates: (row.rates ?? []).flatMap((value) => {
			if (
				!value ||
				typeof value !== 'object' ||
				!('rate' in value) ||
				!('description' in value) ||
				typeof value.description !== 'string'
			)
				return [];
			if (
				(typeof value.rate !== 'number' && typeof value.rate !== 'string') ||
				String(value.rate).trim() === ''
			)
				return [];
			const amount = Number(value.rate);
			return Number.isFinite(amount) && amount >= 0
				? [{ description: value.description, priceCents: Math.round(amount * 100) }]
				: [];
		})
	};
}
