import type { ColumnOverride, ColumnOverrides } from './types';

export const applyOverrides = (
	column: ColumnOverride,
	override?: ColumnOverrides['string']
): ColumnOverride => {
	if (!override) return column;
	return {
		...column,
		...override,
		key: column.key
	};
};
