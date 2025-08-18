import { filterOperators } from './filterOperators';

export const filterOperatorOptions = [
	{ label: '', value: '' },
	...filterOperators.map((operator) => ({
		label: operator,
		value: operator
	}))
];
