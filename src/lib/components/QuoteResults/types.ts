export type QuoteRateService = { code: string; title: string };
export type QuoteRateOption = {
	id: string;
	label: string;
	unitQuantity?: number;
	services: string[];
	status: 'pending' | 'running' | 'complete' | 'failed';
	rates: { serviceCode?: string; rate: number }[];
	message: string;
	packageTotalCount?: number;
	packageTotalWeight?: number;
	packageGroups?: { quantity: number; weight: number }[];
	casePacking?: { unitsPerCarton: number; cartonWeight: number };
};
