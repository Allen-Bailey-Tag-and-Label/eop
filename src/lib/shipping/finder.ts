import type { Column } from '$lib/components/MongooseTable/types';

// These paths belong to ShippingQuote's request, so the shared table can persist its filters.
export const shippingFinderColumns: Column[] = [
	{
		key: 'request.services',
		label: 'Services',
		type: 'select',
		options: ['UPS', 'LTL', 'Both'].map((value) => ({ value, label: value }))
	},
	{ key: 'request.customer', label: 'Customer', type: 'string' },
	{ key: 'request.reference', label: 'Reference', type: 'string' },
	{ key: 'request.shipTo.address', label: 'Street', type: 'string' },
	{ key: 'request.shipTo.city', label: 'City', type: 'string' },
	{ key: 'request.shipTo.state', label: 'State', type: 'string' },
	{ key: 'request.shipTo.zip', label: 'ZIP', type: 'string' }
];

export type ShippingFinderRow = {
	number: string;
	origin: 'shipping' | 'legacy-ups';
	_branchId?: string;
	request: { shipTo: { address: string; city: string; state: string; zip: string } };
	isValidated?: boolean;
	packageTotalCount?: number;
	packageTotalWeight?: number;
};

export function duplicateShippingQuoteUrl(row: ShippingFinderRow) {
	if (row.origin !== 'legacy-ups') return `/shipping/quote?from=${encodeURIComponent(row.number)}`;
	return `/ups/quote?${new URLSearchParams({
		_branchId: row._branchId ?? '',
		address: row.request.shipTo.address,
		city: row.request.shipTo.city,
		state: row.request.shipTo.state,
		zip: row.request.shipTo.zip,
		isValidated: String(row.isValidated ?? false),
		totalPackages: String(row.packageTotalCount ?? ''),
		totalWeight: String(row.packageTotalWeight ?? '')
	})}`;
}
