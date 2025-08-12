import {
	allowedOperations,
	coerceByType,
	getPathInfo,
	isKeyAllowed,
	type Model,
	type UiFilter
} from './';

export const sanitizeUiFilters = (raw: unknown, model: Model<any>): UiFilter[] => {
	if (!Array.isArray(raw)) return [];

	return raw
		.map(
			(f: any): UiFilter => ({
				key: typeof f?.key === 'string' ? f.key : '',
				operator: typeof f?.operator === 'string' ? f.operator : '',
				value: f?.value
			})
		)
		.filter((f) => f.key && allowedOperations.has(f.operator) && isKeyAllowed(model, f.key))
		.map((f) => {
			const { exists, type, parentType } = getPathInfo(model, f.key);
			const effectiveType = type ?? parentType; // prefer exact, else parent, else undefined

			if (f.operator === 'in' || f.operator === 'not in') {
				const arr = Array.isArray(f.value) ? f.value : f.value ? [f.value] : [];
				return { ...f, value: arr.map((v) => coerceByType(v, effectiveType)) };
			}

			if (f.operator === 'contains' || f.operator === 'does not contain') {
				return { ...f, value: String(f.value ?? '') }; // regex later
			}

			if (f.operator === 'exists' || f.operator === 'not exists') {
				return { ...f, value: true };
			}

			return { ...f, value: coerceByType(f.value, effectiveType) };
		});
};
