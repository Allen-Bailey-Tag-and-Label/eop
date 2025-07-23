export const filterOperators = [
	'contains',
	'does not contain',
	'does not equal',
	'equals',
	'greater than',
	'greater than or equals',
	'less than',
	'less than or equals'
] as const;
export const filterOperatorOptions = [
	{ label: '', value: '' },
	...filterOperators.map((operator) => ({
		label: operator,
		value: operator
	}))
];
