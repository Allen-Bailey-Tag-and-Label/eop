export type QuoteAddress = {
	AddressLine: string;
	City: string;
	StateProvinceCode: string;
	PostalCode: string;
	CountryCode: string;
};
export type WeightMode = 'total' | 'each' | 'groups';
export type QuotePackageGroup = { quantity: number; weight: number };
export type PackageGroupInput = { id: string; quantity: string; weight: string };
export const MAX_QUOTE_PACKAGES = 50;
export type QuoteStepStatus = 'pending' | 'running' | 'complete' | 'skipped' | 'failed';
export type QuoteGeneration = {
	validation: QuoteStepStatus;
	rates: QuoteStepStatus;
	message?: string;
};
export type UpsQuoteView = {
	quote: number;
	_branchId: string;
	createdAt: string;
	classification: string;
	isValidated: boolean;
	packageTotalCount: number;
	packageTotalWeight: number;
	packageWeight: number;
	weightMode?: WeightMode;
	packageGroups?: QuotePackageGroup[];
	shipper: QuoteAddress;
	shipTo: QuoteAddress;
	rates: { description: string; rate: number }[];
	generation?: QuoteGeneration;
};
export function quoteIsPending(quote: UpsQuoteView) {
	return (
		!!quote.generation &&
		!['complete', 'failed'].includes(quote.generation.rates) &&
		quote.generation.validation !== 'failed'
	);
}
