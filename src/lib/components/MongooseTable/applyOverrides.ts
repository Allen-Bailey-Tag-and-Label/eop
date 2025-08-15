import type { ColumnOverride, ColumnOverrides } from './types';

export const applyOverrides = (
	column: ColumnOverride,
	override?: ColumnOverrides['string']
): ColumnOverride => {
	if (!override) return column;
	if (override.hidden) return null as any;
	return {
		...column,
		...override,
		key: column.key
	};
};
