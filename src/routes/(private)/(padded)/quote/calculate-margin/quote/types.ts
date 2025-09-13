import type { PageData } from './$types';

export type Quote = {
	date: string;
	labor: string;
	margin: string;
	material: string;
	number: string;
	sell: string;
	totalCost: string;
};
export type Props = {
	_branchId?: string;
	current?: Quote;
	customerType?: string;
	data: PageData;
	isNumberAlreadySet?: boolean;
	previous?: Quote;
	productType?: string;
};
