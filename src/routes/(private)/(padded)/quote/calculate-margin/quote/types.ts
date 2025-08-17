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
	current?: Quote;
	customerType?: string;
	isNumberAlreadySet?: boolean;
	previous?: Quote;
	productType?: string;
};
