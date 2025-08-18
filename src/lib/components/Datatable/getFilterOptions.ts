import { filterOperators } from './filterOperators';
import type { ColumnSanitized } from './types';

const optionsByType = (labels: string[] = []) => [
	{ label: '', value: '' },
	...labels.map((label) => ({ label, value: label }))
];

export const getFilterOptions = ({
	column
}: {
	column: { key: string; type: string } | undefined;
}) => {
	let options: { label: string; value: any }[] = [{ label: '', value: '' }];

	if (!column) return options;

	const { type } = column;

	if (type === 'bigint') return optionsByType();
	if (type === 'boolean') return optionsByType(['does not equal', 'equals']);
	if (type === 'currency')
		return optionsByType([
			'does not equal',
			'equals',
			'greater than',
			'greater than or equals',
			'less than',
			'less than or equals'
		]);
	if (type === 'function') return optionsByType();
	if (type === 'multiSelect') return optionsByType(['in', 'not in']);
	if (type === 'number')
		return optionsByType([
			'does not equal',
			'equals',
			'greater than',
			'greater than or equals',
			'less than',
			'less than or equals'
		]);
	if (type === 'object') return optionsByType();
	if (type === 'string')
		return optionsByType([
			'contains',
			'does not contain',
			'does not equal',
			'equals',
			'greater than',
			'greater than or equals',
			'less than',
			'less than or equals'
		]);
	if (type === 'symbol') return optionsByType();
	if (type === 'undefined') return optionsByType();
	if (type === 'select') return optionsByType(['does not equal', 'equals']);
	if (type === 'timestamp')
		return optionsByType([
			'does not equal',
			'equals',
			'greater than',
			'greater than or equals',
			'less than',
			'less than or equals'
		]);

	return optionsByType();
};
