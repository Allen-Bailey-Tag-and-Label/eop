import type { QuoteScenario } from '$lib/ups/quote';
import type { FreightScenario, ShippingScenarioInput } from './packing';

export type ShippingService = 'UPS' | 'LTL';
export type QuoteServices = ShippingService | 'Both';
export type ShippingAddress = {
	address: string;
	city: string;
	state: string;
	zip: string;
	residential: boolean;
};
export type PackageGroup = {
	id: string;
	quantity: number;
	weight: number;
	length?: number;
	width?: number;
	height?: number;
};
export type FreightItem = PackageGroup & {
	length: number;
	width: number;
	height: number;
	description: string;
	freightClass: string;
	nmfc: string;
	stackable: boolean;
};
export type ShippingRequest = {
	validateAddresses?: boolean;
	upsScenarios?: QuoteScenario[];
	ltlScenarios?: FreightScenario[];
	packingInputs?: ShippingScenarioInput[];
	services: QuoteServices;
	branchId: string;
	customer: string;
	reference: string;
	shipDate: string;
	shipFrom: ShippingAddress;
	shipTo: ShippingAddress;
	packages: PackageGroup[];
	freight: FreightItem[];
	accessorials: {
		pickupLiftgate: boolean;
		deliveryLiftgate: boolean;
		insidePickup: boolean;
		insideDelivery: boolean;
		limitedAccessPickup: boolean;
		limitedAccessDelivery: boolean;
	};
};
export type MarkupRange = {
	id: string;
	label: string;
	minCents: number;
	maxCents: number | null;
	percentBps: number;
};
export type MarkupConfig = { service: ShippingService; revision: number; ranges: MarkupRange[] };
export type CarrierRate = {
	comparisonKey?: string;
	staging?: boolean;
	freightClass?: string;
	classificationWarning?: string;
	transitDays?: number;
	estimatedDeliveryDate?: string;
	scenarioId?: string;
	scenarioLabel?: string;
	unitQuantity?: number;
	service: ShippingService;
	provider: 'UPS' | 'Unishippers';
	carrier: string;
	code: string;
	description: string;
	currency: 'USD';
	costCents: number;
	rateBasis: 'published' | 'negotiated';
	providerReference?: string;
};
export type PricedRate = CarrierRate & {
	markup: {
		ruleId: string | null;
		label: string;
		revision: number;
		percentBps: number;
		amountCents: number;
	};
	priceCents: number;
};
export type ProviderAttempt = {
	service: ShippingService;
	status: 'success' | 'error' | 'not-configured';
	message: string;
};
export type ShippingProgressStatus = 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
export type ShippingRateTask = {
	service: ShippingService;
	scenarioId?: string;
	label: string;
	status: ShippingProgressStatus;
	message: string;
	attempt?: ProviderAttempt;
};
export type ShippingGeneration = {
	validation: ShippingProgressStatus;
	rates: ShippingProgressStatus;
	message: string;
	tasks: ShippingRateTask[];
};
export type QuoteView = {
	generation?: ShippingGeneration;
	number: string;
	origin: 'shipping' | 'legacy-ups';
	createdAt: string | null;
	branchId: string;
	request: ShippingRequest | null;
	shipFrom: ShippingAddress;
	shipTo: ShippingAddress;
	rates: PricedRate[];
	legacyRates: { description: string; priceCents: number }[];
	attempts: ProviderAttempt[];
	packageTotalCount?: number;
	packageTotalWeight?: number;
};

export const FREIGHT_CLASSES = [
	'50',
	'55',
	'60',
	'65',
	'70',
	'77.5',
	'85',
	'92.5',
	'100',
	'110',
	'125',
	'150',
	'175',
	'200',
	'250',
	'300',
	'400',
	'500'
];
export const selectedServices = (services: QuoteServices): ShippingService[] =>
	services === 'Both' ? ['UPS', 'LTL'] : [services];
export const blankPackage = (): PackageGroup => ({
	id: crypto.randomUUID(),
	quantity: 1,
	weight: 1,
	length: 12,
	width: 12,
	height: 12
});
export const DEFAULT_NMFC_CODE = '153500-02';
export const blankFreight = (): FreightItem => ({
	...blankPackage(),
	weight: 100,
	length: 48,
	width: 40,
	height: 48,
	description: '',
	freightClass: '',
	nmfc: DEFAULT_NMFC_CODE,
	stackable: false
});
export const blankRequest = (shipDate: string): ShippingRequest => ({
	services: 'UPS',
	branchId: '',
	customer: '',
	reference: '',
	shipDate,
	shipFrom: {
		address: '3177 Lehigh Street',
		city: 'Caledonia',
		state: 'NY',
		zip: '14423',
		residential: false
	},
	shipTo: { address: '', city: '', state: '', zip: '', residential: false },
	packages: [blankPackage()],
	freight: [blankFreight()],
	accessorials: {
		pickupLiftgate: false,
		deliveryLiftgate: false,
		insidePickup: false,
		insideDelivery: false,
		limitedAccessPickup: false,
		limitedAccessDelivery: false
	}
});
