import { escapeRegex, isUiFilterArray, type UiFilter } from './';

export const filtersToMongoQuery = (
	filters: UiFilter[] | Record<string, any> | undefined | null
) => {
	if (!filters) return {};
	// Back-compat: already a Mongo object
	if (!isUiFilterArray(filters)) return filters;

	if (filters.length === 0) return {};

	const clauses = filters.map(({ key, operator, value }) => {
		switch (operator) {
			case 'equals':
				return { [key]: { $eq: value } };
			case 'does not equal':
				return { [key]: { $ne: value } };
			case 'greater than':
				return { [key]: { $gt: value } };
			case 'greater than or equals':
				return { [key]: { $gte: value } };
			case 'less than':
				return { [key]: { $lt: value } };
			case 'less than or equals':
				return { [key]: { $lte: value } };
			case 'in':
				return { [key]: { $in: Array.isArray(value) ? value : [value] } };
			case 'not in':
				return { [key]: { $nin: Array.isArray(value) ? value : [value] } };
			case 'exists':
				return { [key]: { $exists: true } };
			case 'not exists':
				return { [key]: { $exists: false } };
			case 'contains': {
				const rx = new RegExp(escapeRegex(String(value ?? '')), 'i');
				return { [key]: { $regex: rx } };
			}
			case 'does not contain': {
				const rx = new RegExp(escapeRegex(String(value ?? '')), 'i');
				return { [key]: { $not: { $regex: rx } } };
			}
			default:
				return {}; // unknown operator (shouldn't happen after sanitization)
		}
	});

	return clauses.length ? { $and: clauses } : {};
};
