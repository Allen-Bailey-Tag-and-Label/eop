import { getActions, getFieldsRequiringRelation, getLoad } from '$lib/prismaTable';
import { getFields } from './index';
import type { ActionParams, Column, Paginate, RelationLabelFns } from './types';

type Params = {
	actions?: Map<
		string,
		({ request }: ActionParams) => Promise<{
			success: boolean;
		}>
	>;
	columnOrder?: string[];
	columnOverrides?: Map<string, Partial<Column>>;
	modelName: string;
	paginate?: boolean | Pick<Paginate, 'currentPage' | 'numberOfRowsPerPage'>;
	relationLabelFns?: RelationLabelFns;
	sortDirection?: -1 | 1;
	sortKey?: string;
};

export const pageServer = async ({
	actions,
	columnOrder,
	columnOverrides,
	modelName,
	paginate,
	relationLabelFns,
	sortDirection,
	sortKey
}: Params) => {
	const fields = getFields(modelName);
	const fieldsRequiringRelation = getFieldsRequiringRelation(fields);

	return {
		actions: getActions({ actions, fields, fieldsRequiringRelation, modelName }),
		load: () =>
			getLoad({
				columnOrder,
				columnOverrides,
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
