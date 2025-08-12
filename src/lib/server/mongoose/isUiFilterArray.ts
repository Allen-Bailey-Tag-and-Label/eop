import type { UiFilter } from './types';

export const isUiFilterArray = (v: unknown): v is UiFilter[] => {
	return (
		Array.isArray(v) &&
		v.every((f) => f && typeof f.key === 'string' && typeof f.operator === 'string')
	);
};
