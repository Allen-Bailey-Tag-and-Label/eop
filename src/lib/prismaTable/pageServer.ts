import { getActions, getLoad } from '$lib/prismaTable';
import { getFields } from './index';
import type { Paginate, RelationLabelFns } from './types';

type Params = {
	columnOrder?: string[];
	modelName: string;
	paginate?: boolean | Pick<Paginate, 'currentPage' | 'numberOfRowsPerPage'>;
	relationLabelFns?: RelationLabelFns;
	sortDirection?: -1 | 1;
	sortKey?: string;
};

export const pageServer = async ({
	columnOrder,
	modelName,
	paginate,
	relationLabelFns,
	sortDirection,
	sortKey
}: Params) => {
	const fields = getFields(modelName);
	const fieldsRequiringRelation = fields
		.filter(({ relationName }) => relationName !== undefined)
		.reduce((map, { isList, name, type }) => {
			map.set(`${isList ? name.slice(0, -1) : name}Id${isList ? 's' : ''}`, {
				key: name,
				model: type
			});
			return map;
		}, new Map<string, { key: string; model: string }>());

	return {
		actions: getActions({ fields, fieldsRequiringRelation, modelName }),
		load: () =>
			getLoad({
				columnOrder,
				fields,
				fieldsRequiringRelation,
				modelName,
				paginate,
				relationLabelFns,
				sortDirection,
				sortKey
			})
	};
};
