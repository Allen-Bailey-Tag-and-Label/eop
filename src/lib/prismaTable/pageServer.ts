import { getActions } from './getActions';
import { getFieldsRequiringRelation } from './getFieldsRequiringRelation';
import { getLoad } from './getLoad';
import { getFields } from './getFields';
import type { PageServer } from './types';

export const pageServer = async ({
	actions,
	columnOmits,
	columnOrder,
	columnOverrides,
	filters,
	isCreatable,
	isDeletable,
	isEditable,
	isExportable,
	isFilterable,
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
				filters,
				isCreatable,
				isDeletable,
				isEditable,
				isExportable,
				isFilterable,
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
