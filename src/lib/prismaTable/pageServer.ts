import { getActions, getFieldsRequiringRelation, getLoad } from '$lib/prismaTable';
import { getFields } from './index';
import type { PageServer } from './types';

export const pageServer = async ({
	actions,
	columnOmits,
	columnOrder,
	columnOverrides,
	isDeletable,
	isEditable,
	isSavable,
	modelName,
	paginate,
	relationLabelFns,
	sortDirection,
	sortKey
}: PageServer) => {
	const fields = getFields(modelName);
	const fieldsRequiringRelation = getFieldsRequiringRelation(fields);

	return {
		actions: getActions({ actions, fields, fieldsRequiringRelation, modelName }),
		load: () =>
			getLoad({
				columnOmits,
				columnOrder,
				columnOverrides,
				isDeletable,
				isEditable,
				isSavable,
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
