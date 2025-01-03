import { prisma } from '$lib/prisma';
import type { Column, Paginate, RelationLabelFns } from './types';

type Paramaters = {
	columnOmits?: string[];
	columnOrder?: string[];
	columnOverrides?: Map<string, Partial<Column>>;
	fields: any;
	fieldsRequiringRelation: any;
	formulaColumns?: Map<string, Partial<Column> & { formula: (row: any) => any }>;
	isCreatable?: boolean;
	isDeletable?: boolean;
	isEditable?: boolean;
	isSavable?: boolean;
	modelName: string;
	paginate?: boolean | Pick<Paginate, 'currentPage' | 'numberOfRowsPerPage'>;
	relationLabelFns?: RelationLabelFns;
	sortDirection?: -1 | 1;
	sortKey?: string;
};

export const getLoad = async ({
	columnOmits,
	columnOrder,
	columnOverrides,
	fields,
	fieldsRequiringRelation,
	formulaColumns,
	isCreatable,
	isDeletable,
	isEditable,
	isSavable,
	modelName,
	paginate,
	relationLabelFns,
	sortDirection,
	sortKey
}: Paramaters) => {
	const getColumns = new Promise(async (resolve) => {
		const columns = [
			...(await Promise.all(
				fields
					.filter(
						({ name, relationName }: { name: string; relationName?: string }) =>
							name !== 'id' && relationName === undefined && !columnOmits?.includes(name)
					)
					.map(async ({ isList, name, type }: { isList: boolean; name: string; type: string }) => {
						const column: Column = Object.assign(
							{
								isEditable: isEditable === undefined ? true : isEditable,
								isList: false,
								isRelational: false,
								isVisible: true,
								key: name,
								label: name,
								relationOptions: [],
								type,
								width: 229
							},
							columnOverrides !== undefined && columnOverrides.has(name)
								? columnOverrides.get(name)
								: {}
						);
						if (fieldsRequiringRelation.has(name)) {
							const { key: relationKey, model: relationModel } = fieldsRequiringRelation.get(
								name
							) || { key: '', model: '' };
							const relationLabelFn =
								relationLabelFns?.get(relationKey) || ((record) => record.label);
							column.isList = isList;
							column.isRelational = true;
							column.label = relationKey;
							column.relationKey = relationKey;
							column.relationOptions = [
								{ label: '', value: '' },
								// @ts-ignore
								...(await prisma[relationModel].findMany())
									.map(({ id, ...record }: { id: string; record: Record<string, any> }) => ({
										label: relationLabelFn(record),
										value: id
									}))
									.sort((a: any, b: any) => a?.label?.localeCompare?.(b?.label) || 0)
							];
						}
						return column;
					})
			))
		];
		resolve(columns);
	});
	// @ts-ignore
	const getRows = <Record<string, any>[]>prisma[modelName].findMany();

	return {
		columnOrder,
		columns: getColumns,
		isCreatable: isCreatable === undefined ? true : isCreatable,
		isDeletable: isDeletable === undefined ? true : isDeletable,
		isEditable: isEditable === undefined ? true : isEditable,
		isSavable: isSavable === undefined ? true : isSavable,
		paginate: paginate === undefined ? true : paginate,
		rows: getRows,
		sortDirection: sortDirection || 1,
		sortKey: sortKey || fields.filter(({ name }: { name: string }) => name !== 'id')[0].name
	};
};
