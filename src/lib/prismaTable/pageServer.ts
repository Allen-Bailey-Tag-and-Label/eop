import { getActions, getLoad } from '$lib/prismaTable';
import { getFields } from './index';
import type { RelationLabelFns } from './types';

type Params = {
	modelName: string;
	relationLabelFns?: RelationLabelFns;
};

export const pageServer = async ({ modelName, relationLabelFns }: Params) => {
	const fields = getFields(modelName);
	const fieldsRequiringRelation = fields
		.filter(({ relationFromFields }) => relationFromFields !== undefined)
		.reduce((map, { name, relationFromFields, type }) => {
			map.set(relationFromFields?.[0] || '', { key: name, model: type });
			return map;
		}, new Map<string, { key: string; model: string }>());

	return {
		actions: getActions({ fields, fieldsRequiringRelation, modelName }),
		load: () =>
			getLoad({
				fields,
				fieldsRequiringRelation,
				modelName,
				relationLabelFns
			})
	};
};
