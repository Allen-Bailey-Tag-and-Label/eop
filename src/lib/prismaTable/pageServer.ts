import { getActions, getLoad } from '$lib/prismaTable';
import { getFields } from './index';

export const pageServer = async (modelName: string) => {
	const fields = getFields(modelName);
	const fieldsRequiringRelation = fields
		.filter(({ relationFromFields }) => relationFromFields !== undefined)
		.reduce((map, { name, relationFromFields, type }) => {
			map.set(relationFromFields?.[0] || '', { key: name, model: type });
			return map;
		}, new Map<string, { key: string; model: string }>());

	return {
		actions: getActions(modelName),
		load: () => getLoad({ modelName, fields, fieldsRequiringRelation })
	};
};
