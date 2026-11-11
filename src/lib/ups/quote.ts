export type QuoteAddress = {
	AddressLine: string;
	City: string;
	StateProvinceCode: string;
	PostalCode: string;
	CountryCode: string;
};
export type WeightMode = 'total' | 'each' | 'groups' | 'cartons';
export type QuotePackageGroup = { quantity: number; weight: number };
export type PackageGroupInput = { id: string; quantity: string; weight: string };
export const MAX_QUOTE_PACKAGES = 50;
export const MAX_RATE_SCENARIOS = 20;
export const UPS_SERVICES = [
	{ code: '03', title: 'Ground' },
	{ code: '12', title: '3 Day Select' },
	{ code: '02', title: '2nd Day Air' },
	{ code: '59', title: '2nd Day Air A.M.' },
	{ code: '13', title: 'Next Day Air Saver' },
	{ code: '01', title: 'Next Day Air' },
	{ code: '14', title: 'Next Day Air Early' },
	{ code: '75', title: 'Heavy Goods' }
];
export type CasePacking = {
	unitsPerCarton: number;
	cartonWeight: number;
	tareWeight: number;
	partialCase: 'prorate' | 'full';
};
export type RateScenarioInput = {
	id: string;
	label: string;
	unitQuantity: string;
	services: string[];
	weightMode: WeightMode;
	totalPackages: string;
	totalWeight: string;
	eachWeight: string;
	groups: PackageGroupInput[];
	unitsPerCarton: string;
	cartonWeight: string;
	tareWeight: string;
	partialCase: 'prorate' | 'full';
};
export type QuoteRate = { description: string; rate: number; serviceCode?: string };
export type QuoteScenario = {
	id: string;
	label: string;
	unitQuantity?: number;
	services: string[];
	weightMode: WeightMode;
	packageGroups: QuotePackageGroup[];
	packageTotalCount: number;
	packageTotalWeight: number;
	packageWeight: number;
	casePacking?: CasePacking;
	status: 'pending' | 'running' | 'complete' | 'failed';
	rates: QuoteRate[];
	unavailableServices: string[];
	message: string;
};
export function blankRateScenario(): RateScenarioInput {
	return {
		id: crypto.randomUUID(),
		label: '',
		unitQuantity: '',
		services: UPS_SERVICES.map((service) => service.code),
		weightMode: 'total',
		totalPackages: '',
		totalWeight: '',
		eachWeight: '',
		groups: [],
		unitsPerCarton: '',
		cartonWeight: '',
		tareWeight: '0',
		partialCase: 'prorate'
	};
}
export function scenarioInput(scenario: QuoteScenario): RateScenarioInput {
	return {
		...blankRateScenario(),
		id: crypto.randomUUID(),
		label: scenario.label,
		unitQuantity: scenario.unitQuantity ? String(scenario.unitQuantity) : '',
		services: [...scenario.services],
		weightMode: scenario.weightMode,
		totalPackages: String(scenario.packageTotalCount),
		totalWeight: String(scenario.packageTotalWeight),
		eachWeight:
			scenario.weightMode === 'each' ? String(scenario.packageGroups[0]?.weight ?? '') : '',
		groups: scenario.packageGroups.map((group) => ({
			id: crypto.randomUUID(),
			quantity: String(group.quantity),
			weight: String(group.weight)
		})),
		unitsPerCarton: scenario.casePacking ? String(scenario.casePacking.unitsPerCarton) : '',
		cartonWeight: scenario.casePacking ? String(scenario.casePacking.cartonWeight) : '',
		tareWeight: String(scenario.casePacking?.tareWeight ?? 0),
		partialCase: scenario.casePacking?.partialCase ?? 'prorate'
	};
}
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
	scenarios?: QuoteScenario[];
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
